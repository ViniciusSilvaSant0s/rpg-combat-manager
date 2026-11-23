import { render, screen, fireEvent } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from './App'
import './tests/combatantStorage.test'
import './tests/screens/CombatScreen.test'
import './tests/screens/Conditions.test'
import './tests/screens/QuickCombatScreen.test'
import './tests/screens/NaturalInitiative.test'
import './tests/screens/WelcomeScreen.test'
import './Navigation.test'
import '../vite.config.test'
import HomeScreen from './screens/HomeScreen'

test('opens combatants from the home card', () => {
  let opened = false
  render(<HomeScreen onFriends={() => {}} onCombatants={() => { opened = true }} onCombats={() => {}} onProfile={() => {}} onSignOut={() => {}} />)
  fireEvent.click(screen.getByRole('button', { name: /combatentes/i }))
  expect(opened).toBe(true)
})

test('opens saved combats from the home card', () => {
  let opened = false
  render(<HomeScreen onFriends={() => {}} onCombatants={() => {}} onCombats={() => { opened = true }} onProfile={() => {}} onSignOut={() => {}} />)
  fireEvent.click(screen.getByRole('button', { name: /^combate\b/i }))
  expect(opened).toBe(true)
})

test('renders the welcome screen as the application entry point', () => {
  render(<App />)

  expect(screen.getByRole('heading', { name: 'Prepare o combate' })).toBeInTheDocument()
})
