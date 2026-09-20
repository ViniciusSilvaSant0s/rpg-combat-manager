import { useState } from 'react'
import './App.css'
import QuickCombatScreen from './components/QuickCombatScreen'
import WelcomeScreen from './components/WelcomeScreen'

function App() {
  const [isOfflineMode, setIsOfflineMode] = useState(false)

  if (isOfflineMode) {
    return <QuickCombatScreen />
  }

  return <WelcomeScreen onContinueOffline={() => setIsOfflineMode(true)} />
}

export default App
