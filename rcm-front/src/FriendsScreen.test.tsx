import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import FriendsScreen from './screens/FriendsScreen'
import { CombatantsProvider } from './combatantsContext'

vi.mock('./auth/firebase', () => ({ firebaseAuth: () => ({ currentUser: { getIdToken: async () => 'token' } }) }))
afterEach(() => vi.unstubAllGlobals())

const hero = { id: 3, nickname: 'Luz' }
const empty = { friends: [], received: [], sent: [] }
const response = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body })
function show() {
  render(<CombatantsProvider><FriendsScreen onBack={() => {}} /></CombatantsProvider>)
}

test.each([
  ['Aceitar', 'received', 'accept'], ['Recusar', 'received', 'decline'], ['Cancelar solicitação', 'sent', 'cancel'],
])('%s atualiza a lista pela API', async (action, group, endpoint) => {
  const fetch = vi.fn().mockResolvedValueOnce(response({ ...empty, [group]: [hero] }))
    .mockResolvedValueOnce(response(null, 204)).mockResolvedValueOnce(response(empty))
  vi.stubGlobal('fetch', fetch)
  show()
  fireEvent.click(await screen.findByRole('button', { name: action }))
  await waitFor(() => expect(screen.queryByText(hero.nickname)).not.toBeInTheDocument())
  expect(fetch).toHaveBeenCalledWith('/api/friendships/3/' + endpoint, expect.objectContaining({ method: 'POST', headers: { Authorization: 'Bearer token' } }))
})

test('cancelar a confirmação preserva a amizade e confirmar a remove', async () => {
  const fetch = vi.fn().mockResolvedValueOnce(response({ ...empty, friends: [hero] }))
    .mockResolvedValueOnce(response(null, 204)).mockResolvedValueOnce(response(empty))
  vi.stubGlobal('fetch', fetch)
  show()
  const trigger = await screen.findByRole('button', { name: 'Desfazer amizade' })
  fireEvent.click(trigger)
  expect(screen.getByRole('dialog')).toHaveTextContent('removidas dos combates de ambos')
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }))
  expect(trigger).toHaveFocus()
  expect(fetch).toHaveBeenCalledTimes(1)
  fireEvent.click(trigger)
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
  expect(await screen.findByText(emptyFriendsMessage)).toBeInTheDocument()
  expect(fetch).toHaveBeenCalledWith('/api/friendships/3', expect.objectContaining({ method: 'DELETE' }))
})
const emptyFriendsMessage = 'Você ainda não tem amigos.'

test('busca exata mostra ausência e reflete aceite de solicitações cruzadas', async () => {
  const fetch = vi.fn().mockResolvedValueOnce(response(empty)).mockResolvedValueOnce(response(null, 404))
    .mockResolvedValueOnce(response(hero)).mockResolvedValueOnce(response(null, 204))
    .mockResolvedValueOnce(response({ ...empty, friends: [hero] }))
  vi.stubGlobal('fetch', fetch)
  show()
  await screen.findByText(emptyFriendsMessage)
  const field = screen.getByLabelText('Nickname completo')
  fireEvent.change(field, { target: { value: 'L u&z' } })
  expect(field).toBeInvalid()
  fireEvent.change(field, { target: { value: 'Luz_7' } })
  fireEvent.click(screen.getByRole('button', { name: 'Buscar' }))
  expect(await screen.findByText('Nenhum perfil encontrado.')).toBeInTheDocument()
  expect(fetch).toHaveBeenCalledWith('/api/friendships/search?nickname=Luz_7', expect.anything())
  fireEvent.change(field, { target: { value: 'Luz' } })
  fireEvent.click(screen.getByRole('button', { name: 'Buscar' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Enviar solicitação' }))
  await waitFor(() => expect(within(screen.getByRole('region', { name: 'Meus amigos' })).getByText('Luz')).toBeInTheDocument())
  expect(fetch).toHaveBeenCalledWith('/api/friendships/3/request', expect.objectContaining({ method: 'POST' }))
})

test('mostra carregamento, falha de rede e permite tentar novamente', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error()).mockResolvedValueOnce(response(empty)))
  show()
  expect(screen.getByRole('status')).toHaveTextContent('Carregando')
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar')
  fireEvent.click(screen.getByRole('button', { name: 'Atualizar lista' }))
  expect(await screen.findByText(emptyFriendsMessage)).toBeInTheDocument()
})
