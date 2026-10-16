# Decisões

Use uma seção para cada problema investigado ou decisão tomada, copiando o bloco abaixo quantas vezes precisar. Escreva do seu jeito, sem se preocupar com formalidade.

## Agenda não atualizava ao trocar de profissional

**O que eu vi**

Ao rodar o lint, percebi que o `profissionalId` não estava na array de dependências do `useEffect` responsável por buscar a agenda. Isso chamou minha atenção porque havia um relato de que, às vezes, ao trocar de profissional, a agenda anterior continuava aparecendo.

**O que achei que era**

Suspeitei que o efeito não estava executando novamente quando o profissional selecionado mudava, fazendo com que a agenda antiga continuasse sendo exibida.

**Como confirmei**

Reproduzi o problema no front-end, trocando o profissional selecionado e observando que a agenda não era atualizada corretamente.

**O que fiz e por quê**

Adicionei `profissionalId` à array de dependências do `useEffect`, garantindo que uma nova requisição fosse feita quando o profissional mudasse.

Depois disso, percebi que ainda havia uma melhoria possível: durante a troca de profissional ou de data, a agenda anterior poderia continuar aparecendo até a resposta da nova requisição chegar.

Para resolver isso, adicionei uma `key` ao componente `AgendaDoDia`, composta pelo ID do profissional e pela data. Assim, quando um desses valores muda, o componente é recriado e a agenda começa como `null`, exibindo a mensagem de carregamento até os novos dados chegarem.

**Como testei**

Reproduzi a troca de profissionais no front-end e verifiquei o comportamento da agenda. Também considerei a troca de datas para garantir que o carregamento fosse exibido enquanto os novos dados eram buscados.

**O que considerei e descartei**

Considerei limpar a agenda com `setAgenda(null)` no início do `useEffect`, mas essa abordagem gerou um aviso do lint sobre atualizações síncronas de estado dentro de efeitos. Optei por usar a `key` para reiniciar o componente quando o profissional ou a data mudassem, evitando essa atualização adicional de estado. Além disso, como a `key` depende apenas do profissional e da data, o componente não é recriado quando ocorre uma atualização da agenda, como um cancelamento ou registro de falta, preservando os estados internos dos componentes e evitando uma reinicialização desnecessária.

**Quanto tempo levou**

20 minutos, pois foi a primeira coisa que fiz ao abrir o projeto e ainda estava me situando com o código.

## Horário continuava indisponível após cancelamento

**O que eu vi**

Foi relatado que, após alguém cancelar uma consulta, outras pessoas continuavam sem conseguir marcar naquele mesmo horário.

**O que achei que era**

Pelo relato, suspeitei que faltava um filtro na consulta ao banco de dados. A query parecia considerar apenas a data e o profissional, sem levar em conta o status da consulta. Assim, consultas canceladas continuavam sendo consideradas ao verificar a disponibilidade do horário.

**Como confirmei**

Investiguei o fluxo de agendamento para identificar se o problema acontecia na página do recepcionista ou na página do paciente. Identifiquei que estava na página do paciente e localizei a query responsável por verificar os horários disponíveis.

**O que fiz e por quê**

Ajustei a query para considerar o status das consultas, desconsiderando as que foram canceladas na verificação de disponibilidade. Fiz isso para garantir que horários liberados por cancelamentos pudessem ser agendados novamente.

**Como testei**

Verifiquei a lógica da query para garantir que consultas canceladas não fossem mais consideradas na verificação de disponibilidade.

**O que considerei e descartei**

Como o problema estava na consulta ao banco de dados, não foi necessário alterar o fluxo de agendamento ou implementar novas regras de negócio. A correção foi feita diretamente na query.

**Quanto tempo levou**

10 minutos
## Data da consulta exibida com um dia de diferença

**O que eu vi**

Enquanto mexia na aplicação, percebi que a data exibida na agenda não correspondia à data esperada. Depois, relacionei esse comportamento ao relato de uma paciente que via a consulta na quarta-feira, enquanto a recepção a via na terça-feira.

