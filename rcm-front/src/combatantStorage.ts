import type { Combatant } from './types/combatant'

const storageKey = 'rpg-combat-manager.combatants'

export function loadCombatants(): Combatant[] {
  try {
    const storedCombatants = localStorage.getItem(storageKey)

    if (!storedCombatants) {
      return []
    }

    const parsedCombatants: unknown = JSON.parse(storedCombatants)

    if (!Array.isArray(parsedCombatants) || !parsedCombatants.every(isCombatant)) {
      return []
    }

    return parsedCombatants
  } catch {
    return []
  }
}

export function saveCombatants(combatants: Combatant[]) {
  localStorage.setItem(storageKey, JSON.stringify(combatants))
}

function isCombatant(value: unknown): value is Combatant {
  if (!value || typeof value !== 'object') {
    return false
  }

  const combatant = value as Record<string, unknown>

  return (
    typeof combatant.id === 'string'
    && combatant.id.length > 0
    && (combatant.type === 'player' || combatant.type === 'npc')
    && typeof combatant.name === 'string'
    && combatant.name.trim().length > 0
    && isInteger(combatant.currentHitPoints)
    && isInteger(combatant.maximumHitPoints)
    && isInteger(combatant.armorClass)
    && combatant.armorClass >= 0
    && (combatant.initiative === null || isInteger(combatant.initiative))
  )
}

function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value)
}
