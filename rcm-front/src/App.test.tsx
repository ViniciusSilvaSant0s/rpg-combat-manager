import { fireEvent, render, screen } from '@testing-library/react'
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

test('opens the empty offline area when continuing without an account', () => {
  const { getByRole } = render(<App />)

  fireEvent.click(getByRole('button', { name: 'Continuar offline' }))

  expect(getByRole('main', { name: 'Modo offline' })).toBeEmptyDOMElement()
})
