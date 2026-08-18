import { useState } from 'react'
import './App.css'
import WelcomeScreen from './components/WelcomeScreen'

function App() {
  const [isOfflineMode, setIsOfflineMode] = useState(false)

  if (isOfflineMode) {
    return <main aria-label="Modo offline" />
  }

  return <WelcomeScreen onContinueOffline={() => setIsOfflineMode(true)} />
}

export default App
