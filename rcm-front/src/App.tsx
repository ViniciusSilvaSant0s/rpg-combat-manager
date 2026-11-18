import { useEffect, useState } from 'react'
import QuickCombatScreen from './screens/QuickCombatScreen'
import WelcomeScreen from './screens/WelcomeScreen'
import AuthScreen from './screens/AuthScreen'
import HomeScreen from './screens/HomeScreen'
import SavedCombatantsScreen from './screens/SavedCombatantsScreen'
import SavedCombatsScreen from './screens/SavedCombatsScreen'
import { firebaseAuth } from './auth/firebase'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { CombatantsProvider } from './combatantsContext'

type Screen = 'welcome' | 'offline' | 'auth' | 'combat' | 'profile' | 'home' | 'combatants' | 'combats'
const screens: Screen[] = ['welcome', 'offline', 'auth', 'combat', 'profile', 'home', 'combatants', 'combats']

function currentScreen(): Screen {
  const screen = window.history.state?.rpgScreen
  return screens.includes(screen) ? screen : 'welcome'
}

function App() {
  const [screen, setScreen] = useState<Screen>(currentScreen)

  function navigate(next: Screen, replace = false) {
    const state = { ...window.history.state, rpgScreen: next }
    if (replace) window.history.replaceState(state, '')
    else window.history.pushState(state, '')
    setScreen(next)
  }

  useEffect(() => {
    const onPopState = () => setScreen(currentScreen())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    if (screen !== 'home' && screen !== 'combatants' && screen !== 'combats' && screen !== 'profile') return
    const auth = firebaseAuth()
    const uid = auth.currentUser?.uid
    return onAuthStateChanged(auth, user => {
      if (!user || (uid && user.uid !== uid)) navigate('welcome', true)
    })
  }, [screen])

  if (screen === 'offline' || screen === 'combat') return <QuickCombatScreen isCombatStarted={screen === 'combat'} onStartCombat={() => navigate('combat')} />
  if (screen === 'auth') return <AuthScreen autoContinue onBack={() => window.history.back()} onContinue={() => navigate('home', true)} />
  if (screen === 'profile') return <AuthScreen onBack={() => window.history.back()} onContinue={() => window.history.back()} />
  if (screen === 'home' || screen === 'combatants' || screen === 'combats') return <CombatantsProvider key={firebaseAuth().currentUser?.uid}>{screen === 'home' ? <HomeScreen onCombatants={() => navigate('combatants')} onCombats={() => navigate('combats')} onProfile={() => navigate('profile')} onSignOut={() => { void signOut(firebaseAuth()).then(() => navigate('welcome', true)) }} /> : screen === 'combatants' ? <SavedCombatantsScreen onBack={() => window.history.back()} /> : <SavedCombatsScreen onBack={() => window.history.back()} />}</CombatantsProvider>
  return <WelcomeScreen onContinueOffline={() => navigate('offline')} onOpenAuth={() => navigate('auth')} />
}
export default App
