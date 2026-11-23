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

test('acesso direto carrega o combate pelo identificador', async () => {
  window.history.replaceState(null, '', '/combates/42')
  const combat = { id: 42, title: 'Castelo', description: null, started: false, version: 1, currentParticipantId: null, participants: [] }
  vi.stubGlobal('fetch', vi.fn(async (url: string) => ({ ok: true, status: 200, json: async () => url.endsWith('/combats/42') ? combat : [] })))
  render(<App />)
  expect(await screen.findByRole('heading', { name: 'Preparar combate' })).toBeInTheDocument()
  expect(screen.getByDisplayValue('Castelo')).toBeInTheDocument()
})

test('combate inexistente mostra erro e oferece retorno', async () => {
  window.history.replaceState(null, '', '/combates/999')
  vi.stubGlobal('fetch', vi.fn(async (url: string) => ({ ok: !url.endsWith('/combats/999'), status: url.endsWith('/combats/999') ? 404 : 200, json: async () => [] })))
  render(<App />)
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar o combate')
  fireEvent.click(screen.getByRole('button', { name: /Meus combates/ }))
  expect(await screen.findByRole('heading', { name: 'Meus combates' })).toBeInTheDocument()
})

test('URL de combate não inicia um combate ainda não iniciado', async () => {
  window.history.replaceState(null, '', '/combates/42/combate')
  const combat = { id: 42, title: 'Castelo', description: null, started: false, version: 1, currentParticipantId: null, participants: [] }
  vi.stubGlobal('fetch', vi.fn(async (url: string) => ({ ok: true, status: 200, json: async () => url.endsWith('/combats/42') ? combat : [] })))
  render(<App />)
  expect(await screen.findByRole('alert')).toHaveTextContent('Inicie o combate')
  await waitFor(() => expect(window.location.pathname).toBe('/combates/42'))
})

test('bloqueia saída de combate enquanto uma alteração está sendo salva', async () => {
  window.history.replaceState(null, '', '/combates/42')
  const combat = { id: 42, title: 'Castelo', description: null, started: false, version: 1, currentParticipantId: null, participants: [] }
  vi.stubGlobal('fetch', vi.fn(async (url: string, options?: RequestInit) => {
    if (options?.method === 'PUT') return new Promise(() => {})
    return { ok: true, status: 200, json: async () => url.endsWith('/combats/42') ? combat : [] }
  }))
  render(<App />)
  const title = await screen.findByDisplayValue('Castelo')
  fireEvent.change(title, { target: { value: 'Fortaleza' } })
  fireEvent.click(screen.getByRole('button', { name: /Meus combates/ }))
  expect(screen.getByText('Aguarde o salvamento ou resolva a falha antes de sair.')).toBeInTheDocument()
  expect(window.location.pathname).toBe('/combates/42')
})

test('o card Amigos abre a tela autenticada de amizades', async () => {
  window.history.replaceState(null, '', '/home')
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ friends: [], received: [], sent: [] }) })))
  render(<App />)
  fireEvent.click(await screen.findByRole('button', { name: /amigos/i }))
  expect(await screen.findByRole('heading', { name: 'Amigos', level: 1 })).toBeInTheDocument()
  expect(window.location.pathname).toBe('/amigos')
  expect(await screen.findByText('Você ainda não tem amigos.')).toBeInTheDocument()
})
