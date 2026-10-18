import type { Combatant } from './types/combatant'

export function orderCombatants(combatants: Combatant[]): Combatant[] {
  const priority = (combatant: Combatant) => combatant.naturalInitiative === 20
    ? 0 : combatant.naturalInitiative === 1 ? 2 : 1

  return [...combatants].sort((first, second) => {
    const difference = priority(first) - priority(second)
    if (difference !== 0) return difference
    if (first.initiative === null) return second.initiative === null ? 0 : 1
    if (second.initiative === null) return -1
    return second.initiative - first.initiative
  })
}
