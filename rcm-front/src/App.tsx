import { useState } from 'react'
import QuickCombatScreen from './components/QuickCombatScreen'
import WelcomeScreen from './components/WelcomeScreen'
import AuthScreen from './components/AuthScreen'
import HomeScreen from './components/HomeScreen'
import SavedCombatantsScreen from './components/SavedCombatantsScreen'
import { firebaseAuth } from './auth/firebase'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { useEffect } from 'react'
import { CombatantsProvider } from './combatantsContext'

function App() {
  const [screen, setScreen] = useState<'welcome' | 'offline' | 'auth' | 'profile' | 'home' | 'combatants'>('welcome')
  useEffect(() => {
    if (screen !== 'home' && screen !== 'combatants') return
    const uid = firebaseAuth().currentUser?.uid
    return onAuthStateChanged(firebaseAuth(), user => { if (!user || user.uid !== uid) setScreen('welcome') })
  }, [screen])
  if (screen === 'offline') return <QuickCombatScreen />
  if (screen === 'auth') return <AuthScreen autoContinue onBack={() => setScreen('welcome')} onContinue={() => setScreen('home')} />
  if (screen === 'profile') return <AuthScreen onBack={() => setScreen('home')} onContinue={() => setScreen('home')} />
  if (screen === 'home' || screen === 'combatants') return <CombatantsProvider key={firebaseAuth().currentUser?.uid}>{screen === 'home' ? <HomeScreen onCombatants={() => setScreen('combatants')} onProfile={() => setScreen('profile')} onSignOut={() => { void signOut(firebaseAuth()).then(() => setScreen('welcome')) }} /> : <SavedCombatantsScreen onBack={() => setScreen('home')} />}</CombatantsProvider>
  return <WelcomeScreen onContinueOffline={() => setScreen('offline')} onOpenAuth={() => setScreen('auth')} />
}
export default App
