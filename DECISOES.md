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

---

## Lembrete com n8n (bônus, se você fizer)

**Como montei o fluxo**

**Como testei**

**O que mudaria para usar em produção**

## Ordem das funcionalidades, com justificativa

## Como usei IA

## O que ficou de fora