**O que achei que era**

Suspeitei de um problema de fuso horário na conversão da data, fazendo com que ela fosse exibida com um dia de diferença dependendo de como era interpretada pelo JavaScript.

**Como confirmei**

Comparei a data armazenada com a data exibida na interface e identifiquei que o uso de `new Date(agenda.data)` estava interpretando a data como UTC, causando a mudança para o dia anterior no fuso horário brasileiro.

**O que fiz e por quê**

Ajustei a conversão da data para evitar que o fuso horário alterasse o dia exibido. Inicialmente, utilizei `T12:00:00` para reduzir o risco de mudança de dia, mas depois refinei a solução para trabalhar explicitamente com UTC.

**Como testei**

Verifiquei a data exibida na agenda para confirmar que o dia correspondia à data esperada, sem retroceder para o dia anterior.

**O que considerei e descartei**

Considerei que o problema poderia estar na data armazenada ou na lógica de agendamento, mas identifiquei que a inconsistência acontecia na formatação da data no front-end. Também considerei separar manualmente dia, mês e ano ou utilizar `T12:00:00`, mas optei por usar `T00:00:00Z` junto com `timeZone: 'UTC'` no `toLocaleDateString`. Essa abordagem deixa explícito que a data deve ser interpretada e formatada em UTC, evitando dependência do fuso horário do navegador e garantindo maior consistência para usuários em diferentes localizações.

**Quanto tempo levou**

20 minutos.

## Correção da verificação de conflitos entre horários

**O que eu vi**

A função `temConflito` verificava conflitos comparando apenas o horário de início das consultas. Com isso, dois agendamentos com horários de início diferentes, mas com duração sobreposta, poderiam ser considerados válidos.

**O que achei que era**

Identifiquei que a lógica precisava considerar o intervalo completo de cada consulta, e não apenas se os horários de início eram iguais.

**Como confirmei**

Analisei a implementação da função e percebi que a comparação `marcada.hora === nova.hora` não identificava sobreposições entre consultas com horários de início diferentes.

**O que fiz e por quê**

Modifiquei a função para calcular os horários de início e fim de cada consulta em minutos e verificar se os intervalos se sobrepõem. Assim, a função passou a identificar conflitos mesmo quando as consultas começam em horários diferentes.

**Como testei**

Verifiquei a lógica de comparação dos intervalos para garantir que consultas com sobreposição fossem identificadas como conflitos, enquanto consultas consecutivas, sem sobreposição, fossem permitidas.

**O que considerei e descartei**

Considerei utilizar diretamente as colunas `inicio` e `fim` para calcular os intervalos, mas, como a interface `Horario` já disponibilizava o tipo da consulta, percebi que poderia utilizar o mapa `DURACAO_MINUTOS` para determinar a duração de cada atendimento. Optei por essa abordagem para reaproveitar informações já disponíveis na aplicação e evitar a necessidade de adicionar novos campos à interface.

**Quanto tempo levou**

15 minutos


## Estado de carregamento infinito em novos clientes

**O que eu vi**

A tela de minhas consultas ficava em carregamento infinito para novos clientes que ainda não tinham consultas marcadas.

**O que achei que era**

Percebi que o problema estava na condição utilizada para exibir o carregamento. A aplicação usava `consultas.length === 0` para identificar se os dados ainda estavam sendo carregados, mas essa condição também era verdadeira quando a consulta à API retornava uma lista vazia.

**Como confirmei**

Analisei o componente `MinhasConsultas` e identifiquei que não havia uma distinção entre o estado de carregamento e o resultado de uma consulta sem registros.

**O que fiz e por quê**

Criei um estado específico chamado `carregando`, inicializado como `true`, e utilizei o método `finally` da requisição para desativá-lo quando a consulta à API terminasse, independentemente de sucesso ou erro.

