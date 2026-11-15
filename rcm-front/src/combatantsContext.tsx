import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'

export type SavedCombatant = { id: number; name: string; type: 'player' | 'npc'; characterId: string | null; maximumHitPoints: number; armorClass: number }
type State = { items: SavedCombatant[] | null; setItems: Dispatch<SetStateAction<SavedCombatant[] | null>> }
const CombatantsContext = createContext<State | null>(null)

export function CombatantsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<SavedCombatant[] | null>(null)
  return <CombatantsContext.Provider value={{ items, setItems }}>{children}</CombatantsContext.Provider>
}

export function useCombatants() {
  const context = useContext(CombatantsContext)
  if (!context) throw new Error('CombatantsProvider ausente')
  return context
}
