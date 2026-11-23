import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { useState } from 'react'
import SavedCombatantsScreen from './screens/SavedCombatantsScreen'
import { CombatantsProvider } from './combatantsContext'

vi.mock('./auth/firebase', () => ({ firebaseAuth: () => ({ currentUser: { getIdToken: async () => 'token' } }) }))
afterEach(() => vi.unstubAllGlobals())

test('creates a reusable sheet and displays it in both layouts', async () => {
  const item = { id: 1, name: 'Aria', type: 'player', characterId: null, maximumHitPoints: 12, armorClass: 15 }
  vi.stubGlobal('fetch', vi.fn(async (_url, init) => init?.method === 'POST' ? { ok: true, status: 201, json: async () => item } : { ok: true, status: 200, json: async () => [] }))
  render(<CombatantsProvider><SavedCombatantsScreen onBack={() => {}} /></CombatantsProvider>)
  expect(await screen.findByText(/ainda não tem combatentes/i)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /criar combatente/i }))
  const dialog = screen.getByRole('dialog')
  fireEvent.change(within(dialog).getByLabelText('Nome'), { target: { value: 'Aria' } })
  fireEvent.change(within(dialog).getByLabelText('Vida máxima'), { target: { value: '12' } })
  fireEvent.change(within(dialog).getByLabelText(/classe de armadura/i), { target: { value: '15' } })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar combatente' }))
  expect(await screen.findByText('Aria')).toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Visualização'), { target: { value: 'list' } })
  expect(screen.getByText('Aria')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))
  expect(screen.getByText('Excluir Aria?')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
  await waitFor(() => expect(screen.getByText('Aria')).toBeInTheDocument())
})

test('keeps the edit form open when saving fails', async () => {
  const item = { id: 2, name: 'Orin', type: 'npc', characterId: null, maximumHitPoints: 10, armorClass: 12 }
  vi.stubGlobal('fetch', vi.fn(async (_url, init) => init?.method === 'PUT' ? { ok: false, status: 500 } : { ok: true, status: 200, json: async () => [item] }))
  render(<CombatantsProvider><SavedCombatantsScreen onBack={() => {}} /></CombatantsProvider>)
  await screen.findByText('Orin')
  fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
  const dialog = screen.getByRole('dialog')
  fireEvent.change(within(dialog).getByLabelText('Nome'), { target: { value: 'Orin alterado' } })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar alterações' }))
  expect(await within(dialog).findByRole('alert')).toHaveTextContent('Não foi possível salvar')
  expect(within(dialog).getByLabelText('Nome')).toHaveValue('Orin alterado')
})

test('explains health changes and counts linked combats before deletion', async () => {
  const item = { id: 2, name: 'Orin', type: 'npc', characterId: null, maximumHitPoints: 10, armorClass: 12 }
  vi.stubGlobal('fetch', vi.fn(async (url) => ({ ok: true, status: 200, json: async () => String(url).endsWith('/combats/count') ? { count: 2 } : [item] })))
  render(<CombatantsProvider><SavedCombatantsScreen onBack={() => {}} /></CombatantsProvider>)
  await screen.findByText('Orin')
  fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
  fireEvent.change(screen.getByLabelText('Vida máxima'), { target: { value: '8' } })
  expect(screen.getByText(/exceder o novo máximo será somada à vida adicional/i)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
  fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))
  expect(await screen.findByText(/está em 2 combates/i)).toBeInTheDocument()
})

test('reuses loaded combatants when leaving and returning to the screen', async () => {
  const fetchMock = vi.fn(async () => ({ ok: true, status: 200, json: async () => [{ id: 1, name: 'Aria', type: 'player', characterId: null, maximumHitPoints: 12, armorClass: 15 }] }))
  vi.stubGlobal('fetch', fetchMock)
  function Navigation() {
    const [open, setOpen] = useState(true)
    return open ? <SavedCombatantsScreen onBack={() => setOpen(false)} /> : <button onClick={() => setOpen(true)}>Voltar aos combatentes</button>
  }
  render(<CombatantsProvider><Navigation /></CombatantsProvider>)
  await screen.findByText('Aria')
  fireEvent.click(screen.getByRole('button', { name: /home/i }))
  fireEvent.click(screen.getByRole('button', { name: /voltar aos combatentes/i }))
  expect(screen.getByText('Aria')).toBeInTheDocument()
  expect(fetchMock).toHaveBeenCalledTimes(1)
  fireEvent.click(screen.getByRole('button', { name: 'Atualizar' }))
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
})

test('filtra fichas pelo proprietário e reserva as ações ao dono', async () => {
  const sheet = { id: 2, name: 'Orin', type: 'npc', characterId: null, maximumHitPoints: 10, armorClass: 12 }
  const items = [{ ...sheet, owner: { id: 1, nickname: 'Mago' }, isOwner: true },
    { ...sheet, id: 3, name: 'Grifo', owner: { id: 2, nickname: 'Elfa' }, isOwner: false }]
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => items })))
  render(<CombatantsProvider><SavedCombatantsScreen onBack={() => {}} /></CombatantsProvider>)
  const friend = (await screen.findByText('Grifo')).closest('article')!
  expect(friend).toHaveTextContent('Ficha de Elfa')
  expect(within(friend).queryByRole('button')).not.toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Proprietário'), { target: { value: 'friends' } })
  expect(screen.queryByText('Orin')).not.toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Proprietário'), { target: { value: 'mine' } })
  expect(screen.queryByText('Grifo')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument()
})

test('explica conflito de vida adicional ao editar e preserva os dados do formulário', async () => {
  const item = { id: 2, name: 'Orin', type: 'npc', characterId: null, maximumHitPoints: 10, armorClass: 12 }
  const message = 'A redução da vida máxima excederia o limite de vida adicional em combate.'
  vi.stubGlobal('fetch', vi.fn(async (_url, init) => init?.method === 'PUT'
    ? { ok: false, status: 409, json: async () => ({ error: message }) }
    : { ok: true, json: async () => [item] }))
  render(<CombatantsProvider><SavedCombatantsScreen onBack={() => {}} /></CombatantsProvider>)
  fireEvent.click(await screen.findByRole('button', { name: 'Editar' }))
  const dialog = within(screen.getByRole('dialog'))
  fireEvent.change(dialog.getByLabelText('Vida máxima'), { target: { value: '8' } })
  fireEvent.click(dialog.getByRole('button', { name: 'Salvar alterações' }))
  expect(await dialog.findByRole('alert')).toHaveTextContent(message)
  expect(dialog.getByLabelText('Vida máxima')).toHaveValue(8)
})
