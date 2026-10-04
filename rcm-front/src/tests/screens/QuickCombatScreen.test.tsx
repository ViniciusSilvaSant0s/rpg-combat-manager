import { fireEvent, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { enterQuickCombat } from './helpers'

test('selects a character, persists it and restores it when editing', () => {
  enterQuickCombat()
  fireEvent.click(screen.getByRole('button', { name: 'Criar Combatente' }))
  expect(screen.queryByRole('img', { name: 'Personagem 1' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Escolher personagem' }))
  const picker = screen.getByRole('dialog', { name: 'Escolher personagem' })
  fireEvent.keyDown(picker, { key: 'Tab', shiftKey: true })
  expect(within(picker).getByRole('button', { name: 'Cancelar' })).toHaveFocus()
  fireEvent.keyDown(picker, { key: 'Tab' })
  expect(within(picker).getByRole('button', { name: 'Personagem 1' })).toHaveFocus()
  expect(within(picker).getAllByRole('img')).toHaveLength(9)
  expect(within(picker).getAllByRole('img').map((image) => image.getAttribute('aria-label'))).toEqual([
    'Personagem 1', 'Personagem 2', 'Personagem 3', 'Personagem 4', 'Personagem 5',
    'Personagem 7', 'Personagem 8', 'Personagem 9', 'Personagem 10',
  ])
  fireEvent.click(within(picker).getByRole('button', { name: 'Personagem 1' }))
  expect(screen.queryByRole('dialog', { name: 'Escolher personagem' })).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Mudar personagem' })).toHaveFocus()
  expect(screen.getByRole('img', { name: 'Personagem 1' })).toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Aria' } })
  fireEvent.change(screen.getByLabelText('Vida atual'), { target: { value: '18' } })
  fireEvent.change(screen.getByLabelText('Vida máxima'), { target: { value: '20' } })
  fireEvent.change(screen.getByLabelText('CA (Classe de Armadura)'), { target: { value: '16' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar combatente' }))

  const card = screen.getByRole('article')
  expect(card.lastElementChild).toContainElement(within(card).getByRole('img', { name: 'Personagem de Aria' }))
  expect(JSON.parse(localStorage.getItem('rpg-combat-manager.combatants') ?? '[]')[0].characterId).toBe('character-1')
  fireEvent.click(within(card).getByRole('button', { name: 'Editar' }))
  expect(screen.getByRole('img', { name: 'Personagem 1' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar Combate' }))
  const currentCard = screen.getByRole('article', { name: 'Combatente atual: Aria' })
  expect(currentCard.firstElementChild).toContainElement(within(currentCard).getByRole('img', { name: 'Personagem de Aria' }))
})

test('changes characters and cancels the picker without losing form data or selection', () => {
  enterQuickCombat()
  fireEvent.click(screen.getByRole('button', { name: 'Criar Combatente' }))
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Medusa' } })
  fireEvent.click(screen.getByRole('button', { name: 'Escolher personagem' }))
  fireEvent.click(screen.getByRole('button', { name: 'Personagem 10' }))
  expect(screen.getByRole('img', { name: 'Personagem 10' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Mudar personagem' }))
  const picker = screen.getByRole('dialog', { name: 'Escolher personagem' })
  expect(within(picker).getByRole('button', { name: 'Personagem 10' })).toHaveFocus()
  fireEvent.keyDown(picker, { key: 'Escape' })
  expect(screen.getByLabelText('Nome')).toHaveValue('Medusa')
  expect(screen.getByRole('img', { name: 'Personagem 10' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Mudar personagem' })).toHaveFocus()
  fireEvent.click(screen.getByRole('button', { name: 'Mudar personagem' }))
  fireEvent.click(screen.getByRole('button', { name: 'Personagem 2' }))
  expect(screen.getByRole('img', { name: 'Personagem 2' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Mudar personagem' }))
  fireEvent.click(within(screen.getByRole('dialog', { name: 'Escolher personagem' })).getByRole('button', { name: 'Cancelar' }))
  expect(screen.getByRole('img', { name: 'Personagem 2' })).toBeInTheDocument()
})

test('shows combatant creation and disables combat until one exists', () => {
  enterQuickCombat()

  expect(screen.getByRole('button', { name: 'Criar Combatente' })).toBeEnabled()
  expect(screen.getByRole('button', { name: 'Iniciar Combate' })).toBeDisabled()
})

test('opens a form with all combatant fields', () => {
  enterQuickCombat()
  fireEvent.click(screen.getByRole('button', { name: 'Criar Combatente' }))

  expect(screen.getByRole('dialog', { name: 'Criar Combatente' })).toBeInTheDocument()
  expect(screen.getByRole('radiogroup', { name: 'Tipo' })).toBeInTheDocument()
  expect(screen.getByRole('radio', { name: 'Jogador' })).toHaveAttribute('aria-checked', 'true')
  expect(screen.getByRole('radio', { name: 'NPC' })).toHaveAttribute('aria-checked', 'false')
  expect(screen.getByLabelText('Nome')).toBeInTheDocument()
  expect(screen.getByRole('group', { name: 'PV (Pontos de Vida)' })).toBeInTheDocument()
  expect(screen.getByLabelText('Vida atual')).toHaveAttribute('placeholder', 'vida atual')
  expect(screen.getByLabelText('Vida máxima')).toHaveAttribute('placeholder', 'vida máxima')
  expect(screen.getByLabelText('Vida adicional')).toHaveAttribute('placeholder', 'vida adicional')
  expect(screen.getByLabelText('CA (Classe de Armadura)')).toBeInTheDocument()
  expect(screen.getByLabelText('Iniciativa')).toBeInTheDocument()
})

test('moves focus into the creation dialog and closes it with Escape', () => {
  enterQuickCombat()
  const createCombatant = screen.getByRole('button', { name: 'Criar Combatente' })
  createCombatant.focus()
  fireEvent.click(createCombatant)

  expect(screen.getByRole('radio', { name: 'Jogador' })).toHaveFocus()
  fireEvent.keyDown(screen.getByRole('dialog', { name: 'Criar Combatente' }), { key: 'Escape' })

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(createCombatant).toHaveFocus()
})

test('creates a player combatant with its combat attributes', () => {
  enterQuickCombat()
  fireEvent.click(screen.getByRole('button', { name: 'Criar Combatente' }))
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Aria' } })
  fireEvent.change(screen.getByLabelText('Vida atual'), { target: { value: '18' } })
  fireEvent.change(screen.getByLabelText('Vida máxima'), { target: { value: '20' } })
  fireEvent.change(screen.getByLabelText('CA (Classe de Armadura)'), { target: { value: '16' } })
  fireEvent.change(screen.getByLabelText('Iniciativa'), { target: { value: '14' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar combatente' }))

  expect(screen.getByText('Aria')).toBeInTheDocument()
  expect(screen.getByText('Jogador')).toBeInTheDocument()
  expect(screen.getByText('PV: 18 / 20')).toBeInTheDocument()
  expect(screen.getByText('CA: 16')).toBeInTheDocument()
  expect(screen.getByText('Iniciativa: 14')).toBeInTheDocument()
  expect(screen.getByRole('article')).toHaveClass('combatant-card--player')
  expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Remover' })).toBeInTheDocument()
})

test('saves additional hit points when provided and null when left empty', () => {
  enterQuickCombat()
  fireEvent.click(screen.getByRole('button', { name: 'Criar Combatente' }))
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Aria' } })
  fireEvent.change(screen.getByLabelText('Vida atual'), { target: { value: '18' } })
  fireEvent.change(screen.getByLabelText('Vida máxima'), { target: { value: '20' } })
  fireEvent.change(screen.getByLabelText('Vida adicional'), { target: { value: '5' } })
  fireEvent.change(screen.getByLabelText('CA (Classe de Armadura)'), { target: { value: '16' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar combatente' }))

  expect(JSON.parse(localStorage.getItem('rpg-combat-manager.combatants') ?? '[]')[0].additionalHitPoints).toBe(5)
  expect(screen.getByText('PV: 18 / 20 - 5')).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: 'Criar Combatente' }))
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Goblin' } })
  fireEvent.change(screen.getByLabelText('Vida atual'), { target: { value: '7' } })
  fireEvent.change(screen.getByLabelText('Vida máxima'), { target: { value: '7' } })
  fireEvent.change(screen.getByLabelText('Vida adicional'), { target: { value: '0' } })
  fireEvent.change(screen.getByLabelText('CA (Classe de Armadura)'), { target: { value: '13' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar combatente' }))

  expect(JSON.parse(localStorage.getItem('rpg-combat-manager.combatants') ?? '[]')[1].additionalHitPoints).toBe(0)
  expect(screen.getByText('PV: 7 / 7')).toBeInTheDocument()
})

test('rejects current hit points above maximum when creating or editing a combatant', () => {
  enterQuickCombat()
  fireEvent.click(screen.getByRole('button', { name: 'Criar Combatente' }))
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Aria' } })
  fireEvent.change(screen.getByLabelText('Vida atual'), { target: { value: '21' } })
  fireEvent.change(screen.getByLabelText('Vida máxima'), { target: { value: '20' } })
  fireEvent.change(screen.getByLabelText('CA (Classe de Armadura)'), { target: { value: '16' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar combatente' }))

  expect(screen.getByText('A vida atual não pode ser maior que a vida máxima.')).toBeInTheDocument()
  expect(screen.getByRole('dialog', { name: 'Criar Combatente' })).toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Vida atual'), { target: { value: '18' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar combatente' }))

  fireEvent.click(within(screen.getByRole('article')).getByRole('button', { name: 'Editar' }))
  fireEvent.change(screen.getByLabelText('Vida atual'), { target: { value: '21' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

  expect(screen.getByText('A vida atual não pode ser maior que a vida máxima.')).toBeInTheDocument()
  expect(screen.getByRole('dialog', { name: 'Editar Combatente' })).toBeInTheDocument()
})

test('orders combatants by initiative and keeps a missing initiative at the end', () => {
  enterQuickCombat()
  fireEvent.click(screen.getByRole('button', { name: 'Criar Combatente' }))
  fireEvent.click(screen.getByRole('radio', { name: 'NPC' }))
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Goblin' } })
  fireEvent.change(screen.getByLabelText('Vida atual'), { target: { value: '-2' } })
  fireEvent.change(screen.getByLabelText('Vida máxima'), { target: { value: '7' } })
  fireEvent.change(screen.getByLabelText('CA (Classe de Armadura)'), { target: { value: '13' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar combatente' }))

  fireEvent.click(screen.getByRole('button', { name: 'Criar Combatente' }))
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Aria' } })
  fireEvent.change(screen.getByLabelText('Vida atual'), { target: { value: '20' } })
  fireEvent.change(screen.getByLabelText('Vida máxima'), { target: { value: '20' } })
  fireEvent.change(screen.getByLabelText('CA (Classe de Armadura)'), { target: { value: '16' } })
  fireEvent.change(screen.getByLabelText('Iniciativa'), { target: { value: '14' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar combatente' }))

  expect(screen.getByText('PV: -2 / 7')).toBeInTheDocument()
  expect(screen.getByText('Iniciativa: —')).toBeInTheDocument()
  expect(screen.getAllByRole('article')[1]).toHaveClass('combatant-card--npc')
  expect(screen.getAllByRole('article').map((card) => card.textContent)).toEqual([
    expect.stringContaining('Aria'),
    expect.stringContaining('Goblin'),
  ])
})

test('edits and removes a combatant after confirmation', () => {
  enterQuickCombat()
  fireEvent.click(screen.getByRole('button', { name: 'Criar Combatente' }))
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Aria' } })
  fireEvent.change(screen.getByLabelText('Vida atual'), { target: { value: '18' } })
  fireEvent.change(screen.getByLabelText('Vida máxima'), { target: { value: '20' } })
  fireEvent.change(screen.getByLabelText('CA (Classe de Armadura)'), { target: { value: '16' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar combatente' }))

  const combatant = screen.getByRole('article')
  fireEvent.click(within(combatant).getByRole('button', { name: 'Editar' }))
  fireEvent.change(screen.getByLabelText('Iniciativa'), { target: { value: '15' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
  expect(screen.getByText('Iniciativa: 15')).toBeInTheDocument()

  const removeCombatant = within(screen.getByRole('article')).getByRole('button', { name: 'Remover' })
  removeCombatant.focus()
  fireEvent.click(removeCombatant)
  expect(screen.getByRole('dialog', { name: 'Remover Aria?' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus()
  fireEvent.keyDown(screen.getByRole('dialog', { name: 'Remover Aria?' }), { key: 'Escape' })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(removeCombatant).toHaveFocus()

  fireEvent.click(removeCombatant)
  fireEvent.click(screen.getByRole('button', { name: 'Remover combatente' }))
  expect(screen.queryByText('Aria')).not.toBeInTheDocument()
})

test('ignores invalid combatants saved in local storage', () => {
  localStorage.setItem('rpg-combat-manager.combatants', JSON.stringify([
    { id: 'incomplete-combatant', name: 'Sem atributos' },
  ]))
  enterQuickCombat()

  expect(screen.queryByRole('article')).not.toBeInTheDocument()
})

test('rejects a name made only of whitespace', () => {
  enterQuickCombat()
  fireEvent.click(screen.getByRole('button', { name: 'Criar Combatente' }))
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: '   ' } })
  fireEvent.change(screen.getByLabelText('Vida atual'), { target: { value: '1' } })
  fireEvent.change(screen.getByLabelText('Vida máxima'), { target: { value: '1' } })
  fireEvent.change(screen.getByLabelText('CA (Classe de Armadura)'), { target: { value: '10' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar combatente' }))

  expect(screen.getByText('Informe um nome.')).toBeInTheDocument()
  expect(screen.getByRole('dialog', { name: 'Criar Combatente' })).toBeInTheDocument()
})