Também alterei a renderização para exibir uma mensagem informando que o usuário ainda não tem consultas marcadas quando a lista estiver vazia e não houver erro. Dessa forma, a aplicação diferencia o carregamento de uma resposta sem resultados.

**Como testei**

Verifiquei os diferentes estados da tela: enquanto a requisição está em andamento, quando retorna consultas, quando retorna uma lista vazia e quando ocorre um erro. Além disso, usei o throttling do DevTools para testar com uma internet mais lenta e ficar mais fácil de identificar o estado de carregamento.

**O que considerei e descartei**

Considerei utilizar `null` como valor inicial de `consultas` e verificar se o estado era diferente de `null` para identificar quando a requisição terminasse. Porém, achei melhor criar um estado específico para o carregamento, separando essa informação dos dados retornados pela API. Assim, a lógica fica mais explícita e cada estado tem uma responsabilidade bem definida.

**Quanto tempo levou**

10 minutos

## Corrida na marcação de consultas: dois usuários conseguiam marcar o mesmo horário

**O que eu vi**
Dois usuários conseguiam marcar uma consulta para o mesmo profissional, na mesma data e no mesmo horário, quando as requisições chegavam quase ao mesmo tempo.

**O que achei que era**
Uma race condition do tipo *check-then-act*. A rota `POST /consultas` busca as consultas marcadas, verifica o conflito com `temConflito` e só depois cria a consulta, em operações separadas. Se duas requisições leem o banco antes de qualquer uma inserir, as duas concluem que o horário está livre.

**Como confirmei**
Li o código de `consultas.ts` e `agenda.ts` e vi que a lógica de sobreposição está correta, mas a checagem e a gravação não são atômicas. No `schema.prisma` só existe um índice por profissional e data, que não impede sobreposição. Depois reproduzi o problema com um script que dispara 10 requisições simultâneas para o mesmo horário, antes de alterar qualquer coisa. Resultado: `{ '201': 8, '409': 2 }`, ou seja, 8 consultas criadas no mesmo horário.

**O que fiz e por quê**
Criei uma migration com uma exclusion constraint no Postgres (`btree_gist` + `tstzrange(inicio, fim, '[)')`), filtrada por `status = 'agendada'`. Assim o banco garante a regra, independente de quantas instâncias da API estiverem rodando. O filtro de status permite remarcar um horário depois de um cancelamento. Mantive o `temConflito` na rota para responder rápido no caso comum. Não alterei o código da rota: o erro da constraint ainda não é tratado.

**Como testei**
Testei antes e depois da migration com um script gerado por IA, que dispara requisições simultâneas para o mesmo profissional e horário e conta os status recebidos. O script cancela as consultas criadas no final, para não impedir a criação da constraint.
- Antes da migration: `{ '201': 8, '409': 2 }` (8 consultas no mesmo horário).
- Depois da migration: `{ '201': 1, '409': 2, '500': 7 }`. Só 1 consulta foi criada, então o bug de dados duplicados foi resolvido. Quem perde a corrida para a constraint recebe 500 em vez de 409, porque o erro é levantado pelo banco. Pela interface, em uso normal, a resposta continua sendo 409, já que o `temConflito` pega o caso em que uma requisição não se sobrepõe à outra.

**O que considerei e descartei**
- Advisory lock por profissional dentro de uma transação: resolve, mas só protege os caminhos de código que o usam. Scripts, seeds ou rotas futuras poderiam burlar a regra.
- Manter só a checagem na aplicação: é justamente o que causa o bug.
- Tratar o erro `23P01` na rota para devolver 409: fica como próximo passo, para trocar o 500 por uma resposta adequada em caso de concorrência real.

**Quanto tempo levou**
Cerca de 1h. A maior parte foi para entender qual era o problema de fato e como resolvê-lo, já que a lógica de sobreposição estava correta e o erro estava na falta de atomicidade.

## Paciente conseguia marcar consultas em horários conflitantes

