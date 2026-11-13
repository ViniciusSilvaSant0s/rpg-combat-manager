import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { createUserWithEmailAndPassword, GoogleAuthProvider, onAuthStateChanged, reload, sendEmailVerification, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { firebaseAuth } from '../auth/firebase'

function Spinner() {
  return <span aria-hidden="true" className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent align-[-2px] motion-reduce:animate-none" />
}

function EyeIcon({ visible }: { visible: boolean }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />{visible && <path d="M4 4l16 16" />}</svg>
}

type Profile = { nickname: string; birthDate: string }
type Props = { onBack: () => void; onContinue: () => void }

export default function AuthScreen({ onBack, onContinue }: Props) {
  const [user, setUser] = useState<User | null>(null)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [nickname, setNickname] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stage, setStage] = useState<'login' | 'verify' | 'loading' | 'create' | 'profile'>('login')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)
  const pendingRef = useRef(false)
  const generation = useRef(0)

  async function loadProfile(current: User) {
    const requestGeneration = ++generation.current
    if (current.providerData.some(p => p.providerId === 'password') && !current.emailVerified) { setStage('verify'); return }
    setStage('loading'); setProfileLoading(true)
    try {
    const response = await fetch('/api/profile', { headers: { Authorization: `Bearer ${await current.getIdToken()}` } })
    if (generation.current !== requestGeneration) return
    if (response.status === 404) { setStage('create'); return }
    if (!response.ok) throw new Error('Não foi possível carregar seu perfil. Tente novamente.')
    const data: Profile = await response.json()
    if (generation.current !== requestGeneration) return
    setProfile(data); setNickname(data.nickname); setBirthDate(data.birthDate); setStage('profile')
    } finally { if (generation.current === requestGeneration) setProfileLoading(false) }
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
  async function act(action: string, fn: () => Promise<void>) {
    if (pendingRef.current) return
    pendingRef.current = true; setPending(action)
    setError(''); setMessage('')
    try { await fn() } catch (cause) {
      const code = typeof cause === 'object' && cause !== null && 'code' in cause ? cause.code : ''
      setError(code === 'auth/account-exists-with-different-credential' || code === 'auth/email-already-in-use' ? 'Este e-mail já está associado a uma conta. Entre usando o método original.' : 'Não foi possível concluir. Confira os dados ou tente novamente.')
    } finally { pendingRef.current = false; setPending('') }
  }
  async function submitCredentials(event: FormEvent) {
    event.preventDefault()
    if (mode === 'register') {
      if (password.length < 6 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^\p{L}\p{N}\s]/u.test(password)) {
        setError('A senha deve ter pelo menos 6 caracteres, incluindo letra maiúscula, minúscula, número e caractere especial.')
        return
      }
      if (password !== confirmPassword) { setError('As senhas não coincidem. Confira e tente novamente.'); return }
    }
    await act('credentials', async () => {
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
    await act('save', async () => {
      if (!user) throw new Error('Sessão ausente')
      const requestGeneration = generation.current
      const changes: Partial<Profile> = stage === 'create' ? { nickname, birthDate } : {
        ...(nickname !== profile?.nickname ? { nickname } : {}),
        ...(birthDate !== profile?.birthDate ? { birthDate } : {}),
      }
      if (stage === 'profile' && Object.keys(changes).length === 0) { setMessage('Nenhuma alteração para salvar.'); return }
      const response = await fetch('/api/profile', { method: stage === 'create' ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` }, body: JSON.stringify(changes) })
      if (generation.current !== requestGeneration) return
      if (response.status === 409) { setError('Nickname indisponível ou perfil já cadastrado.'); return }
      if (!response.ok) { setError('Confira o nickname e a data de nascimento.'); return }
      const data: Profile = await response.json(); if (generation.current !== requestGeneration) return; setProfile(data); setStage('profile'); setMessage('Perfil salvo.')
    })
  }
  const field = 'mt-2 block w-full rounded-sm border border-[#705333] bg-[#100c09] px-4 py-3 text-base text-[#f5e4ba] placeholder:text-[#82735d] transition focus:border-[#e5bd70] focus:outline-2 focus:outline-offset-2 focus:outline-[#e5bd70]'
  const primary = 'min-h-[50px] w-full cursor-pointer disabled:cursor-wait disabled:opacity-65 rounded-sm border border-[#f3d38a] bg-linear-to-br from-[#d5a951] to-[#a8742c] px-5 py-3 text-sm font-bold tracking-wide text-[#26180b] shadow-[inset_0_1px_rgba(255,247,211,0.4)] transition hover:from-[#e6bb61] hover:to-[#bd8637] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f8df9d]'
  const secondary = 'min-h-[48px] w-full cursor-pointer disabled:cursor-wait disabled:opacity-65 rounded-sm border border-[#745a39] bg-[#382a1d]/60 px-5 py-3 text-sm font-semibold text-[#f1dfbd] transition hover:border-[#c79a4e] hover:bg-[#49331e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f8df9d]'
  const link = 'cursor-pointer disabled:cursor-wait disabled:opacity-65 text-sm font-semibold text-[#e5be76] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f8df9d]'
  const title = stage === 'profile' ? 'Seu perfil' : stage === 'create' ? 'Complete seu perfil' : stage === 'verify' ? 'Confirme seu e-mail' : stage === 'loading' ? 'Carregando seu perfil' : mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'
  const description = stage === 'profile' ? 'Confira seus dados antes de continuar sua aventura.' : stage === 'create' ? 'Conte um pouco sobre você para completar seu cadastro.' : stage === 'verify' ? 'Enviamos um link de confirmação para seu e-mail. Confirme seu endereço para continuar.' : stage === 'loading' ? 'Estamos buscando seus dados. Se necessário, tente novamente.' : mode === 'login' ? 'Entre na sua conta para continuar sua aventura.' : 'Comece sua jornada criando uma conta.'

  return <main className="flex min-h-[100svh] items-center justify-center bg-[radial-gradient(circle_at_50%_0%,rgba(166,119,48,0.2),transparent_42%),linear-gradient(135deg,#160f0a,#080707)] px-4 py-8 text-[#f5e4ba] sm:px-6">
    <section className="relative w-full max-w-[480px] border border-[#c79a4e]/75 bg-[#1e150e]/95 px-6 py-9 shadow-[0_0_0_5px_rgba(76,48,22,0.38),0_26px_70px_rgba(0,0,0,0.52)] sm:px-11 sm:py-11" aria-labelledby="auth-title">
      <div aria-hidden="true" className="absolute top-3 left-4 text-[#c79a4e]">✦</div><div aria-hidden="true" className="absolute right-4 bottom-3 text-[#c79a4e]">✦</div>
      <img src={`${import.meta.env.BASE_URL}branding/rpg-combat-manager-logo-pixel-clean.png`} alt="RPG Combat Manager" className="mx-auto mb-8 block h-auto w-full max-w-[230px]" />
      <h1 id="auth-title" className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[#f5e4ba] sm:text-4xl">{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-[#d6c4a2]">{description}</p>
      <div className="mt-7 grid gap-4">
        {pending && <p role="status" className="sr-only">Aguarde, operação em andamento.</p>}
        {error && <p role="alert" className="border border-[#a45a55] bg-[#4c2422]/60 px-4 py-3 text-sm text-[#ffd4cd]">{error}</p>}
        {message && <p role="status" className="border border-[#66835a] bg-[#263c27]/60 px-4 py-3 text-sm text-[#d6efce]">{message}</p>}
        {stage === 'login' && <><form onSubmit={submitCredentials} className="grid gap-5">
          <label className="text-sm font-semibold text-[#ebdbbd]">E-mail<input className={field} type="email" autoComplete="email" placeholder="voce@exemplo.com" required value={email} onChange={e => setEmail(e.target.value)} /></label>
          <div><label className="text-sm font-semibold text-[#ebdbbd]" htmlFor="auth-password">Senha</label><div className="relative"><input id="auth-password" className={field + ' pr-12'} type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} aria-describedby={mode === 'register' ? 'password-requirements' : undefined} required minLength={6} value={password} onChange={e => setPassword(e.target.value)} /><button type="button" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#d6c4a2] hover:text-[#f5e4ba] focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[#f8df9d]"><EyeIcon visible={showPassword} /></button></div>{mode === 'register' && <p id="password-requirements" className="mt-2 text-xs leading-relaxed text-[#c2ae8c]">Mínimo de 6 caracteres, com letras maiúsculas e minúsculas, número e caractere especial.</p>}</div>
          {mode === 'register' && <div><label htmlFor="confirm-password" className="text-sm font-semibold text-[#ebdbbd]">Confirmar senha</label><div className="relative"><input id="confirm-password" className={field + ' pr-12'} type={showConfirmation ? 'text' : 'password'} autoComplete="new-password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /><button type="button" aria-label={showConfirmation ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'} aria-pressed={showConfirmation} onClick={() => setShowConfirmation(!showConfirmation)} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#d6c4a2] hover:text-[#f5e4ba] focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[#f8df9d]"><EyeIcon visible={showConfirmation} /></button></div></div>}
          <button className={primary} type="submit" disabled={!!pending}>{pending === 'credentials' && <Spinner />}{pending === 'credentials' ? (mode === 'login' ? 'Entrando…' : 'Criando conta…') : (mode === 'login' ? 'Entrar' : 'Criar conta')}</button>
        </form>
        <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-[#a99472]" aria-hidden="true"><span className="h-px flex-1 bg-[#705333]" />ou<span className="h-px flex-1 bg-[#705333]" /></div>
        <button type="button" className={secondary} disabled={!!pending} onClick={() => act('google', async () => { await signInWithPopup(firebaseAuth(), new GoogleAuthProvider()) })}>{pending === 'google' && <Spinner />}{pending === 'google' ? 'Conectando ao Google…' : 'Entrar com Google'}</button>
        <p className="text-center text-sm text-[#cbb995]">{mode === 'login' ? 'Ainda não tem uma conta? ' : 'Já tem uma conta? '}<button type="button" className={link} disabled={!!pending} onClick={() => { setError(''); setMessage(''); setConfirmPassword(''); setShowPassword(false); setShowConfirmation(false); setMode(mode === 'login' ? 'register' : 'login') }}>{mode === 'login' ? 'Quero me cadastrar' : 'Já tenho conta'}</button></p></>}
        {stage === 'verify' && <><button className={primary} disabled={!!pending} onClick={() => act('verify', async () => { if (!user) return; await reload(user); await user.getIdToken(true); await loadProfile(user) })}>{pending === 'verify' && <Spinner />}{pending === 'verify' ? 'Verificando confirmação…' : 'Já confirmei meu e-mail'}</button><button className={secondary} disabled={!!pending} onClick={() => act('resend', async () => { if (!user) return; await sendEmailVerification(user); setMessage('E-mail de confirmação enviado.') })}>{pending === 'resend' && <Spinner />}{pending === 'resend' ? 'Enviando e-mail…' : 'Reenviar e-mail'}</button></>}
        {stage === 'loading' && (profileLoading ? <p role="status" className="text-sm text-[#d6c4a2]"><Spinner />Carregando seu perfil…</p> : <button className={secondary} disabled={!!pending} onClick={() => user && act('retry', () => loadProfile(user))}>Tentar carregar perfil novamente</button>)}
        {(stage === 'create' || stage === 'profile') && <form onSubmit={saveProfile} className="grid gap-5">
          <label className="text-sm font-semibold text-[#ebdbbd]">Nickname<input className={field} disabled={!!pending} required minLength={3} maxLength={20} pattern="[A-Za-z0-9_]+" value={nickname} onChange={e => setNickname(e.target.value)} /><span className="mt-2 block text-xs font-normal text-[#c2ae8c]">De 3 a 20 letras, números ou underline.</span></label>
          <label className="text-sm font-semibold text-[#ebdbbd]">Data de nascimento<input className={field} disabled={!!pending} required type="date" max={new Date().toISOString().slice(0, 10)} value={birthDate} onChange={e => setBirthDate(e.target.value)} /></label>
          <button className={stage === 'create' ? primary : secondary} type="submit" disabled={!!pending}>{pending === 'save' && <Spinner />}{pending === 'save' ? (profile ? 'Salvando alterações…' : 'Concluindo cadastro…') : (profile ? 'Salvar alterações' : 'Concluir cadastro')}</button>
        </form>}
        {stage === 'profile' && <button className={primary} disabled={!!pending} onClick={onContinue}>Continuar para o aplicativo</button>}
        {user && <button className={link + ' justify-self-center'} disabled={!!pending} onClick={() => act('signout', async () => { generation.current++; setProfile(null); setNickname(''); setBirthDate(''); await signOut(firebaseAuth()) })}>{pending === 'signout' ? 'Saindo…' : 'Sair'}</button>}
        <button className={link + ' justify-self-center'} disabled={!!pending} onClick={onBack}>← Voltar</button>
      </div>
    </section>
  </main>
}
