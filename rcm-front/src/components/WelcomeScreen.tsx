type WelcomeScreenProps = {
  onContinueOffline: () => void
}

function WelcomeScreen({ onContinueOffline }: WelcomeScreenProps) {
  return (
    <main
      className="flex min-h-[100svh] items-center justify-center bg-[radial-gradient(circle_at_50%_0%,rgba(166,119,48,0.2),transparent_42%),linear-gradient(135deg,rgba(22,15,10,0.9),rgba(8,7,7,0.96))] px-6 max-[480px]:px-4"
    >
      <section
        className="relative w-full max-w-[540px] border border-[rgba(199,154,78,0.75)] bg-[rgba(30,21,14,0.78)] p-[clamp(36px,8vw,68px)] text-center shadow-[0_0_0_5px_rgba(76,48,22,0.38),0_26px_70px_rgba(0,0,0,0.52)] before:absolute before:top-3.5 before:left-4 before:text-2xl before:leading-none before:text-[#c79a4e] before:content-['✦'] after:absolute after:right-4 after:bottom-3.5 after:text-2xl after:leading-none after:text-[#c79a4e] after:content-['✦'] max-[480px]:p-[42px_28px]"
        aria-labelledby="welcome-title"
      >
        <p className="m-0 font-[family-name:var(--font-ui)] text-xs font-bold tracking-[0.2em] text-[#d7af66] uppercase">
          RPG Combat Manager
        </p>
        <h1
          id="welcome-title"
          className="mt-7 mb-[18px] font-[family-name:var(--font-display)] text-[clamp(2.5rem,8vw,4.25rem)] font-semibold tracking-[-0.045em] text-[#f5e4ba] leading-[0.95]"
        >
          Prepare o combate
        </h1>
        <p className="mx-auto my-0 max-w-[350px] text-[1.05rem] leading-[1.6] text-[#d6c4a2]">
          Gerencie seus encontros, mesmo sem conexão.
        </p>
        <div className="mx-auto mt-[38px] grid max-w-[360px] gap-3">
          <button
            type="button"
            className="min-h-[52px] cursor-pointer rounded-sm border border-[#f3d38a] bg-linear-to-br from-[#d5a951] to-[#a8742c] px-5 py-3 font-[family-name:var(--font-ui)] text-[0.83rem] font-bold tracking-[0.08em] text-[#26180b] uppercase shadow-[inset_0_1px_rgba(255,247,211,0.55),0_5px_16px_rgba(0,0,0,0.26)] hover:from-[#e6bb61] hover:to-[#bd8637] focus-visible:outline-3 focus-visible:outline-[#f8df9d] focus-visible:outline-offset-4"
            onClick={onContinueOffline}
          >
            Continuar offline
          </button>
          <button
            type="button"
            className="min-h-[52px] cursor-not-allowed rounded-sm border border-[rgba(173,139,82,0.36)] bg-[rgba(74,54,34,0.38)] px-5 py-3 font-[family-name:var(--font-ui)] text-[0.83rem] font-bold tracking-[0.08em] text-[#a8997e] uppercase"
            disabled
          >
            Registrar-se ou entrar — em breve
          </button>
        </div>
      </section>
    </main>
  )
}

export default WelcomeScreen
