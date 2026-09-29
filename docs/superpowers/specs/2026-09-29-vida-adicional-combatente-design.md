# Especificação: vida adicional de combatentes

## Objetivo

Permitir que cada combatente tenha vida adicional opcional, preservar o limite
de vida atual pela vida máxima e permitir converter excedentes de cura em vida
adicional mediante confirmação. A funcionalidade pertence ao modo offline
existente e continua usando o `localStorage`.

## Modelo e compatibilidade

- Adicionar `additionalHitPoints: number | null` ao tipo `Combatant` e ao dado
  recebido pelo formulário.
- `null` representa ausência de vida adicional. O campo do formulário é
  opcional; vazio é salvo como `null`.
- Combatentes já persistidos sem a propriedade devem continuar sendo carregados
  com `additionalHitPoints: null`, sem perder os demais dados.
- Como o formulário atual permite salvar vida atual acima da máxima, a carga de
  dados antigos deve ajustar esses valores para a vida máxima, preservando os
  demais dados do combatente.
- A validação do formulário impede vida atual maior que vida máxima. O limite
  superior também é mantido por ações de combate. Não se altera o limite
  inferior atual da vida, que pode ficar negativa após dano.

## Apresentação

- Incluir “Vida adicional” como campo opcional na seção de PV do formulário,
  tanto ao criar quanto ao editar combatente.
- Nos cards de combatente e nas linhas de PV no combate, mostrar
  `PV: atual / máxima` quando não houver vida adicional e
  `PV: atual / máxima - adicional` quando o valor for maior que zero.
- A vida adicional nula não deve aparecer visualmente nos cards nem nas linhas
  de PV. Se o valor adicional for zero, tratar como ausência para apresentação.

## Regras do combate

- Dano consome primeiro a vida adicional. Se o dano exceder essa reserva,
  consome o restante da vida atual. Uma reserva consumida passa a `null`.
- Cura restaura a vida atual até, no máximo, a vida máxima.
- Se uma cura ultrapassar o máximo, apresentar uma confirmação indicando a
  quantidade excedente e perguntar se o usuário deseja convertê-la em vida
  adicional.
- Se confirmado, adicionar o excedente à vida adicional existente (ou iniciar
  a reserva com esse excedente quando ela for nula). Se recusado, aplicar a
  cura apenas até a vida máxima e descartar o excedente.
- Desfazer a ação deve restaurar vida atual e adicional ao estado anterior,
  independentemente de a ação ter sido dano ou cura.

## Componentes e fluxo

As alterações ficam no frontend. `CombatantFormDialog` coleta e valida o novo
campo; `QuickCombatScreen` mantém criação, edição e persistência; a validação
de `combatantStorage` migra registros antigos; `CombatScreen` executa dano,
cura e desfazer, e apresenta as linhas de PV. Não há mudança de API: o servidor
atual apenas expõe health check e não armazena combatentes.

## Verificação

Atualizar os testes existentes do formulário e do combate para cobrir o campo
opcional, validação do máximo, compatibilidade com dados persistidos antigos,
apresentação condicional da reserva, cura excedente aceita/recusada, dano
absorvido pela reserva e desfazer restaurando ambos os valores. Os testes devem
seguir os comandos e padrões já usados pelo frontend.

## Fora de escopo

- Persistência de combatentes na API ou banco de dados.
- Alteração de regras de iniciativa, defesa ou turnos.
- Alteração do comportamento de vida negativa já existente.
