type WelcomeScreenProps = {
  onContinueOffline: () => void
}

function WelcomeScreen({ onContinueOffline }: WelcomeScreenProps) {
  return (
    <main className="welcome-screen">
      <section className="welcome-panel" aria-labelledby="welcome-title">
        <p className="eyebrow">RPG Combat Manager</p>
        <h1 id="welcome-title">Prepare o combate</h1>
        <p className="welcome-description">
          Gerencie seus encontros, mesmo sem conexão.
        </p>
        <div className="welcome-actions">
          <button
            type="button"
            className="primary-action"
            onClick={onContinueOffline}
          >
            Continuar offline
          </button>
          <button type="button" className="secondary-action" disabled>
            Registrar-se ou entrar — em breve
          </button>
        </div>
      </section>
    </main>
  )
}

export default WelcomeScreen
