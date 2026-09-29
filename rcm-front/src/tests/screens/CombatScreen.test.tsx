import { fireEvent, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import type { Combatant } from '../../types/combatant'
import { beginCombat } from './helpers'

const witch: Combatant = {
  id: 'witch', type: 'npc', name: 'Bruxa', currentHitPoints: 31,
  maximumHitPoints: 38, armorClass: 14, initiative: 20,
}
const aria: Combatant = {
  id: 'aria', type: 'player', name: 'Aria', currentHitPoints: 18,
  maximumHitPoints: 24, armorClass: 15, initiative: 18,
}

test('starts with the highest initiative and shows the remaining combatants in order', () => {
  beginCombat([
    witch,
    aria,
    { id: 'goblin', type: 'npc', name: 'Goblin', currentHitPoints: 7, maximumHitPoints: 7, armorClass: 13, initiative: 14 },
  ])

  expect(screen.getByRole('heading', { name: 'Combate em andamento' })).toBeInTheDocument()
  expect(screen.getByRole('article', { name: 'Combatente atual: Bruxa' })).toHaveTextContent('PV: 31 / 38')
  expect(screen.getByLabelText('Próximos combatentes')).toHaveTextContent('Aria')
  expect(screen.getByLabelText('Próximos combatentes')).toHaveTextContent('Goblin')
  expect(screen.getByLabelText('Próximos combatentes')).not.toHaveTextContent('Bruxa')
})

test('applies damage to a chosen combatant and undoes the last combat action', () => {
  beginCombat([witch, aria])
  fireEvent.click(screen.getByRole('button', { name: 'Atacar' }))
  fireEvent.click(screen.getByRole('button', { name: 'Próxima' }))
  fireEvent.click(screen.getByText('Aria', { selector: '.combat-target-card__name' }).closest('button')!)
  fireEvent.change(screen.getByLabelText('Dano'), { target: { value: '21' } })
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar dano' }))

  expect(screen.getByLabelText('Próximos combatentes')).toHaveTextContent('PV: -3 / 24')
  expect(screen.getByRole('button', { name: 'Desfazer última ação' })).toBeEnabled()
  fireEvent.click(screen.getByRole('button', { name: 'Desfazer última ação' }))
  expect(screen.getByLabelText('Próximos combatentes')).toHaveTextContent('PV: 18 / 24')
})

test('heals a chosen combatant only up to maximum hit points', () => {
  beginCombat([witch, aria])
  fireEvent.click(screen.getByRole('button', { name: 'Curar' }))
  fireEvent.click(screen.getByRole('button', { name: 'Próxima' }))
  fireEvent.click(screen.getByText('Aria', { selector: '.combat-target-card__name' }).closest('button')!)
  fireEvent.change(screen.getByLabelText('Cura'), { target: { value: '20' } })
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar cura' }))

  expect(screen.getByLabelText('Próximos combatentes')).toHaveTextContent('PV: 24 / 24')
})

test('advances to the next combatant and restores the turn when undoing', () => {
  beginCombat([witch, aria])
  fireEvent.click(screen.getByRole('button', { name: 'Próximo Combatente' }))

  expect(screen.getByRole('article', { name: 'Combatente atual: Aria' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Desfazer última ação' }))
  expect(screen.getByRole('article', { name: 'Combatente atual: Bruxa' })).toBeInTheDocument()
})

test('keeps registration order on initiative ties, puts missing initiatives last, and wraps turns', () => {
  beginCombat([
    witch,
    aria,
    { id: 'kael', type: 'player', name: 'Kael', currentHitPoints: 22, maximumHitPoints: 22, armorClass: 16, initiative: 18 },
    { id: 'goblin', type: 'npc', name: 'Goblin', currentHitPoints: 7, maximumHitPoints: 7, armorClass: 13, initiative: null },
  ])

  expect(within(screen.getByLabelText('Próximos combatentes')).getAllByRole('heading').map((heading) => heading.textContent)).toEqual([
    'Aria', 'Kael', 'Goblin',
  ])
  for (let turn = 0; turn < 4; turn += 1) {
    fireEvent.click(screen.getByRole('button', { name: 'Próximo Combatente' }))
  }

  expect(screen.getByRole('article', { name: 'Combatente atual: Bruxa' })).toBeInTheDocument()
})

test('closes the target dialog with Escape without changing combat state', () => {
  beginCombat([witch])
  const attackButton = screen.getByRole('button', { name: 'Atacar' })
  attackButton.focus()
  fireEvent.click(attackButton)

  expect(screen.getByText('Bruxa', { selector: '.combat-target-card__name' }).closest('button')).toHaveFocus()
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(attackButton).toHaveFocus()
  expect(screen.getByRole('article', { name: 'Combatente atual: Bruxa' })).toHaveTextContent('PV: 31 / 38')
})
