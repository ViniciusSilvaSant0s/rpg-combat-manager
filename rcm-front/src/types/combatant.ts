import type { ConditionId } from '../conditions'

export type CombatantType = 'player' | 'npc'

export type Combatant = {
  id: string
  type: CombatantType
  name: string
  characterId?: string | null
  conditions: ConditionId[]
  currentHitPoints: number
  maximumHitPoints: number
  additionalHitPoints: number | null
  armorClass: number
  naturalInitiative?: 1 | 20 | null
  initiative: number | null
}

export type CombatantInput = Omit<Combatant, 'id'>
