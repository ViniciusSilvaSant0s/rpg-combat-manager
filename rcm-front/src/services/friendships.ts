import { firebaseAuth } from '../auth/firebase'
import { api } from './api'

export type FriendProfile = { id: number; nickname: string }
export type Friendships = { friends: FriendProfile[]; received: FriendProfile[]; sent: FriendProfile[] }
export type FriendshipAction = 'request' | 'accept' | 'decline' | 'cancel' | 'remove'

async function token() {
  const user = firebaseAuth().currentUser
  if (!user) throw new Error('Sua sessão foi encerrada.')
  return user.getIdToken()
}

export const friendshipsService = {
  async list(): Promise<Friendships> {
    const response = await api.get('/friendships', await token())
    if (!response.ok) throw new Error('Não foi possível carregar as amizades.')
    return response.json()
  },
  async search(nickname: string): Promise<FriendProfile | null> {
    const response = await api.get('/friendships/search?nickname=' + encodeURIComponent(nickname), await token())
    if (response.status === 404) return null
    if (!response.ok) throw new Error('Não foi possível buscar o perfil.')
    return response.json()
  },
  async change(action: FriendshipAction, id: number) {
    const path = '/friendships/' + id
    const session = await token()
    const response = action === 'remove' ? await api.delete(path, session) : await api.post(path + '/' + action, undefined, session)
    if (response.status === 409) throw new Error('O relacionamento já foi alterado. Atualize a lista de amigos.')
    if (response.status === 400) throw new Error('Esta solicitação de amizade é inválida.')
    if (!response.ok) throw new Error('Não foi possível atualizar a amizade.')
  },
}
