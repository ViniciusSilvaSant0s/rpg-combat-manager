import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import AuthScreen from './components/AuthScreen'

const mock = vi.hoisted(() => ({ listener: null as null | ((user: unknown) => void), auth: { currentUser: null as unknown }, signin: vi.fn(), register: vi.fn(), verify: vi.fn() }))
vi.mock('./auth/firebase', () => ({ firebaseAuth: () => mock.auth }))
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, listener: (user: unknown) => void) => { mock.listener = listener; return () => {} },
  signInWithEmailAndPassword: mock.signin, signOut: vi.fn(async () => { mock.auth.currentUser = null; mock.listener?.(null) }),
  GoogleAuthProvider: class {}, createUserWithEmailAndPassword: mock.register, signInWithPopup: vi.fn(), reload: vi.fn(), sendEmailVerification: mock.verify,
}))
beforeEach(() => { mock.listener = null; mock.auth.currentUser = null; mock.signin.mockReset(); mock.register.mockReset(); mock.verify.mockReset() })

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

test('identifies login and registration clearly when switching modes', () => {
  render(<AuthScreen onBack={() => {}} onContinue={() => {}} />)
  expect(screen.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Quero me cadastrar' }))
  expect(screen.getByRole('heading', { name: 'Crie sua conta' })).toBeInTheDocument()
  expect(screen.getByLabelText('Confirmar senha')).toBeInTheDocument()
})


test.each(['abcdef1!', 'ABCDEF1!', 'Abcdefg!', 'Abcdef12'])('rejects a password missing a required character type: %s', async password => {
  render(<AuthScreen onBack={() => {}} onContinue={() => {}} />)
  fireEvent.click(screen.getByRole('button', { name: 'Quero me cadastrar' }))
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'hero@example.com' } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: password } })
  fireEvent.change(screen.getByLabelText('Confirmar senha'), { target: { value: password } })
  fireEvent.submit(screen.getByRole('button', { name: 'Criar conta' }).closest('form')!)
  expect(await screen.findByRole('alert')).toHaveTextContent('maiúscula')
  expect(mock.register).not.toHaveBeenCalled()
})

test('rejects mismatched confirmation and registers when corrected', async () => {
  mock.register.mockResolvedValue({ user: {} })
  render(<AuthScreen onBack={() => {}} onContinue={() => {}} />)
  fireEvent.click(screen.getByRole('button', { name: 'Quero me cadastrar' }))
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'hero@example.com' } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'Senha1!' } })
  fireEvent.change(screen.getByLabelText('Confirmar senha'), { target: { value: 'Outra1!' } })
  fireEvent.submit(screen.getByRole('button', { name: 'Criar conta' }).closest('form')!)
  expect(await screen.findByRole('alert')).toHaveTextContent('não coincidem')
  expect(mock.register).not.toHaveBeenCalled()
  fireEvent.change(screen.getByLabelText('Confirmar senha'), { target: { value: 'Senha1!' } })
  fireEvent.submit(screen.getByRole('button', { name: 'Criar conta' }).closest('form')!)
  await waitFor(() => expect(mock.register).toHaveBeenCalledWith(mock.auth, 'hero@example.com', 'Senha1!'))
  expect(mock.verify).toHaveBeenCalled()
})

test('alternates password visibility independently without submitting', () => {
  render(<AuthScreen onBack={() => {}} onContinue={() => {}} />)
  const password = screen.getByLabelText('Senha')
  fireEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }))
  expect(password).toHaveAttribute('type', 'text')
  fireEvent.click(screen.getByRole('button', { name: 'Ocultar senha' }))
  expect(password).toHaveAttribute('type', 'password')
  fireEvent.click(screen.getByRole('button', { name: 'Quero me cadastrar' }))
  const confirmation = screen.getByLabelText('Confirmar senha')
  fireEvent.click(screen.getByRole('button', { name: 'Mostrar confirmação de senha' }))
  expect(confirmation).toHaveAttribute('type', 'text')
  expect(password).toHaveAttribute('type', 'password')
  expect(mock.register).not.toHaveBeenCalled()
})

test('sends only edited profile fields and skips saving unchanged data', async () => {
  const initial = { nickname: 'Hero', birthDate: '2000-01-01' }
  const fetchMock = vi.fn().mockResolvedValueOnce({ status: 200, ok: true, json: async () => initial }).mockResolvedValueOnce({ status: 200, ok: true, json: async () => ({ ...initial, nickname: 'NewHero' }) })
  vi.stubGlobal('fetch', fetchMock)
  try {
    render(<AuthScreen onBack={() => {}} onContinue={() => {}} />)
    const user = { uid: 'first', providerData: [], emailVerified: true, getIdToken: async () => 'token' }
    mock.auth.currentUser = user
    mock.listener?.(user)
    const nickname = await screen.findByDisplayValue('Hero')
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    await screen.findByText('Nenhuma alteração para salvar.')
    fireEvent.change(nickname, { target: { value: 'NewHero' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(fetchMock.mock.calls[1][1].method).toBe('PATCH')
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ nickname: 'NewHero' })
  } finally { vi.unstubAllGlobals() }
})


test('shows progress and prevents duplicate profile saves until the request finishes', async () => {
  let finish!: (value: unknown) => void
  const initial = { nickname: 'Hero', birthDate: '2000-01-01' }
  const fetchMock = vi.fn().mockResolvedValueOnce({ status: 200, ok: true, json: async () => initial }).mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
  vi.stubGlobal('fetch', fetchMock)
  try {
    render(<AuthScreen onBack={() => {}} onContinue={() => {}} />)
    const user = { uid: 'first', providerData: [], emailVerified: true, getIdToken: async () => 'token' }
    mock.auth.currentUser = user; mock.listener?.(user)
    const nickname = await screen.findByDisplayValue('Hero')
    fireEvent.change(nickname, { target: { value: 'Hero2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    expect(screen.getByRole('button', { name: 'Salvando alterações…' })).toBeDisabled()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    finish({ status: 200, ok: true, json: async () => ({ ...initial, nickname: 'Hero2' }) })
    expect(await screen.findByRole('button', { name: 'Salvar alterações' })).toBeEnabled()
    expect(await screen.findByRole('status')).toHaveTextContent('Perfil salvo')
  } finally { vi.unstubAllGlobals() }
})
