import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import App from './App'

const mock = vi.hoisted(() => ({ auth: { currentUser: { uid: 'hero', getIdToken: async () => 'token' } as { uid: string; getIdToken: () => Promise<string> } | null } }))
vi.mock('./auth/firebase', () => ({ firebaseAuth: () => mock.auth }))
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, listener: (user: unknown) => void) => { listener(mock.auth.currentUser); return () => {} },
  signOut: async () => { mock.auth.currentUser = null },
}))
vi.mock('./screens/AuthScreen', () => ({ default: ({ onContinue }: { onContinue: () => void }) => <button onClick={onContinue}>Entrar na conta</button> }))

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  mock.auth.currentUser = { uid: 'hero', getIdToken: async () => 'token' }
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => [] })))
})

test('back and forward navigate through home, combatants and profile', async () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Registrar-se ou entrar' }))
  fireEvent.click(screen.getByRole('button', { name: 'Entrar na conta' }))
  fireEvent.click(screen.getByRole('button', { name: /combatentes/i }))
  expect(await screen.findByRole('heading', { name: 'Meus combatentes' })).toBeInTheDocument()
  window.history.back()
  await waitFor(() => expect(screen.getByText('Bem-vindo à sua aventura')).toBeInTheDocument())
  window.history.forward()
  await waitFor(() => expect(screen.getByRole('heading', { name: 'Meus combatentes' })).toBeInTheDocument())
  fireEvent.click(screen.getByRole('button', { name: /home/i }))
  await waitFor(() => expect(screen.getByText('Bem-vindo à sua aventura')).toBeInTheDocument())
  fireEvent.click(screen.getByRole('button', { name: 'Meu perfil' }))
  expect(screen.getByRole('button', { name: 'Entrar na conta' })).toBeInTheDocument()
  window.history.back()
  await waitFor(() => expect(screen.getByText('Bem-vindo à sua aventura')).toBeInTheDocument())
})

test('history does not restore private screens after signing out', async () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Registrar-se ou entrar' }))
  fireEvent.click(screen.getByRole('button', { name: 'Entrar na conta' }))
  fireEvent.click(screen.getByRole('button', { name: /combatentes/i }))
  await screen.findByRole('heading', { name: 'Meus combatentes' })
  window.history.back()
  await waitFor(() => expect(screen.getByText('Bem-vindo à sua aventura')).toBeInTheDocument())
  fireEvent.click(screen.getByRole('button', { name: 'Sair' }))
  await screen.findByRole('heading', { name: 'Prepare o combate' })
  const navigated = new Promise<void>(resolve => window.addEventListener('popstate', () => resolve(), { once: true }))
  window.history.forward()
  await navigated
  await waitFor(() => expect(screen.getByRole('heading', { name: 'Prepare o combate' })).toBeInTheDocument())
  expect(screen.queryByRole('heading', { name: 'Meus combatentes' })).not.toBeInTheDocument()
})
