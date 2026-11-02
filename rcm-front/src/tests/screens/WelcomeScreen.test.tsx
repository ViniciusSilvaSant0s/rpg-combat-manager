import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from '../../App'

test('offers offline access and account access', () => {
  render(<App />)
  expect(screen.getByRole('button', { name: 'Continuar offline' })).toBeEnabled()
  expect(screen.getByRole('button', { name: 'Registrar-se ou entrar' })).toBeEnabled()
  fireEvent.click(screen.getByRole('button', { name: 'Continuar offline' }))
  expect(screen.getByRole('heading', { name: 'Combate rápido' })).toBeInTheDocument()
})

test('opens the authentication choices', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Registrar-se ou entrar' }))
  expect(screen.getByRole('button', { name: 'Entrar com Google' })).toBeInTheDocument()
  expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
  expect(screen.getByLabelText('Senha')).toBeInTheDocument()
})
