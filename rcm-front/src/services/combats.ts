import { firebaseAuth } from '../auth/firebase'
import type { ConditionId } from '../conditions'
import { api } from './api'

export type Participant = { id: number; combatantId: number; currentHitPoints: number; additionalHitPoints: number | null; initiative: number | null; naturalInitiative: 1 | 20 | null; conditions: ConditionId[] }
export type SavedCombat = { id: number; title: string; description: string | null; started: boolean; currentParticipantId: number | null; version: number; participants: Participant[] }
export class CombatConflict extends Error {}
async function token() { const user = firebaseAuth().currentUser; if (!user) throw new Error('Sessão encerrada'); return user.getIdToken() }
async function read<T>(response: Response): Promise<T> { if (response.status === 409) throw new CombatConflict(); if (!response.ok) throw new Error('Não foi possível concluir.'); return response.json() as Promise<T> }
export const combatsService = {
  async list() { return read<SavedCombat[]>(await api.get('/combats', await token())) },
  async get(id: number) { return read<SavedCombat>(await api.get(`/combats/${id}`, await token())) },
  async create(title: string, description: string | null) { return read<SavedCombat>(await api.post('/combats', { title, description }, await token())) },
  async update(combat: SavedCombat) { return read<SavedCombat>(await api.put(`/combats/${combat.id}`, combat, await token())) },
  async remove(id: number) { const response = await api.delete(`/combats/${id}`, await token()); if (!response.ok) throw new Error('Não foi possível excluir.') },
}
