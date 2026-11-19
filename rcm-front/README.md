# React + TypeScript + Vite

## Organização das telas e componentes

As telas da aplicação ficam em `src/screens`. Componentes reutilizáveis usados por essas telas, como diálogos, ícones e elementos visuais, ficam em `src/components`.

## Chamadas à API

As chamadas HTTP do frontend ficam em `src/services`. Os componentes usam um service da funcionalidade, que por sua vez usa o cliente compartilhado:

```text
Componente → service da funcionalidade → services/api.ts → /api → backend
```

`api.ts` oferece `get`, `post`, `put`, `patch` e `delete`. Os caminhos são relativos a `/api` (por exemplo, `/combatants`). O cliente recebe o token Firebase quando necessário, envia-o no cabeçalho `Authorization` e serializa corpos como JSON. Ele retorna o `Response` original, inclusive em respostas de erro, para que cada service trate os códigos HTTP adequados à sua funcionalidade. Erros de rede são propagados.

`combatants.ts` concentra listagem, criação, edição e exclusão de fichas, obtém o token da sessão atual e transforma falhas HTTP em erros para a tela tratar. Uma exclusão bem-sucedida pode retornar HTTP 204 sem corpo. `profile.ts` concentra as operações de perfil e preserva as respostas para a tela distinguir, por exemplo, perfil inexistente (404) e conflito (409). A autenticação com o SDK Firebase continua no componente de autenticação; apenas as chamadas ao backend passam pelos services.

Para adicionar uma integração, crie um service para a funcionalidade, implemente suas operações usando `api` e chame essas operações no componente. Mantenha mensagens, carregamento e estado visual na tela. Em desenvolvimento, o proxy do Vite encaminha `/api` para o servidor, removendo esse prefixo.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

Para hospedagem em produção, configure o servidor para retornar `index.html` ao acessar diretamente rotas do frontend (por exemplo, `/combates/123`). Preserve o encaminhamento de `/api` ao backend; ele não deve usar esse fallback.