**O que eu vi**

Percebi, enquanto utilizava a aplicação, que um mesmo paciente conseguia marcar consultas com horários conflitantes para si.

**O que achei que era**

Ao investigar o código, percebi que não existia nenhuma restrição para impedir que um paciente marcasse duas consultas no mesmo horário ou em intervalos sobrepostos.

**Como confirmei**

Analisei o fluxo de agendamento no código e identifiquei que a verificação de conflitos não considerava as consultas que o próprio paciente já tinha marcado.

**O que fiz e por quê**

Adicionei uma consulta ao banco de dados para buscar os agendamentos existentes do paciente na mesma data, com status `agendada`. Em seguida, utilizei a função `temConflito` para verificar se o novo agendamento entrava em conflito com algum deles.

Caso exista conflito, a API retorna o status HTTP `409` e uma mensagem adequada, diferenciando o agendamento feito pelo próprio paciente daquele realizado por outro usuário em seu nome.

**Como testei**

Testei o fluxo pela interface antes e depois da alteração. Verifiquei que consultas conflitantes do mesmo paciente eram impedidas, inclusive quando tinham horários de início diferentes, mas seus intervalos se sobrepunham. Também verifiquei que agendamentos sem conflito continuavam sendo permitidos.

**O que considerei e descartei**

Optei por reutilizar a função `temConflito`, que já verifica a sobreposição entre os intervalos das consultas, em vez de comparar apenas os horários de início. Dessa forma, a validação também considera consultas com durações diferentes e horários parcialmente sobrepostos.

**Quanto tempo levou**

10 minutos.


## Folga não cancelava consultas já marcadas

**O que eu vi**

Ao registrar uma folga para um profissional, as consultas que já estavam agendadas para aquele dia continuavam com o status de agendadas. Isso poderia gerar inconsistências na agenda, já que o profissional estaria indisponível, mas os pacientes continuariam com consultas marcadas.

**O que achei que era**

O cadastro da folga apenas bloqueava novos agendamentos, sem tratar as consultas existentes para aquela data.

**Como confirmei**

Analisei a implementação da rota responsável por registrar folgas e identifiquei que ela apenas criava o registro na tabela de folgas, sem atualizar o status das consultas existentes.

**O que fiz e por quê**

Utilizei uma transação do Prisma (`$transaction`) para criar a folga e cancelar todas as consultas ainda agendadas para o profissional naquela data. Também registrei a data do cancelamento (`canceladaEm`). Dessa forma, as duas operações são atômicas: se uma falhar, nenhuma alteração é persistida. Além disso, adicionei um modal (para chamar mais a atenção do profissional) informando que todas as consultas seriam canceladas (caso tenha alguma marcada).

**Como testei**

Verifiquei o fluxo de criação da folga e o cancelamento das consultas agendadas, garantindo que as alterações fossem executadas dentro da mesma transação. Além disso, usei o prisma studio para acompanhar as consultas diretamente no banco.

**O que considerei e descartei**

Considerei manter as consultas agendadas e apenas bloquear novos agendamentos, mas descartei essa abordagem porque deixaria consultas ativas em um dia no qual o profissional não estaria disponível. Optei pelo cancelamento automático para manter a agenda consistente.

**Quanto tempo levou**

15 minutos.

## Redução de faltas em consultas com lembretes automáticos

**O que eu vi**

Pacientes faltam às consultas com frequência, inclusive alguns que faltam toda semana. Isso prejudica a organização da agenda e gera horários ociosos para os profissionais.

**O que achei que era**

Parte das faltas pode acontecer por esquecimento ou falta de confirmação dos pacientes sobre os horários agendados. Um lembrete antecipado poderia ajudar a reduzir esse problema.

**Como confirmei**

Identifiquei a necessidade de avisar os pacientes sobre as consultas agendadas com antecedência, sem depender de um profissional para entrar em contato manualmente com cada um.

