# Decisões

Use uma seção para cada problema investigado ou decisão tomada, copiando o bloco abaixo quantas vezes precisar. Escreva do seu jeito, sem se preocupar com formalidade.

# Decisões

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
---

## Lembrete com n8n (bônus, se você fizer)

**Como montei o fluxo**

**Como testei**

**O que mudaria para usar em produção**

## Ordem das funcionalidades, com justificativa

## Como usei IA

## O que ficou de fora
