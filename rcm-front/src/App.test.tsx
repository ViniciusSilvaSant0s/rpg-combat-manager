import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from './App'
import './tests/combatantStorage.test'
import './tests/screens/CombatScreen.test'
import './tests/screens/Conditions.test'
import './tests/screens/QuickCombatScreen.test'
import './tests/screens/WelcomeScreen.test'
import '../vite.config.test'

test('renders the welcome screen as the application entry point', () => {
  render(<App />)

  expect(screen.getByRole('heading', { name: 'Prepare o combate' })).toBeInTheDocument()
})
