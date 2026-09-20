import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from './App'

test('shows the offline entry point and unavailable account access', () => {
  render(<App />)

  expect(
    screen.getByRole('heading', { name: 'Prepare o combate' }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Continuar offline' }),
  ).toBeEnabled()
  expect(
    screen.getByRole('button', {
      name: 'Registrar-se ou entrar — em breve',
    }),
  ).toBeDisabled()
})

test('opens the quick combat panel with an action to create combatants', () => {
  render(<App />)

  fireEvent.click(screen.getByRole('button', { name: 'Continuar offline' }))

  expect(
    screen.getByRole('heading', { name: 'Combate rápido' }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Criar Combatente' }),
  ).toBeEnabled()
})

test('opens a form with all combatant fields', () => {
  render(<App />)

  fireEvent.click(screen.getByRole('button', { name: 'Continuar offline' }))
  fireEvent.click(screen.getByRole('button', { name: 'Criar Combatente' }))

  expect(screen.getByRole('dialog', { name: 'Criar Combatente' })).toBeInTheDocument()
  expect(screen.getByRole('radiogroup', { name: 'Tipo' })).toBeInTheDocument()
  expect(screen.getByRole('radio', { name: 'Jogador' })).toHaveAttribute('aria-checked', 'true')
  expect(screen.getByRole('radio', { name: 'NPC' })).toHaveAttribute('aria-checked', 'false')
  expect(screen.getByLabelText('Nome')).toBeInTheDocument()
  expect(screen.getByRole('group', { name: '♥ PV (Pontos de Vida)' })).toBeInTheDocument()
  expect(screen.getByLabelText('Vida atual')).toHaveAttribute('placeholder', 'vida atual')
  expect(screen.getByLabelText('Vida máxima')).toHaveAttribute('placeholder', 'vida máxima')
  expect(screen.getByLabelText('🛡 CA (Classe de Armadura)')).toBeInTheDocument()
  expect(screen.getByLabelText('⚔ Iniciativa')).toBeInTheDocument()
})

test('moves focus into the creation dialog and closes it with Escape', () => {
  render(<App />)

  fireEvent.click(screen.getByRole('button', { name: 'Continuar offline' }))
  const createCombatant = screen.getByRole('button', { name: 'Criar Combatente' })
  createCombatant.focus()
  fireEvent.click(createCombatant)

  expect(screen.getByRole('radio', { name: 'Jogador' })).toHaveFocus()
  fireEvent.keyDown(screen.getByRole('dialog', { name: 'Criar Combatente' }), {
    key: 'Escape',
  })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(createCombatant).toHaveFocus()
})

test('creates a player combatant with its combat attributes', () => {
  render(<App />)

  fireEvent.click(screen.getByRole('button', { name: 'Continuar offline' }))
  fireEvent.click(screen.getByRole('button', { name: 'Criar Combatente' }))
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Aria' } })
  fireEvent.change(screen.getByLabelText('Vida atual'), { target: { value: '18' } })
  fireEvent.change(screen.getByLabelText('Vida máxima'), { target: { value: '20' } })
  fireEvent.change(screen.getByLabelText('🛡 CA (Classe de Armadura)'), { target: { value: '16' } })
  fireEvent.change(screen.getByLabelText('⚔ Iniciativa'), { target: { value: '14' } })

  fireEvent.click(screen.getByRole('button', { name: 'Salvar combatente' }))

  expect(screen.getByText('Aria')).toBeInTheDocument()
  expect(screen.getByText('Jogador')).toBeInTheDocument()
  expect(screen.getByText('♥ PV: 18 / 20')).toBeInTheDocument()
  expect(screen.getByText('🛡 CA: 16')).toBeInTheDocument()
  expect(screen.getByText('⚔ Iniciativa: 14')).toBeInTheDocument()
  expect(screen.getByRole('article')).toHaveClass('combatant-card--player')
  expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Remover' })).toBeInTheDocument()
})

test('orders combatants by initiative and keeps an empty initiative at the end', () => {
  render(<App />)

  fireEvent.click(screen.getByRole('button', { name: 'Continuar offline' }))
  fireEvent.click(screen.getByRole('button', { name: 'Criar Combatente' }))
  fireEvent.click(screen.getByRole('radio', { name: 'NPC' }))
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Goblin' } })
  fireEvent.change(screen.getByLabelText('Vida atual'), { target: { value: '-2' } })
  fireEvent.change(screen.getByLabelText('Vida máxima'), { target: { value: '7' } })
  fireEvent.change(screen.getByLabelText('🛡 CA (Classe de Armadura)'), { target: { value: '13' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar combatente' }))

  fireEvent.click(screen.getByRole('button', { name: 'Criar Combatente' }))
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Aria' } })
  fireEvent.change(screen.getByLabelText('Vida atual'), { target: { value: '25' } })
  fireEvent.change(screen.getByLabelText('Vida máxima'), { target: { value: '20' } })
  fireEvent.change(screen.getByLabelText('🛡 CA (Classe de Armadura)'), { target: { value: '16' } })
  fireEvent.change(screen.getByLabelText('⚔ Iniciativa'), { target: { value: '14' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar combatente' }))

  expect(screen.getByText('♥ PV: -2 / 7')).toBeInTheDocument()
  expect(screen.getByText('⚔ Iniciativa: —')).toBeInTheDocument()
  expect(screen.getAllByRole('article')[1]).toHaveClass('combatant-card--npc')
  expect(screen.getAllByRole('article').map((card) => card.textContent)).toEqual([
    expect.stringContaining('Aria'),
    expect.stringContaining('Goblin'),
  ])
})

test('edits and removes a combatant after confirmation', () => {
  render(<App />)

  fireEvent.click(screen.getByRole('button', { name: 'Continuar offline' }))
  fireEvent.click(screen.getByRole('button', { name: 'Criar Combatente' }))
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Aria' } })
  fireEvent.change(screen.getByLabelText('Vida atual'), { target: { value: '18' } })
  fireEvent.change(screen.getByLabelText('Vida máxima'), { target: { value: '20' } })
  fireEvent.change(screen.getByLabelText('🛡 CA (Classe de Armadura)'), { target: { value: '16' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar combatente' }))

  const combatant = screen.getByRole('article')
  fireEvent.click(within(combatant).getByRole('button', { name: 'Editar' }))
  fireEvent.change(screen.getByLabelText('⚔ Iniciativa'), { target: { value: '15' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

  expect(screen.getByText('⚔ Iniciativa: 15')).toBeInTheDocument()

  const removeCombatant = within(screen.getByRole('article')).getByRole('button', {
    name: 'Remover',
  })
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

  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Continuar offline' }))

  expect(screen.queryByRole('article')).not.toBeInTheDocument()
})

test('rejects a name made only of whitespace', () => {
  render(<App />)

  fireEvent.click(screen.getByRole('button', { name: 'Continuar offline' }))
  fireEvent.click(screen.getByRole('button', { name: 'Criar Combatente' }))
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: '   ' } })
  fireEvent.change(screen.getByLabelText('Vida atual'), { target: { value: '1' } })
  fireEvent.change(screen.getByLabelText('Vida máxima'), { target: { value: '1' } })
  fireEvent.change(screen.getByLabelText('🛡 CA (Classe de Armadura)'), { target: { value: '10' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar combatente' }))

  expect(screen.getByText('Informe um nome.')).toBeInTheDocument()
  expect(screen.getByRole('dialog', { name: 'Criar Combatente' })).toBeInTheDocument()
})
