import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'
import App from './App'

beforeEach(() => window.history.replaceState(null, '', '/'))

test('browser back and forward follow screens', async () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Registrar-se ou entrar' }))
  expect(screen.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeInTheDocument()
  window.history.back()
  await waitFor(() => expect(screen.getByRole('heading', { name: 'Prepare o combate' })).toBeInTheDocument())
  window.history.forward()
  await waitFor(() => expect(screen.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeInTheDocument())
})

test('browser back returns from combat to the combatant list', async () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Continuar offline' }))
  fireEvent.click(screen.getByRole('button', { name: 'Criar Combatente' }))
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Aria' } })
  fireEvent.change(screen.getByLabelText('Vida atual'), { target: { value: '18' } })
  fireEvent.change(screen.getByLabelText('Vida máxima'), { target: { value: '20' } })
  fireEvent.change(screen.getByLabelText('CA (Classe de Armadura)'), { target: { value: '16' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar combatente' }))
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar Combate' }))
  expect(screen.getByRole('article', { name: 'Combatente atual: Aria' })).toBeInTheDocument()
  window.history.back()
  await waitFor(() => expect(screen.getByRole('heading', { name: 'Combate rápido' })).toBeInTheDocument())
  expect(screen.getByRole('heading', { name: 'Aria' })).toBeInTheDocument()
})

test('abre a preparação offline diretamente pela URL', () => {
  window.history.replaceState(null, '', '/offline')
  render(<App />)
  expect(screen.getByRole('heading', { name: 'Combate rápido' })).toBeInTheDocument()
})
