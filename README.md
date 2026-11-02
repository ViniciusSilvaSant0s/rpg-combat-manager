# RPG Combat Manager

O RPG Combat Manager é uma aplicação full-stack destinada ao gerenciamento de
combates de RPG por turnos.

## Pré-requisito

- Docker Desktop com Docker Compose habilitado.

## Inicialização

No diretório raiz do projeto, execute:

```bash
docker compose up --build
```

Após a inicialização, a aplicação estará disponível em:

- Frontend: `http://localhost:5173`
- API — health check: `http://localhost:3000/health`

## Configuração da API

O arquivo `server/.env` contém as variáveis locais da API e não é versionado.
Em um novo checkout, copie `server/.env.example` para `server/.env` antes de
iniciar o Compose. Preencha `ORACLE_USER`, `ORACLE_PASSWORD` e
`ORACLE_CONNECT_STRING` com os dados do banco. Para o Autonomous Database,
use a string de conexão TLS (`tcps://`) fornecida em **Database connection**
no console da Oracle, incluindo host, porta e nome do serviço. O acesso de rede
à instância deve estar autorizado. O driver usa o modo Thin, sem Oracle Client
ou Wallet; preserve a validação de certificado na string de conexão.

Configure `FIREBASE_PROJECT_ID` no `server/.env`. Para o frontend, copie
`rcm-front/.env.example` para `rcm-front/.env` e preencha os dados da
configuração Web do projeto Firebase. Os valores `VITE_` são enviados ao
navegador e não são segredos; nunca coloque uma chave de conta de serviço no
frontend. O trecho anteriormente fornecido em
`server/config/firebase-service-account.json` é uma configuração Web, não uma
conta de serviço, e não é utilizado pela API.

No console Firebase Authentication, habilite e-mail/senha e Google, autorize o
domínio usado pela aplicação e configure o envio de e-mails de verificação. A
API valida o ID token com Firebase Admin e usa o identificador do projeto; ela
não precisa de chave de conta de serviço para a validação normal do token. O
health check verifica apenas o processo HTTP, não Firebase ou Oracle.

O frontend envia o token como Bearer para consultar e salvar `/api/profile`.
O nickname deve ter de 3 a 20 letras ASCII, números ou sublinhado. O cadastro
exige data de nascimento e, para e-mail/senha, a confirmação do e-mail.
## Migrations do banco

O Flyway roda somente mediante comando explícito. Configure `FLYWAY_URL` com a
string JDBC TCPS sem Wallet do banco e informe `FLYWAY_USER` e
`FLYWAY_PASSWORD` no `server/.env`. Confira acesso de rede, certificado,
versão/licença do Flyway e permissões no schema antes da primeira execução.
Consulte as migrations pendentes com `docker compose run --rm migrations info`
e, quando desejar alterar o banco configurado, execute
`docker compose run --rm migrations migrate`. Os arquivos SQL ficam em
`server/migrations`. DDL Oracle pode confirmar alterações implicitamente;
examine falhas antes de tentar novamente.

## Diagrama do banco de dados

O arquivo [database.dbml](docs/database.dbml) descreve as tabelas e os índices
definidos pelas migrations. Para visualizar o diagrama, copie seu conteúdo para
o editor do [dbdiagram.io](https://dbdiagram.io/). Atualize o arquivo sempre
que uma migration alterar o esquema. O diagrama representa o esquema planejado
pelas migrations; o banco somente terá essas alterações após sua execução.
