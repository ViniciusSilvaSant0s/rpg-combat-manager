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
