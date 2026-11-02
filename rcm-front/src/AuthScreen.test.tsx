import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import AuthScreen from './components/AuthScreen'

const mock = vi.hoisted(() => ({ listener: null as null | ((user: unknown) => void), auth: { currentUser: null as unknown }, signin: vi.fn() }))
vi.mock('./auth/firebase', () => ({ firebaseAuth: () => mock.auth }))
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, listener: (user: unknown) => void) => { mock.listener = listener; return () => {} },
  signInWithEmailAndPassword: mock.signin, signOut: vi.fn(async () => { mock.auth.currentUser = null; mock.listener?.(null) }),
  GoogleAuthProvider: class {}, createUserWithEmailAndPassword: vi.fn(), signInWithPopup: vi.fn(), reload: vi.fn(), sendEmailVerification: vi.fn(),
}))
beforeEach(() => { mock.listener = null; mock.auth.currentUser = null; mock.signin.mockReset() })

test('reports a conflicting account instead of merging it', async () => {
  mock.signin.mockRejectedValue({ code: 'auth/account-exists-with-different-credential' })
  render(<AuthScreen onBack={() => {}} onContinue={() => {}} />)
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'hero@example.com' } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: '123456' } })
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('já está associado a uma conta')
})

test('does not display a delayed profile after logout', async () => {
  let resolveFetch!: (response: unknown) => void
  vi.stubGlobal('fetch', vi.fn(() => new Promise(resolve => { resolveFetch = resolve })))
  render(<AuthScreen onBack={() => {}} onContinue={() => {}} />)
  const user = { uid: 'first', providerData: [], emailVerified: true, getIdToken: async () => 'token' }
  mock.auth.currentUser = user
  mock.listener?.(user)
  await waitFor(() => expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument())
  fireEvent.click(screen.getByRole('button', { name: 'Sair' }))
  resolveFetch({ status: 200, ok: true, json: async () => ({ nickname: 'First', birthDate: '2000-01-01' }) })
  await waitFor(() => expect(screen.getByLabelText('E-mail')).toBeInTheDocument())
  expect(screen.queryByDisplayValue('2000-01-01')).not.toBeInTheDocument()
  vi.unstubAllGlobals()
})
