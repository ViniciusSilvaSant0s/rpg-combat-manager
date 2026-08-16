# rpg-combat-manager

Projeto full-stack para gerenciamento de combates de RPG.

## Stack planejada

- Frontend: React
- Backend: Express

## Estrutura do projeto

Este repositorio deve conter as duas partes da aplicacao:

- uma aplicacao frontend em React;
- uma API backend em Express.

A estrutura de pastas ainda sera definida conforme o desenvolvimento evoluir.

## Arquitetura da API

A API backend deve seguir o padrao MVC e manter responsabilidades separadas nas seguintes camadas:

- `routes`: definicao dos endpoints e associacao com os controllers;
- `controllers`: tratamento de requisicoes e respostas HTTP;
- `services`: regras de negocio;
- `repositories`: acesso e persistencia de dados;
- `models`: definicao das entidades e estruturas de dados do dominio.