**O que fiz e por quê**

Criei um workflow no n8n que envia um e-mail aos pacientes exatamente 24 horas antes das consultas agendadas. A solução busca reduzir faltas causadas por esquecimento e diminuir a necessidade de contato manual pela equipe.

**Como testei**

Comecei testando cada etapa com valores absolutos para facilitar a identificação de possíveis erros, utilizando, por exemplo, um `Wait` de 1 segundo e datas hard-coded. Depois, validei a lógica de cálculo das datas e o fluxo de execução para garantir que os lembretes fossem enviados no momento correto.

**O que considerei e descartei**

Considerei outras abordagens, como enviar todos os lembretes às 8h do dia anterior, mas descartei essa opção porque o requisito era enviar os e-mails com 24 horas de antecedência em relação a cada consulta. Também considerei realizar consultas à API e ao banco de dados a cada 30 minutos para identificar os próximos lembretes, mas descartei essa estratégia para evitar chamadas excessivas e processamento desnecessário. Optei por uma abordagem que atende ao prazo exigido sem gerar esse volume de requisições.

**Quanto tempo levou**

2h e meia

## Bloqueio de cancelamentos com menos de 24 horas de antecedência

**O que eu vi**

Identifiquei o problema de cancelamentos realizados no mesmo dia da consulta, gerando prejuízos financeiros e dificultando o aproveitamento dos horários disponíveis.

**O que achei que era**

A ausência de uma restrição para cancelamentos próximos ao horário da consulta permitia que os pacientes desmarcassem em cima da hora, sem tempo suficiente para a recepção reorganizar a agenda ou encaixar outro paciente.

**Como confirmei**

Analisei o fluxo de cancelamento e identifiquei que não havia um bloqueio que impedisse o próprio paciente de cancelar uma consulta com menos de 24 horas de antecedência.

**O que fiz e por quê**

Implementei uma restrição que impede o paciente de cancelar a própria consulta quando faltam menos de 24 horas para o atendimento. Também ajustei a interface para deixar a restrição clara ao usuário, evitando confusão e tentativas de cancelamento sem sucesso.

**Como testei**

Adicionei testes automatizados para verificar o comportamento do cancelamento dentro e fora do limite de 24 horas, garantindo que a restrição fosse aplicada corretamente.

**O que considerei e descartei**

Considerei manter o cancelamento disponível e apenas alertar o paciente sobre a proximidade da consulta, mas optei por bloquear a ação para garantir o cumprimento da regra. A solução busca reduzir prejuízos com cancelamentos de última hora, embora não impeça faltas ou cancelamentos realizados por outros meios.

**Quanto tempo levou**

15 minutos.


## Marcação de consultas urgentes pela recepção

**O que eu vi**

Percebi que o sistema não tinha uma opção para marcar consultas como urgentes, dificultando o encaixe de pacientes que precisam de atendimento prioritário, mesmo quando o horário desejado já está ocupado.

**O que achei que era**

A recepção precisava de uma forma simples de indicar que uma consulta era urgente, permitindo diferenciar esses casos durante o agendamento sem tornar o fluxo mais complexo.

**Como confirmei**

Analisei o fluxo de marcação de consultas e identifiquei a ausência de uma opção para sinalizar urgências.

**O que fiz e por quê**

Adicionei uma checkbox para que a recepcionista possa marcar uma consulta como urgente. A informação é transmitida entre o front-end e o back-end como um booleano, permitindo tratar a urgência durante o processo de marcação.

**Como testei**

Realizei testes automatizados para verificar o funcionamento da nova funcionalidade e garantir que a informação de urgência fosse tratada corretamente.

**O que considerei e descartei**

Considerei adicionar uma coluna de urgência à tabela de consultas, persistindo essa informação no banco de dados. Entretanto, como a urgência seria utilizada apenas durante o processo de marcação, sem necessidade identificada de consulta posterior, optei por não persistir o dado e manter a solução mais simples, passando-o como um booleano entre o front-end e o back-end.

