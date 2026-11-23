import { useEffect, useState } from 'react'
import { createBrowserRouter, Navigate, useLocation, useNavigate, useBlocker } from 'react-router'
import QuickCombatScreen from './screens/QuickCombatScreen'
import WelcomeScreen from './screens/WelcomeScreen'
import AuthScreen from './screens/AuthScreen'
import FriendsScreen from './screens/FriendsScreen'
import HomeScreen from './screens/HomeScreen'
import SavedCombatantsScreen from './screens/SavedCombatantsScreen'
import SavedCombatsScreen from './screens/SavedCombatsScreen'
import { firebaseAuth } from './auth/firebase'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { CombatantsProvider } from './combatantsContext'

function PublicScreen({ page }: { page: 'welcome' | 'auth' | 'offline' }) {
  const navigate = useNavigate()
  const location = useLocation()
  if (page === 'offline') return <QuickCombatScreen isCombatStarted={location.pathname === '/offline/combate'} onStartCombat={() => navigate('/offline/combate')} />
  if (page === 'auth') return <AuthScreen autoContinue onBack={() => navigate('/')} onContinue={() => navigate('/home', { replace: true })} />
  return <WelcomeScreen onContinueOffline={() => navigate('/offline')} onOpenAuth={() => navigate('/entrar')} />
}

function PrivateScreen({ page }: { page: 'home' | 'profile' | 'friends' | 'combatants' | 'combats' }) {
  const navigate = useNavigate()
  const [identity, setIdentity] = useState<string | null | undefined>(undefined)
  useEffect(() => onAuthStateChanged(firebaseAuth(), user => setIdentity(user?.uid ?? null)), [])
  if (identity === undefined) return <p>Carregando…</p>
  if (identity === null) return <Navigate to="/" replace />
  if (page === 'profile') return <AuthScreen onBack={() => navigate('/home')} onContinue={() => navigate('/home')} />
  return <CombatantsProvider key={identity}>{page === 'home' ? <HomeScreen onFriends={() => navigate('/amigos')} onCombatants={() => navigate('/combatentes')} onCombats={() => navigate('/combates')} onProfile={() => navigate('/perfil')} onSignOut={() => { void signOut(firebaseAuth()).then(() => navigate('/', { replace: true })) }} /> : page === 'friends' ? <FriendsScreen onBack={() => navigate('/home')} /> : page === 'combatants' ? <SavedCombatantsScreen onBack={() => navigate('/home')} /> : <RoutedCombats />}</CombatantsProvider>
}

function RoutedCombats() {
  const navigate = useNavigate()
  const location = useLocation()
  const id = location.pathname.match(/^\/combates\/([^/]+)/)?.[1]
  const [unsafe, setUnsafe] = useState(false)
  const blocker = useBlocker(({ currentLocation, nextLocation }) => unsafe && currentLocation.pathname !== nextLocation.pathname && !(id && (nextLocation.pathname === `/combates/${id}` || nextLocation.pathname === `/combates/${id}/combate`)))
  return <><SavedCombatsScreen onBack={() => navigate('/home')} route={{ id, running: location.pathname.endsWith('/combate'), navigate, setUnsafe }} />{blocker.state === 'blocked' && <div role="alertdialog" aria-label="Alterações não salvas"><p>Aguarde o salvamento ou resolva a falha antes de sair.</p><button onClick={() => blocker.reset()}>Permanecer</button></div>}</>
}

export function createAppRouter() {
  return createBrowserRouter([
    { path: '/', element: <PublicScreen page="welcome" /> },
    { path: '/entrar', element: <PublicScreen page="auth" /> },
    { path: '/offline', element: <PublicScreen page="offline" /> },
    { path: '/offline/combate', element: <PublicScreen page="offline" /> },
    { path: '/home', element: <PrivateScreen page="home" /> },
    { path: '/amigos', element: <PrivateScreen page="friends" /> },
    { path: '/perfil', element: <PrivateScreen page="profile" /> },
    { path: '/combatentes', element: <PrivateScreen page="combatants" /> },
    { path: '/combates', element: <PrivateScreen page="combats" />, children: [
      { path: ':id', element: null }, { path: ':id/combate', element: null },
    ] },
    { path: '*', element: <main><h1>Página não encontrada</h1><a href="/">Voltar ao início</a></main> },
  ])
}
