# Ambiente Docker de desenvolvimento

## Objetivo

Executar o frontend React/Vite e a API Express/TypeScript com Docker Compose,
sem exigir Node.js na maquina hospedeira e preservando a iteracao com hot reload.

## Servicos

- `front`: constroi `rcm-front`, publica `5173` e inicia Vite em
  `0.0.0.0`. O codigo fonte e montado no container e as dependencias ficam em
  um volume nomeado exclusivo.
- `server`: constroi `server`, publica `3000` e inicia `tsx watch`. O codigo
  fonte e montado no container e as dependencias ficam em outro volume nomeado.
  O endpoint `GET /health` continua sendo a verificacao de saude.

## Integracao

O Vite encaminhara requisicoes com o prefixo `/api` para `server:3000` na rede
interna do Compose e removera esse prefixo. Assim, uma chamada do navegador a
`/api/health` chega ao endpoint da API `/health`, sem expor uma URL de backend
no frontend nem exigir CORS durante o desenvolvimento.

## Operacao e verificacao

Cada aplicacao tera um `Dockerfile` e `.dockerignore`, usando `npm ci` a partir
de seu lockfile. O Compose usara observacao de arquivos compativel com Docker
Desktop no Windows, iniciara o frontend apos a saude da API e documentara os
comandos de inicio, logs, parada e reconstrução. A verificacao cobrira a
sintaxe do Compose, build, frontend, saude direta da API, proxy `/api` e recarga
apos alteracoes nos fontes.

## Limites

O escopo e apenas desenvolvimento local: nao inclui imagem de producao, Nginx,
proxy reverso externo ou deploy.
