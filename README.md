# RPG Combat Manager

Este repositorio contem um sistema full-stack destinado ao gerenciamento de combates de RPG.

## Desenvolvimento com Docker

O ambiente de desenvolvimento com Docker Compose sobe dois servicos:

- `front`: aplica o codigo de `rcm-front`, exposta somente em `127.0.0.1:5173`
- `server`: aplica o codigo de `server`, exposta somente em `127.0.0.1:3000`

O frontend usa proxy de desenvolvimento para encaminhar requisicoes feitas para
`/api` ao backend no endereco interno `http://server:3000`, removendo o prefixo.
Assim, `http://localhost:5173/api/health` chega ao endpoint
`http://server:3000/health`.

### Pre-requisitos

- Docker Desktop com Docker Compose habilitado

### Comandos principais

Subir o ambiente em primeiro plano:

```bash
docker compose up --build
```

Subir em background:

```bash
docker compose up --build -d
```

Reaplicar alteracoes em `package.json` ou `package-lock.json` nos servicos ja existentes:

```bash
docker compose restart
```

Ver logs combinados:

```bash
docker compose logs -f
```

Ver logs de um servico especifico:

```bash
docker compose logs -f front
docker compose logs -f server
```

Parar e remover containers:

```bash
docker compose down
```

Parar e remover containers, rede e volumes nomeados de dependencias:

```bash
docker compose down -v
```

### URLs uteis

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000/health`
- Proxy do frontend para a API: `http://localhost:5173/api/health`

### Observacoes

- Os diretorios do projeto sao montados por bind mount para permitir hot reload.
- Cada servico usa seu proprio volume nomeado para `node_modules`, evitando conflito
  entre dependencias do host e do container.
- A cada inicializacao de container, o comando de startup executa `npm ci` antes
  do servidor correspondente. Isso reaplica fielmente as dependencias descritas
  no `package-lock.json` atual dentro do volume nomeado persistente. Por isso,
  `docker compose restart` faz os containers iniciarem de novo, dispara `npm ci`
  e sincroniza as dependencias sem exigir rebuild da imagem apenas porque o
  lockfile mudou.
- O frontend espera a API ficar saudavel antes de iniciar.
- O Vite e a observacao de arquivos usam polling para funcionar de forma mais
  robusta no Docker Desktop e no Windows.

## Tecnologias previstas

- Frontend: React
- Backend: Express

## Organizacao do repositorio

O repositorio deve conter as seguintes partes da aplicacao:

- uma aplicacao frontend desenvolvida em React;
- uma API backend desenvolvida em Express.

A estrutura de diretorios sera definida de acordo com a evolucao do projeto, preservando a separacao entre frontend e backend.

## Arquitetura do Frontend

O frontend em React deve adotar uma arquitetura atomica e orientada a componentes, observando os seguintes principios:

- a interface deve ser composta por componentes pequenos, coesos e reutilizaveis;
- os componentes reutilizaveis devem ser estritamente de apresentacao, recebendo dados e callbacks por propriedades;
- as paginas devem concentrar a composicao dos componentes, o gerenciamento de estado e a logica especifica de cada tela;
- regras e comportamentos particulares de uma tela nao devem ser acoplados aos componentes reutilizaveis.

## Arquitetura da API

A API backend deve adotar o padrao MVC e manter responsabilidades claramente separadas nas seguintes camadas:

- `routes`: definicao dos endpoints e encaminhamento para os controllers;
- `controllers`: tratamento das requisicoes e respostas HTTP;
- `services`: implementacao das regras de negocio;
- `repositories`: acesso e persistencia dos dados;
- `models`: definicao das entidades e estruturas de dados do dominio.
