import { useState } from 'react'
import QuickCombatScreen from './components/QuickCombatScreen'
import WelcomeScreen from './components/WelcomeScreen'
import AuthScreen from './components/AuthScreen'

function App() {
  const [screen, setScreen] = useState<'welcome' | 'offline' | 'auth'>('welcome')
  if (screen === 'offline') return <QuickCombatScreen />
  if (screen === 'auth') return <AuthScreen onBack={() => setScreen('welcome')} onContinue={() => setScreen('offline')} />
  return <WelcomeScreen onContinueOffline={() => setScreen('offline')} onOpenAuth={() => setScreen('auth')} />
}
export default App