**Quanto tempo levou**

20 minutos.

## Histórico do paciente com abas Geral e Faltas
**O que eu vi**

As faltas recorrentes eram um grande problema, então percebi que a recepção precisava de uma maneira de gerir essas faltas por paciente, pois na agenda da recepção, era possível consultar os dados das consultas do dia, mas não visualizar o histórico completo de um paciente nem identificar rapidamente suas faltas anteriores. Sendo assim, implementei os históricos para melhorar o controle e gestão do recepcionista

**O que achei que era**

Uma ação de histórico por paciente, acessível pela tabela da agenda, com uma visão geral das consultas e uma aba separada para faltas.

**Como confirmei**

Verifiquei que a API já tinha dados de consultas associados ao paciente, incluindo data, profissional e status. O status faltou permite identificar as faltas sem criar um novo tipo de registro.

**O que fiz e por quê**

Adicionei uma ação Histórico na tabela da agenda. Ela busca na API as consultas já ocorridas daquele paciente e abre um modal com duas abas:

- Geral: mostra o histórico completo.
- Faltas: mostra apenas consultas com status faltou.
A rota do histórico é restrita à recepção. Por enquanto, a aba de faltas filtra os dados já carregados no frontend, evitando uma chamada extra à API ao alternar de aba. Se o histórico crescer, pode fazer sentido filtrar e paginar no backend.

**Como testei**

Os testes da API para histórico e consultas passaram: 9 testes. Também passaram o typecheck da API e do frontend, o ESLint dos arquivos alterados e a verificação de formatação do diff. Além disso, testei pela interface.

**O que considerei e descartei**

Considerei fazer uma chamada à API separada ao abrir a aba Faltas, mas descartei porque a aba representa um subconjunto do histórico já carregado, e criar uma rota só para isso adicionaria complexidade ao código e chamadas desnecessárias à API e ao Banco, já que os dados já estavam disponíveis no frontend.

**Quanto tempo levou**

15 minutos

## Filtro de profissionais por especialidade no agendamento

**O que eu vi**

Percebi que, para marcar uma consulta, o paciente precisava procurar na lista de profissionais qual ou quais atendiam na especialidade desejada. Isso tornava a busca mais trabalhosa.

**O que achei que era**

Achei que um filtro por especialidade ajudaria o paciente a encontrar mais facilmente o profissional adequado.

**Como confirmei**

Verifiquei que a tela de agendamento já carregava a lista de profissionais com seus nomes e especialidades.

**O que fiz e por quê**

Adicionei um select de especialidade à tela. Ao escolher uma opção, a lista de profissionais é filtrada para mostrar somente aqueles daquela especialidade. Mantive a opção de ver todas as especialidades e limpei o profissional selecionado quando o filtro muda, para evitar manter uma seleção que não corresponde ao filtro atual.

**Como testei**

Adicionei um teste automatizado que verifica a lista inicial de profissionais e confirma que, ao selecionar uma especialidade, só aparecem profissionais correspondentes. Também executei os testes pela interface, os do workspace web, o typecheck e o lint dos arquivos alterados.

**O que considerei e descartei**

Considerei fazer o filtro no back-end, mas descartei essa opção porque o front-end já recebia todas as informações necessárias — nome e especialidade — para filtrar a lista. Assim, foi possível resolver a dificuldade sem alterar a API.

**Quanto tempo levou**

5 minutos.

---

## Lembrete com n8n (bônus, se você fizer)

**Como montei o fluxo**

O fluxo fica em `n8n/lembrete.json` e tem estes nós:

Schedule Trigger (todo dia às 07:00) → HTTP Request → Loop Over Items (lote de 1) → Wait → Send Email.

