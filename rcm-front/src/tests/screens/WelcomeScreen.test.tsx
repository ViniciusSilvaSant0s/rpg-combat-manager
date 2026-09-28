import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from '../../App'

test('offers offline access and keeps account access unavailable', () => {
  render(<App />)

  expect(screen.getByRole('button', { name: 'Continuar offline' })).toBeEnabled()
  expect(screen.getByRole('button', { name: 'Registrar-se ou entrar — em breve' })).toBeDisabled()

  fireEvent.click(screen.getByRole('button', { name: 'Continuar offline' }))
  expect(screen.getByRole('heading', { name: 'Combate rápido' })).toBeInTheDocument()
})
