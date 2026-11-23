import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import SavedCombatsScreen from './screens/SavedCombatsScreen'
import CombatScreen from './screens/CombatScreen'

vi.mock('./services/combats', () => ({ CombatConflict: class extends Error {}, combatsService: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn(), get: vi.fn() } }))
vi.mock('./services/combatants', () => ({ combatantsService: { list: vi.fn() } }))
import { combatsService, CombatConflict } from './services/combats'
import { combatantsService } from './services/combatants'

beforeEach(() => { vi.clearAllMocks(); vi.mocked(combatsService.list).mockResolvedValue([]); vi.mocked(combatantsService.list).mockResolvedValue([]) })
it('shows all upcoming combatants in the same horizontal list as quick combat', () => {
  const combatants = Array.from({ length: 6 }, (_, index) => ({ id: String(index), name: `Combatente ${index}`, type: 'npc' as const, characterId: null, currentHitPoints: 5, maximumHitPoints: 5, additionalHitPoints: null, armorClass: 10, initiative: 20 - index, conditions: [] }))
  render(<CombatScreen combatants={combatants} onCombatantsChange={() => {}} onExit={() => {}} />)
  const upcoming = screen.getByLabelText('Próximos combatentes')
  expect(within(upcoming).getAllByRole('article')).toHaveLength(5)
  expect(upcoming).toHaveClass('overflow-x-auto')
  expect(screen.queryByRole('button', { name: 'Próximos →' })).not.toBeInTheDocument()
})
it('creates a titled combat and opens its preparation', async () => {
  vi.mocked(combatsService.create).mockResolvedValue({ id: 1, title: 'Floresta', description: null, started: false, version: 1, currentParticipantId: null, participants: [] })
  render(<SavedCombatsScreen onBack={() => {}} />)
  fireEvent.click(await screen.findByRole('button', { name: /criar combate/i }))
  fireEvent.change(screen.getByLabelText(/título/i), { target: { value: 'Floresta' } })
  fireEvent.click(screen.getByRole('button', { name: /salvar combate/i }))
  await waitFor(() => expect(screen.getByText('Preparar combate')).toBeInTheDocument())
})
it('closes the creation dialog with Escape and returns focus to its trigger', async () => {
  render(<SavedCombatsScreen onBack={() => {}} />)
  const trigger = await screen.findByRole('button', { name: /criar combate/i })
  fireEvent.click(trigger)
  const dialog = screen.getByRole('dialog', { name: 'Criar combate' })
  expect(dialog).toHaveAttribute('aria-modal', 'true')
  fireEvent.keyDown(dialog, { key: 'Escape' })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(trigger).toHaveFocus()
})
it('adds repeated combatants with independent full health and saves changes', async () => {
  const combat = { id: 1, title: 'Floresta', description: null, started: false, version: 1, currentParticipantId: null, participants: [] }
  vi.mocked(combatsService.list).mockResolvedValue([combat])
  vi.mocked(combatantsService.list).mockResolvedValue([{ id: 4, name: 'Goblin', type: 'npc', characterId: null, maximumHitPoints: 7, armorClass: 13 }])
  vi.mocked(combatsService.update).mockImplementation(async item => ({ ...item, version: item.version + 1 }))
  render(<SavedCombatsScreen onBack={() => {}} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir' }))
  fireEvent.click(screen.getByRole('button', { name: /adicionar combatente/i }))
  fireEvent.click(screen.getByRole('button', { name: /Goblin · PV 7/i }))
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar selecionados' }))
  await waitFor(() => expect(combatsService.update).toHaveBeenCalledTimes(1))
  fireEvent.click(screen.getByRole('button', { name: /adicionar combatente/i }))
  fireEvent.click(screen.getByRole('button', { name: /Goblin · PV 7/i }))
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar selecionados' }))
  await waitFor(() => expect(combatsService.update).toHaveBeenCalledTimes(2))
  expect(screen.getByText('Goblin 1')).toBeInTheDocument()
  expect(screen.getByText('Goblin 2')).toBeInTheDocument()
  const saved = vi.mocked(combatsService.update).mock.calls[1][0]
  expect(saved.version).toBe(2)
  expect(saved.participants.map(p => [p.currentHitPoints, p.conditions])).toEqual([[7, []], [7, []]])
  expect(saved.participants[0].id).not.toBe(saved.participants[1].id)
})
it('shows each selectable combatant as a card with its character and stat icons', async () => {
  vi.mocked(combatsService.list).mockResolvedValue([{ id: 1, title: 'Floresta', description: null, started: false, version: 1, currentParticipantId: null, participants: [] }])
  vi.mocked(combatantsService.list).mockResolvedValue([{ id: 4, name: 'Aria', type: 'player', characterId: 'character-1', maximumHitPoints: 20, armorClass: 15 }])
  render(<SavedCombatsScreen onBack={() => {}} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir' }))
  fireEvent.click(screen.getByRole('button', { name: /adicionar combatente/i }))
  const card = screen.getByRole('button', { name: /Aria · PV 20 · CA 15/i })
  expect(within(card).getByRole('img', { name: 'Personagem de Aria' })).toBeInTheDocument()
  expect(card.querySelectorAll('.combat-icon')).toHaveLength(2)
  expect(card).toHaveTextContent('Jogador')
})
it('selects multiple combatants, allows deselection, and adds them together', async () => {
  vi.mocked(combatsService.list).mockResolvedValue([{ id: 1, title: 'Floresta', description: null, started: false, version: 1, currentParticipantId: null, participants: [] }])
  vi.mocked(combatantsService.list).mockResolvedValue([
    { id: 4, name: 'Aria', type: 'player', characterId: null, maximumHitPoints: 20, armorClass: 15 },
    { id: 5, name: 'Goblin', type: 'npc', characterId: null, maximumHitPoints: 7, armorClass: 13 },
  ])
  vi.mocked(combatsService.update).mockImplementation(async item => ({ ...item, version: item.version + 1 }))
  render(<SavedCombatsScreen onBack={() => {}} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir' }))
  fireEvent.click(screen.getByRole('button', { name: /adicionar combatente/i }))
  const dialog = screen.getByRole('dialog', { name: 'Adicionar combatente' })
  const confirm = within(dialog).getByRole('button', { name: 'Adicionar selecionados' })
  expect(confirm).toBeDisabled()
  const aria = within(dialog).getByRole('button', { name: /Aria · PV 20/i })
  const goblin = within(dialog).getByRole('button', { name: /Goblin · PV 7/i })
  fireEvent.click(aria)
  fireEvent.click(goblin)
  fireEvent.click(aria)
  expect(aria).toHaveAttribute('aria-pressed', 'false')
  fireEvent.click(aria)
  expect(aria).toHaveAttribute('aria-pressed', 'true')
  expect(combatsService.update).not.toHaveBeenCalled()
  fireEvent.click(confirm)
  await waitFor(() => expect(combatsService.update).toHaveBeenCalledTimes(1))
  expect(vi.mocked(combatsService.update).mock.calls[0][0].participants.map(p => [p.combatantId, p.currentHitPoints, p.conditions])).toEqual([[5, 7, []], [4, 20, []]])
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
it('discards selections on cancel and starts the next selection empty', async () => {
  vi.mocked(combatsService.list).mockResolvedValue([{ id: 1, title: 'Floresta', description: null, started: false, version: 1, currentParticipantId: null, participants: [] }])
  vi.mocked(combatantsService.list).mockResolvedValue([{ id: 4, name: 'Aria', type: 'player', characterId: null, maximumHitPoints: 20, armorClass: 15 }])
  render(<SavedCombatsScreen onBack={() => {}} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir' }))
  fireEvent.click(screen.getByRole('button', { name: /adicionar combatente/i }))
  fireEvent.click(screen.getByRole('button', { name: /Aria · PV 20/i }))
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
  expect(combatsService.update).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: /adicionar combatente/i }))
  expect(screen.getByRole('button', { name: /Aria · PV 20/i })).toHaveAttribute('aria-pressed', 'false')
  expect(screen.getByRole('button', { name: 'Adicionar selecionados' })).toBeDisabled()
})
it('stops saving on a conflict and offers to reload the saved state', async () => {
  const combat = { id: 1, title: 'Floresta', description: null, started: false, version: 1, currentParticipantId: null, participants: [] }
  vi.mocked(combatsService.list).mockResolvedValue([combat])
  vi.mocked(combatantsService.list).mockResolvedValue([{ id: 4, name: 'Goblin', type: 'npc', characterId: null, maximumHitPoints: 7, armorClass: 13 }])
  vi.mocked(combatsService.update).mockRejectedValue(new CombatConflict())
  vi.mocked(combatsService.get).mockResolvedValue({ ...combat, title: 'Atualizado', version: 2 })
  render(<SavedCombatsScreen onBack={() => {}} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir' }))
  fireEvent.click(screen.getByRole('button', { name: /adicionar combatente/i }))
  fireEvent.click(screen.getByRole('button', { name: /Goblin · PV 7/i }))
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar selecionados' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('outra sessão')
  fireEvent.click(screen.getByRole('button', { name: /carregar versão salva/i }))
  await waitFor(() => expect(combatsService.get).toHaveBeenCalledWith(1))
  await waitFor(() => expect(screen.getByLabelText(/título/i)).toHaveValue('Atualizado'))
})
it('restores the current turn after leaving and reopening a started combat', async () => {
  let combat: import('./services/combats').SavedCombat = { id: 1, title: 'Floresta', description: null, started: true, version: 1, currentParticipantId: 10, participants: [
    { id: 10, combatantId: 4, currentHitPoints: 5, additionalHitPoints: null, initiative: 15, naturalInitiative: null, conditions: [] },
    { id: 11, combatantId: 5, currentHitPoints: 6, additionalHitPoints: null, initiative: 10, naturalInitiative: null, conditions: [] },
  ] }
  vi.mocked(combatsService.list).mockImplementation(async () => [combat])
  vi.mocked(combatsService.update).mockImplementation(async item => { combat = { ...item, version: item.version + 1 }; return combat })
  vi.mocked(combatantsService.list).mockResolvedValue([{ id: 4, name: 'Aria', type: 'player', characterId: null, maximumHitPoints: 10, armorClass: 15 }, { id: 5, name: 'Goblin', type: 'npc', characterId: null, maximumHitPoints: 7, armorClass: 13 }])
  render(<SavedCombatsScreen onBack={() => {}} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir' }))
  fireEvent.click(screen.getByRole('button', { name: 'Retomar combate' }))
  expect(screen.getByRole('article', { name: 'Combatente atual: Aria' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Atacar' }))
  fireEvent.click(screen.getByText('Aria', { selector: '.combat-target-card__name' }).closest('button')!)
  fireEvent.change(screen.getByLabelText('Dano'), { target: { value: '2' } })
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar dano' }))
  await waitFor(() => expect(combat.participants[0].currentHitPoints).toBe(3))
  fireEvent.click(screen.getByRole('button', { name: 'Próximo Combatente' }))
  await waitFor(() => expect(combat.currentParticipantId).toBe(11))
  fireEvent.click(screen.getByRole('button', { name: /gerenciar combate/i }))
  fireEvent.click(screen.getByRole('button', { name: /meus combates/i }))
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir' }))
  fireEvent.click(screen.getByRole('button', { name: 'Retomar combate' }))
  expect(screen.getByRole('article', { name: 'Combatente atual: Goblin' })).toBeInTheDocument()
  expect(screen.getByLabelText('Próximos combatentes')).toHaveTextContent('PV: 3 / 10')
})
it('paginates conditions on the current combatant', async () => {
  const combat: import('./services/combats').SavedCombat = { id: 1, title: 'Floresta', description: null, started: true, version: 1, currentParticipantId: 10, participants: [{ id: 10, combatantId: 4, currentHitPoints: 5, additionalHitPoints: null, initiative: 15, naturalInitiative: null, conditions: ['blinded', 'poisoned', 'prone', 'stunned'] }] }
  vi.mocked(combatsService.list).mockResolvedValue([combat])
  vi.mocked(combatantsService.list).mockResolvedValue([{ id: 4, name: 'Aria', type: 'player', characterId: null, maximumHitPoints: 10, armorClass: 15 }])
  render(<SavedCombatsScreen onBack={() => {}} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir' }))
  fireEvent.click(screen.getByRole('button', { name: 'Retomar combate' }))
  expect(screen.queryByRole('button', { name: /remover Atordoado/i })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Próximas condições' }))
  expect(screen.getByRole('button', { name: /remover Atordoado/i })).toBeInTheDocument()
})
it('serializes rapid edits with the version returned by the previous save', async () => {
  const combat: import('./services/combats').SavedCombat = { id: 1, title: 'Floresta', description: null, started: false, version: 1, currentParticipantId: null, participants: [] }
  vi.mocked(combatsService.list).mockResolvedValue([combat])
  let finishFirst: ((value: typeof combat) => void) | undefined
  vi.mocked(combatsService.update).mockImplementationOnce(() => new Promise(resolve => { finishFirst = resolve })).mockImplementation(async item => ({ ...item, version: item.version + 1 }))
  render(<SavedCombatsScreen onBack={() => {}} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir' }))
  fireEvent.change(screen.getByLabelText(/título/i), { target: { value: 'Primeiro' } })
  fireEvent.change(screen.getByLabelText(/título/i), { target: { value: 'Segundo' } })
  expect(combatsService.update).toHaveBeenCalledTimes(1)
  finishFirst?.({ ...combat, title: 'Primeiro', version: 2 })
  await waitFor(() => expect(combatsService.update).toHaveBeenCalledTimes(2))
  expect(vi.mocked(combatsService.update).mock.calls[1][0]).toMatchObject({ title: 'Segundo', version: 2 })
})

it('recarrega a participação e a lista de fichas após desfazer amizade', async () => {
  const friend = { id: 4, name: 'Fênix', type: 'npc' as const, characterId: null, maximumHitPoints: 7, armorClass: 13, owner: { id: 2, nickname: 'Elfa' }, isOwner: false }
  const combat = { id: 1, title: 'Ruínas', description: null, started: false, version: 1, currentParticipantId: null, participants: [] }
  vi.mocked(combatsService.list).mockResolvedValue([combat])
  vi.mocked(combatantsService.list).mockResolvedValueOnce([friend]).mockResolvedValue([])
  vi.mocked(combatsService.update).mockRejectedValue(new CombatConflict())
  vi.mocked(combatsService.get).mockResolvedValue({ ...combat, version: 2 })
  render(<SavedCombatsScreen onBack={() => {}} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir' }))
  fireEvent.click(screen.getByRole('button', { name: /adicionar combatente/i }))
  fireEvent.click(screen.getByRole('button', { name: /Selecionar Fênix.*Ficha de Elfa/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar selecionados' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('outra sessão')
  fireEvent.click(screen.getByRole('button', { name: 'Carregar versão salva' }))
  await waitFor(() => expect(screen.queryByText('Fênix')).not.toBeInTheDocument())
  expect(screen.getByRole('button', { name: 'Iniciar combate' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: /adicionar combatente/i }))
  expect(screen.queryByRole('button', { name: /Ficha de Elfa/ })).not.toBeInTheDocument()
})

it('oferece recarga se a participação chegar sem sua ficha de origem', async () => {
  const combat = { id: 1, title: 'Ruínas', description: null, started: true, version: 1, currentParticipantId: 2, participants: [
    { id: 2, combatantId: 4, currentHitPoints: 7, initiative: null, naturalInitiative: null, additionalHitPoints: null, conditions: [] },
  ] }
  vi.mocked(combatsService.list).mockResolvedValue([combat])
  vi.mocked(combatsService.get).mockResolvedValue({ ...combat, version: 2, participants: [], currentParticipantId: null })
  render(<SavedCombatsScreen onBack={() => {}} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir' }))
  expect(screen.getByRole('alert')).toHaveTextContent('deixou de estar disponível')
  expect(screen.getByLabelText(/Título/)).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Carregar versão atual' }))
  await waitFor(() => expect(screen.getByLabelText(/Título/)).toBeEnabled())
})

it('ignora a resposta atrasada da lista após abrir a URL de um combate', async () => {
  const sheet = { id: 4, name: 'Grifo', type: 'npc' as const, characterId: null, maximumHitPoints: 7, armorClass: 13 }
  let finishList!: (sheets: typeof sheet[]) => void
  vi.mocked(combatantsService.list).mockReturnValueOnce(new Promise(resolve => { finishList = resolve }))
    .mockResolvedValueOnce([sheet])
  vi.mocked(combatsService.get).mockResolvedValue({ id: 1, title: 'Castelo', description: null, started: false, version: 1, currentParticipantId: null,
    participants: [{ id: 2, combatantId: 4, currentHitPoints: 7, additionalHitPoints: null, initiative: null, naturalInitiative: null, conditions: [] }] })
  const route = { running: false, navigate: vi.fn(), setUnsafe: vi.fn() }
  const screenView = render(<SavedCombatsScreen onBack={() => {}} route={route} />)
  screenView.rerender(<SavedCombatsScreen onBack={() => {}} route={{ ...route, id: '1' }} />)
  expect(await screen.findByText('Grifo')).toBeInTheDocument()
  await act(async () => { finishList([]) })
  expect(screen.getByText('Grifo')).toBeInTheDocument()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

it('consulta as fichas uma única vez na entrada direta por URL', async () => {
  vi.mocked(combatsService.get).mockResolvedValue({ id: 1, title: 'Castelo', description: null, started: false, version: 1, currentParticipantId: null, participants: [] })
  render(<SavedCombatsScreen onBack={() => {}} route={{ id: '1', running: false, navigate: vi.fn(), setUnsafe: vi.fn() }} />)
  await screen.findByDisplayValue('Castelo')
  expect(combatantsService.list).toHaveBeenCalledTimes(1)
  expect(combatsService.list).not.toHaveBeenCalled()
})

it('carrega fichas para um combate criado enquanto a consulta da lista está pendente', async () => {
  const sheet = { id: 4, name: 'Grifo', type: 'npc' as const, characterId: null, maximumHitPoints: 7, armorClass: 13 }
  let finishList!: (sheets: typeof sheet[]) => void
  vi.mocked(combatantsService.list).mockReturnValueOnce(new Promise(resolve => { finishList = resolve }))
    .mockResolvedValueOnce([sheet])
  const combat = { id: 1, title: 'Castelo', description: null, started: false, version: 1, currentParticipantId: null, participants: [] }
  vi.mocked(combatsService.create).mockResolvedValue(combat)
  vi.mocked(combatsService.get).mockResolvedValue(combat)
  const route = { running: false, navigate: vi.fn(), setUnsafe: vi.fn() }
  const view = render(<SavedCombatsScreen onBack={() => {}} route={route} />)
  fireEvent.click(screen.getByRole('button', { name: /criar combate/i }))
  fireEvent.change(screen.getByLabelText(/Título/), { target: { value: 'Castelo' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar combate' }))
  await waitFor(() => expect(route.navigate).toHaveBeenCalledWith('/combates/1'))
  view.rerender(<SavedCombatsScreen onBack={() => {}} route={{ ...route, id: '1' }} />)
  await screen.findByDisplayValue('Castelo')
  await act(async () => { finishList([]) })
  fireEvent.click(screen.getByRole('button', { name: /adicionar combatente/i }))
  expect(await screen.findByRole('button', { name: /Selecionar Grifo/ })).toBeInTheDocument()
})