- **HTTP Request:** uma única chamada por dia a `GET /integracoes/lembretes`, com o cabeçalho `x-chave-integracao`. Inicialmente enviei o parâmetro `data` com o dia seguinte (`{{ $now.setZone('America/Recife').plus({ days: 1 }).toFormat('yyyy-MM-dd') }}`), mas depois vi que, sem nenhum Query Parameter, a rota já usa dia+1 por padrão. A chave está direto no cabeçalho (valor de desenvolvimento local), e em produção iria para uma credencial do n8n.
- **Loop Over Items:** processa uma consulta por vez, para que cada uma tenha a sua própria espera. Como a response já vinha ordenada, não foi necessário ordenar no workflow, já que uma response fora de ordem travaria o envio de email de consultas anteriores.
- **Wait (At Specified Time):** pausa até 24h antes da consulta, calculado com `DateTime.fromISO(data + 'T' + hora, { zone: 'America/Recife' }).minus({ hours: 24 }).toISO()`. Rodando às 07:00, o horário de "24h antes" das consultas de amanhã a partir das 07:00 cai entre 07:00 e 23:59 do dia atual, então cada uma é agendada em uma única execução. Consultas de amanhã antes das 07:00 já passaram do horário de 24h antes, e o Wait segue imediatamente, enviando o e-mail na hora da execução.
- **Send Email:** SMTP do Mailpit (`mailpit:1025`, sem autenticação), com nome do paciente, data, hora, profissional e especialidade.
- **Tratamento de erro:** o Send Email usa *Continue (using error output)*. A saída de erro passa por um segundo e-mail de alerta (genérico, sem dados da consulta) e volta para o loop, então a falha de uma consulta não interrompe as demais.

**Como testei**

Testei cada etapa isoladamente antes de juntar tudo:

1. Executei o HTTP Request sozinho e conferi que retornava as consultas do dia (`[33]` itens no teste).
2. Troquei o Wait por um intervalo curto (poucos segundos) para validar o loop e o envio sem esperar horas, e conferi os e-mails no Mailpit (`http://localhost:8025`).
3. Validei a expressão de data do Wait com consultas do seed, comparando o horário calculado com o esperado (consulta às 08:00 → espera até 08:00 do dia anterior).
4. Restaurei as configurações reais e exportei o fluxo.

**O que mudaria para usar em produção**

- **Evitar reenvio e perda de lembretes:** a API guardaria `lembreteEnviadoEm` na consulta e ofereceria uma rota para marcar como enviada. Hoje, reexecutar o fluxo manualmente reenvia tudo, e uma queda do n8n durante o dia perde os lembretes pendentes.
- **Consultas canceladas ou remarcadas:** os dados são lidos uma vez por dia, às 07:00, então uma consulta cancelada depois ainda recebe o lembrete. Em produção, o fluxo conferiria o status na API logo antes de enviar.
- **Consultas sem 24h de antecedência:** as marcadas depois da execução das 07:00 para o dia seguinte não recebem lembrete, e as de amanhã antes das 07:00 recebem o e-mail imediatamente, e não 24h antes. Seria preciso uma regra de produto (por exemplo, envio imediato para as marcadas tarde, e execução mais cedo ou mais de uma vez por dia).
- **Isolar falhas:** trocar o loop sequencial por um sub-workflow por consulta (*Execute Workflow*), para que uma execução longa não carregue todas as consultas do dia, e adicionar *Retry On Fail* antes do alerta.
- **Alertas e monitoramento:** o alerta atual não diz qual consulta falhou. Em produção, incluiria paciente e mensagem de erro, usaria um *Error Workflow* para falhas gerais (como a busca inicial) e enviaria para Slack ou Telegram em vez de e-mail.
- **Infraestrutura e segredos:** chave de integração em credencial do n8n (Header Auth) com rotação, SMTP real (SES, SendGrid etc.) com credenciais seguras, HTTPS entre n8n e API, fuso horário do workflow configurado como `America/Recife` e n8n com Postgres em vez de SQLite.


## Ordem das funcionalidades, com justificativa

## Como usei IA

## O que ficou de fora
