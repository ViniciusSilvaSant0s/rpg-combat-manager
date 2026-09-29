export type CombatantType = 'player' | 'npc'

export type Combatant = {
  id: string
  type: CombatantType
  name: string
  currentHitPoints: number
  maximumHitPoints: number
  additionalHitPoints: number | null
  armorClass: number
  initiative: number | null
}

export type CombatantInput = Omit<Combatant, 'id'>
