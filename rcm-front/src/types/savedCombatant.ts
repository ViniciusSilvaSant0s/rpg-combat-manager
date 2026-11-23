import type { FriendProfile } from '../services/friendships'

export type SavedCombatant = {
  id: number
  name: string
  type: 'player' | 'npc'
  characterId: string | null
  maximumHitPoints: number
  armorClass: number
  owner?: FriendProfile
  isOwner?: boolean
}

export function sheetOwnerLabel(item: SavedCombatant) {
  if (item.isOwner === false) return item.owner ? 'Ficha de ' + item.owner.nickname : 'Ficha de amigo'
  return item.owner ? 'Sua ficha · ' + item.owner.nickname : 'Sua ficha'
}
