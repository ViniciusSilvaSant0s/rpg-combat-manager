import { firebaseAuth } from '../auth/firebase'
import type { SavedCombatant } from '../combatantsContext'
import { api } from './api'

export type CombatantInput = Omit<SavedCombatant, 'id' | 'owner' | 'isOwner'>

export class CombatantHealthConflict extends Error {
  constructor() {
    super('A redução da vida máxima excederia o limite de vida adicional em combate.')
  }
}

async function token() {
  const user = firebaseAuth().currentUser
  if (!user) throw new Error('Sessão encerrada')
  return user.getIdToken()
}

async function read<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error('Não foi possível concluir. Tente novamente.')
  return response.json() as Promise<T>
}

export const combatantsService = {
  async countCombats(id: number): Promise<number> {
    const result = await read<{ count: number }>(await api.get(`/combatants/${id}/combats/count`, await token()))
    return result.count
  },
  async list(): Promise<SavedCombatant[]> {
    return read(await api.get('/combatants', await token()))
  },
  async create(input: CombatantInput): Promise<SavedCombatant> {
    return read(await api.post('/combatants', input, await token()))
  },
  async update(id: number, input: CombatantInput): Promise<SavedCombatant> {
    const response = await api.put(`/combatants/${id}`, input, await token())
    if (response.status === 409) throw new CombatantHealthConflict()
    return read(response)
  },
  async remove(id: number): Promise<void> {
    const response = await api.delete(`/combatants/${id}`, await token())
    if (!response.ok) throw new Error('Não foi possível concluir. Tente novamente.')
  },
}
