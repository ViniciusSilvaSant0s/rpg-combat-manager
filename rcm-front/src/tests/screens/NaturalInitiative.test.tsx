import { fireEvent, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import type { Combatant } from '../../types/combatant'
import { beginCombat, enterQuickCombat } from './helpers'

const base: Combatant = {
  id: 'normal', name: 'Normal', type: 'player', currentHitPoints: 10,
  maximumHitPoints: 10, additionalHitPoints: null, conditions: [], armorClass: 10, initiative: 50,
}
const combatants: Combatant[] = [
  { ...base, id: 'last', name: 'Último', naturalInitiative: 1, initiative: 99 },
  base,
  { ...base, id: 'empty', name: 'Sem iniciativa', initiative: null },
  { ...base, id: 'first', name: 'Primeiro', naturalInitiative: 20, initiative: -10 },
]

test.each([1, 20])('fills only empty initiative for natural %s and keeps checkboxes exclusive', (natural) => {
  enterQuickCombat()
  fireEvent.click(screen.getByRole('button', { name: 'Criar Combatente' }))
  const checkbox = screen.getByRole('checkbox', { name: `${natural} Natural` })
  fireEvent.click(checkbox)
  expect(screen.getByLabelText('Iniciativa')).toHaveValue(natural)
  fireEvent.click(checkbox)
  expect(screen.getByLabelText('Iniciativa')).toHaveValue(natural)
  fireEvent.change(screen.getByLabelText('Iniciativa'), { target: { value: '0' } })
  fireEvent.click(checkbox)
  expect(screen.getByLabelText('Iniciativa')).toHaveValue(0)
  const other = screen.getByRole('checkbox', { name: `${natural === 1 ? 20 : 1} Natural` })
  fireEvent.click(other)
  expect(other).toBeChecked()
  expect(checkbox).not.toBeChecked()
  expect(screen.getByLabelText('Iniciativa')).toHaveValue(0)
})

test('restores and saves natural initiative when editing', () => {
  enterQuickCombat(combatants)
  const card = screen.getAllByRole('article').find((entry) => entry.textContent?.includes('Primeiro'))!
  fireEvent.click(within(card).getByRole('button', { name: 'Editar' }))
  expect(screen.getByRole('checkbox', { name: '20 Natural' })).toBeChecked()
  fireEvent.click(screen.getByRole('checkbox', { name: '1 Natural' }))
  fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
  const saved = JSON.parse(localStorage.getItem('rpg-combat-manager.combatants')!)
  expect(saved.find((entry: Combatant) => entry.id === 'first')).toMatchObject({ naturalInitiative: 1, initiative: -10 })
})

test('orders the preparation list with natural priorities ahead of initiative values', () => {
  enterQuickCombat(combatants)
  expect(screen.getAllByRole('article').map((card) => within(card).getByRole('heading').textContent))
    .toEqual(['Primeiro', 'Normal', 'Sem iniciativa', 'Último'])
})

test('uses natural priorities throughout combat turns and wraps the round', () => {
  beginCombat(combatants)
  for (const name of ['Primeiro', 'Normal', 'Sem iniciativa', 'Último', 'Primeiro']) {
    expect(screen.getByRole('article', { name: `Combatente atual: ${name}` })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Próximo Combatente' }))
  }
})
