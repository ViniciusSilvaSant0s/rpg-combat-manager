import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { createUserWithEmailAndPassword, GoogleAuthProvider, onAuthStateChanged, reload, sendEmailVerification, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { firebaseAuth } from '../auth/firebase'

type Profile = { nickname: string; birthDate: string }
type Props = { onBack: () => void; onContinue: () => void }

export default function AuthScreen({ onBack, onContinue }: Props) {
  const [user, setUser] = useState<User | null>(null)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stage, setStage] = useState<'login' | 'verify' | 'loading' | 'create' | 'profile'>('login')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const generation = useRef(0)

  async function loadProfile(current: User) {
    const requestGeneration = ++generation.current
    if (current.providerData.some(p => p.providerId === 'password') && !current.emailVerified) { setStage('verify'); return }
    setStage('loading')
    const response = await fetch('/api/profile', { headers: { Authorization: `Bearer ${await current.getIdToken()}` } })
    if (generation.current !== requestGeneration) return
    if (response.status === 404) { setStage('create'); return }
    if (!response.ok) throw new Error('Não foi possível carregar seu perfil. Tente novamente.')
    const data: Profile = await response.json()
    if (generation.current !== requestGeneration) return
    setProfile(data); setNickname(data.nickname); setBirthDate(data.birthDate); setStage('profile')
  }
  useEffect(() => {
    const requestGeneration = generation
    let unsubscribe = () => {}
    try {
      unsubscribe = onAuthStateChanged(firebaseAuth(), current => {
        generation.current++
        setUser(current)
        setProfile(null); setNickname(''); setBirthDate('')
        if (!current) { setStage('login'); return }
        loadProfile(current).catch(() => { if (firebaseAuth().currentUser?.uid === current.uid) { setError('Não foi possível carregar seu perfil. Tente novamente.'); setStage('loading') } })
      })
    } catch { setError('A autenticação não está configurada.') }
    return () => { requestGeneration.current++; unsubscribe() }
  }, [])
  async function act(fn: () => Promise<void>) {
    setError(''); setMessage('')
    try { await fn() } catch (cause) {
      const code = typeof cause === 'object' && cause !== null && 'code' in cause ? cause.code : ''
      setError(code === 'auth/account-exists-with-different-credential' || code === 'auth/email-already-in-use' ? 'Este e-mail já está associado a uma conta. Entre usando o método original.' : 'Não foi possível concluir. Confira os dados ou tente novamente.')
    }
  }
  async function submitCredentials(event: FormEvent) {
    event.preventDefault()
    await act(async () => {
      const auth = firebaseAuth()
      if (mode === 'register') {
        const result = await createUserWithEmailAndPassword(auth, email, password)
        await sendEmailVerification(result.user)
        setMessage('Enviamos um e-mail de confirmação.')
      } else await signInWithEmailAndPassword(auth, email, password)
    })
  }
  async function saveProfile(event: FormEvent) {
    event.preventDefault()
    await act(async () => {
      if (!user) throw new Error('Sessão ausente')
      const requestGeneration = generation.current
      const response = await fetch('/api/profile', { method: stage === 'create' ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` }, body: JSON.stringify({ nickname, birthDate }) })
      if (generation.current !== requestGeneration) return
      if (response.status === 409) { setError('Nickname indisponível ou perfil já cadastrado.'); return }
      if (!response.ok) { setError('Confira o nickname e a data de nascimento.'); return }
      const data: Profile = await response.json(); if (generation.current !== requestGeneration) return; setProfile(data); setStage('profile'); setMessage('Perfil salvo.')
    })
  }
  const field = 'block w-full rounded border border-amber-700 bg-stone-950 p-2 text-amber-50'
  const button = 'rounded border border-amber-600 px-4 py-2 text-amber-100 hover:bg-amber-900'
  return <main className="min-h-screen bg-stone-950 p-6 text-amber-100"><section className="mx-auto grid max-w-md gap-4 rounded border border-amber-700 bg-stone-900 p-6">
    <h1 className="text-2xl">{stage === 'profile' ? 'Seu perfil' : stage === 'create' ? 'Complete seu perfil' : 'Sua conta'}</h1>
    {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    {stage === 'login' && <><form onSubmit={submitCredentials} className="grid gap-3">
      <label>E-mail<input className={field} type="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>
      <label>Senha<input className={field} type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} /></label>
      <button className={button} type="submit">{mode === 'login' ? 'Entrar' : 'Criar conta'}</button>
    </form><button className={button} onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Quero me cadastrar' : 'Já tenho conta'}</button>
    <button className={button} onClick={() => act(async () => { await signInWithPopup(firebaseAuth(), new GoogleAuthProvider()) })}>Entrar com Google</button></>}
    {stage === 'verify' && <><p>Confirme o e-mail enviado para continuar.</p><button className={button} onClick={() => act(async () => { if (!user) return; await reload(user); await user.getIdToken(true); await loadProfile(user) })}>Já confirmei meu e-mail</button><button className={button} onClick={() => act(async () => { if (!user) return; await sendEmailVerification(user); setMessage('E-mail de confirmação enviado.') })}>Reenviar e-mail</button></>}
    {stage === 'loading' && <button className={button} onClick={() => user && act(() => loadProfile(user))}>Tentar carregar perfil novamente</button>}
    {(stage === 'create' || stage === 'profile') && <form onSubmit={saveProfile} className="grid gap-3">
      <label>Nickname<input className={field} required minLength={3} maxLength={20} pattern="[A-Za-z0-9_]+" value={nickname} onChange={e => setNickname(e.target.value)} /></label>
      <label>Data de nascimento<input className={field} required type="date" max={new Date().toISOString().slice(0, 10)} value={birthDate} onChange={e => setBirthDate(e.target.value)} /></label>
      <button className={button} type="submit">{profile ? 'Salvar alterações' : 'Concluir cadastro'}</button>
    </form>}
    {stage === 'profile' && <button className={button} onClick={onContinue}>Continuar para o aplicativo</button>}
    {user && <button className={button} onClick={() => act(async () => { generation.current++; setProfile(null); setNickname(''); setBirthDate(''); await signOut(firebaseAuth()) })}>Sair</button>}
    <button className={button} onClick={onBack}>Voltar</button>
  </section></main>
}
