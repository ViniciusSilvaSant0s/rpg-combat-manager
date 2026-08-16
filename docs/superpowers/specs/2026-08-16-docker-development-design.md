# Ambiente Docker de desenvolvimento

## Objetivo

Permitir executar o frontend React e a API Express localmente por meio de Docker Compose, sem exigir Node.js instalado na maquina hospedeira.

## Estrutura

- `docker-compose.yml`: orquestra os servicos `front` e `back`.
- `rcm-front/Dockerfile` e `rcm-front/.dockerignore`: imagem de desenvolvimento do Vite.
- `rcm-back/`: API Express minima, com `Dockerfile`, `.dockerignore`, `package.json` e `src/server.js`.

## Servicos

### Frontend

O servico `front` sera construido a partir de `rcm-front`, publicado na porta `5173` e executara o Vite com `--host 0.0.0.0`. O codigo-fonte sera montado como volume para hot reload. Um volume nomeado preservara `node_modules` do container e evitara conflitos com dependencias do host.

### Backend

O servico `back` sera construido a partir de `rcm-back`, publicado na porta `3000` e executara uma aplicacao Express em modo watch. A aplicacao respondera `GET /health` com um estado saudavel. O codigo e as dependencias seguirao a mesma estrategia de volumes do frontend.

## Operacao

`docker compose up --build` cria e inicia ambos os servicos. A documentacao tambem cobrira como executar em segundo plano, interromper os servicos e reconstruir imagens. A configuracao e destinada ao desenvolvimento local; nao inclui Nginx, proxy reverso ou ajuste de producao.

## Documentacao e verificacao

O README contera pre-requisitos, URLs e comandos. `instructions.md` registrara as convencoes de diretorios, servicos e portas. A verificacao inclui validar a sintaxe do Compose, construir as imagens e consultar `/health` na API.
