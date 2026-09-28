import { fireEvent, render, screen } from '@testing-library/react'
import App from '../../App'
import type { Combatant } from '../../types/combatant'

export function enterQuickCombat(combatants: Combatant[] = []) {
  if (combatants.length > 0) {
    localStorage.setItem('rpg-combat-manager.combatants', JSON.stringify(combatants))
  }

  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Continuar offline' }))
}

export function beginCombat(combatants: Combatant[]) {
  enterQuickCombat(combatants)
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar Combate' }))
}
