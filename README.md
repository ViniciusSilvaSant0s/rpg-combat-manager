# RPG Combat Manager

Este repositorio contem um sistema full-stack destinado ao gerenciamento de combates de RPG.

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
