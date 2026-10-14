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

---

## Lembrete com n8n (bônus, se você fizer)

**Como montei o fluxo**

**Como testei**

**O que mudaria para usar em produção**

## Ordem das funcionalidades, com justificativa

## Como usei IA

## O que ficou de fora
