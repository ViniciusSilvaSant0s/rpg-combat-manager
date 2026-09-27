import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import type { Combatant } from '../types/combatant'

type CombatAction = 'attack' | 'heal'

type CombatHistoryEntry = {
  combatants: Combatant[]
  currentCombatantId: string
}

type CombatScreenProps = {
  combatants: Combatant[]
  onCombatantsChange: (combatants: Combatant[]) => void
}

function orderCombatants(combatants: Combatant[]) {
  return [...combatants].sort((first, second) => {
    if (first.initiative === null) return second.initiative === null ? 0 : 1
    if (second.initiative === null) return -1
    return second.initiative - first.initiative
  })
}

function CombatScreen({ combatants, onCombatantsChange }: CombatScreenProps) {
  const orderedCombatants = orderCombatants(combatants)
  const [currentCombatantId, setCurrentCombatantId] = useState(orderedCombatants[0]?.id ?? '')
  const [history, setHistory] = useState<CombatHistoryEntry[]>([])
  const [pendingAction, setPendingAction] = useState<CombatAction | null>(null)
  const [selectedCombatant, setSelectedCombatant] = useState<Combatant | null>(null)
  const [amountError, setAmountError] = useState<string | null>(null)
  const dialogReference = useRef<HTMLElement>(null)
  const triggerReference = useRef<HTMLElement | null>(null)

  const currentCombatant = orderedCombatants.find((combatant) => combatant.id === currentCombatantId)
    ?? orderedCombatants[0]
  const currentIndex = orderedCombatants.findIndex((combatant) => combatant.id === currentCombatant?.id)
  const upcomingCombatants = currentIndex < 0
    ? []
    : Array.from({ length: Math.max(orderedCombatants.length - 1, 0) }, (_, index) => (
      orderedCombatants[(currentIndex + index + 1) % orderedCombatants.length]
    ))
  const isDialogOpen = pendingAction !== null

  useEffect(() => {
    if (!isDialogOpen) return

    triggerReference.current = document.activeElement as HTMLElement
    dialogReference.current?.querySelector<HTMLElement>('button, input')?.focus()

    return () => triggerReference.current?.focus()
  }, [isDialogOpen, selectedCombatant])

  function rememberCurrentState() {
    if (!currentCombatant) return
    setHistory((entries) => [...entries, { combatants, currentCombatantId: currentCombatant.id }])
  }

  function closeDialog() {
    setPendingAction(null)
    setSelectedCombatant(null)
    setAmountError(null)
  }

  function handleDialogKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      closeDialog()
      return
    }

    if (event.key !== 'Tab') return

    const focusableElements = Array.from(
      dialogReference.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)') ?? [],
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements.at(-1)
    if (!firstElement || !lastElement) return

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }

  function advanceCombatant() {
    if (!currentCombatant || orderedCombatants.length === 0) return
    rememberCurrentState()
    setCurrentCombatantId(orderedCombatants[(currentIndex + 1) % orderedCombatants.length].id)
  }

  function applyAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!pendingAction || !selectedCombatant) return

    const amount = Number(new FormData(event.currentTarget).get('amount'))
    if (!Number.isInteger(amount) || amount <= 0) {
      setAmountError('Informe um valor inteiro maior que zero.')
      return
    }

    rememberCurrentState()
    onCombatantsChange(combatants.map((combatant) => {
      if (combatant.id !== selectedCombatant.id) return combatant
      const currentHitPoints = pendingAction === 'attack'
        ? combatant.currentHitPoints - amount
        : Math.min(combatant.currentHitPoints + amount, combatant.maximumHitPoints)
      return { ...combatant, currentHitPoints }
    }))
    closeDialog()
  }

  function undoLastAction() {
    const previousState = history.at(-1)
    if (!previousState) return
    onCombatantsChange(previousState.combatants)
    setCurrentCombatantId(previousState.currentCombatantId)
    setHistory((entries) => entries.slice(0, -1))
  }

  if (!currentCombatant) return null

  const actionLabel = pendingAction === 'attack' ? 'ataque' : 'cura'
  const amountLabel = pendingAction === 'attack' ? 'Dano' : 'Cura'

  return (
    <main aria-label="Combate em andamento" className="min-h-[100svh] bg-[radial-gradient(circle_at_50%_0%,rgba(166,119,48,0.2),transparent_42%),linear-gradient(135deg,rgba(22,15,10,0.9),rgba(8,7,7,0.96))]">
      <header className="border-b border-[rgba(199,154,78,0.5)] px-6 py-5 max-[620px]:px-4">
        <p className="m-0 font-[family-name:var(--font-ui)] text-xs font-bold tracking-[0.2em] text-[#d7af66] uppercase">Próximos combatentes</p>
        <div
          aria-label="Próximos combatentes"
          className="mt-2.5 flex gap-2.5 overflow-x-auto pb-2"
        >
          {upcomingCombatants.map((combatant) => (
            <article className={`min-w-[180px] ${upcomingCombatants.length >= 4 ? 'flex-1' : 'flex-[0_0_180px]'} border bg-[rgba(30,21,14,0.78)] p-3 ${combatant.type === 'player' ? 'border-[#82bde8]' : 'border-[#d57d68]'}`} key={combatant.id}>
              <h2 className="m-0 font-[family-name:var(--font-display)] text-lg">{combatant.name}</h2>
              <p className="mt-1.5 mb-0">♥ PV: {combatant.currentHitPoints} / {combatant.maximumHitPoints}</p>
              <p className="mt-1.5 mb-0">🛡 Defesa: {combatant.armorClass}</p>
              <p className="mt-1.5 mb-0">⚔ Iniciativa: {combatant.initiative ?? '—'}</p>
            </article>
          ))}
        </div>
      </header>

      <section className="flex flex-col items-center px-6 py-[clamp(28px,5vw,60px)] max-[620px]:px-4" aria-labelledby="combat-title">
        <p className="m-0 font-[family-name:var(--font-ui)] text-xs font-bold tracking-[0.2em] text-[#d7af66] uppercase">Turno atual</p>
        <h1 id="combat-title" className="mt-3 mb-6 text-center font-[family-name:var(--font-display)] text-3xl font-semibold text-[#f5e4ba]">Combate em andamento</h1>
        <article
          aria-label={`Combatente atual: ${currentCombatant.name}`}
          className={`w-full max-w-[460px] border bg-[rgba(30,21,14,0.86)] p-[clamp(28px,5vw,48px)] text-center shadow-[0_16px_38px_rgba(0,0,0,0.3)] ${currentCombatant.type === 'player' ? 'border-[#82bde8]' : 'border-[#d57d68]'}`}
        >
          <h2 className="m-0 font-[family-name:var(--font-display)] text-[clamp(2rem,5vw,3.2rem)]">{currentCombatant.name}</h2>
          <p className="mt-1.5 mb-0 text-[#d6c4a2]">{currentCombatant.type === 'player' ? 'Jogador' : 'NPC'}</p>
          <p className="mt-1.5 mb-0 font-bold text-[#f08a8a]">♥ PV: {currentCombatant.currentHitPoints} / {currentCombatant.maximumHitPoints}</p>
          <p className="mt-1.5 mb-0 font-bold text-[#94bce9]">🛡 Defesa: {currentCombatant.armorClass}</p>
          <p className="mt-1.5 mb-0">⚔ Iniciativa: {currentCombatant.initiative ?? '—'}</p>
        </article>
        <div className="mt-[18px] grid w-full max-w-[460px] grid-cols-3 gap-2.5 max-[620px]:grid-cols-1" aria-label="Ações de combate">
          <button className="min-h-11 cursor-pointer border border-[rgba(211,173,103,0.62)] bg-[rgba(93,67,39,0.72)] px-[13px] py-2 font-[family-name:var(--font-ui)] font-bold text-[#f3dfb4] hover:border-[#e4bc6e] hover:bg-[rgba(124,91,51,0.85)] focus-visible:outline-3 focus-visible:outline-[#f8df9d] focus-visible:outline-offset-2" aria-label="Atacar" type="button" onClick={() => setPendingAction('attack')}>⚔ Atacar</button>
          <button className="min-h-11 cursor-pointer border border-[rgba(211,173,103,0.62)] bg-[rgba(93,67,39,0.72)] px-[13px] py-2 font-[family-name:var(--font-ui)] font-bold text-[#f3dfb4] hover:border-[#e4bc6e] hover:bg-[rgba(124,91,51,0.85)] focus-visible:outline-3 focus-visible:outline-[#f8df9d] focus-visible:outline-offset-2" aria-label="Curar" type="button" onClick={() => setPendingAction('heal')}>✚ Curar</button>
          <button className="min-h-11 cursor-pointer border border-[#f3d38a] bg-linear-to-br from-[#d5a951] to-[#a8742c] px-[13px] py-2 font-[family-name:var(--font-ui)] font-bold text-[#26180b] hover:from-[#e6bb61] hover:to-[#bd8637] focus-visible:outline-3 focus-visible:outline-[#f8df9d] focus-visible:outline-offset-2" aria-label="Próximo Combatente" type="button" onClick={advanceCombatant}>➜ Próximo Combatente</button>
        </div>
        <button aria-label="Desfazer última ação" className="mt-4 min-h-11 cursor-pointer border border-[rgba(211,173,103,0.62)] bg-[rgba(93,67,39,0.72)] px-[13px] py-2 font-[family-name:var(--font-ui)] font-bold text-[#f3dfb4] hover:border-[#e4bc6e] hover:bg-[rgba(124,91,51,0.85)] focus-visible:outline-3 focus-visible:outline-[#f8df9d] focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-55" disabled={history.length === 0} type="button" onClick={undoLastAction}>
          ↶ Desfazer última ação
        </button>
      </section>

      {isDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-6">
          <section
            aria-labelledby="combat-action-title"
            aria-modal="true"
            className="max-h-[calc(100svh-48px)] w-full max-w-[520px] overflow-y-auto border border-[#c79a4e] bg-[#21170f] p-7 text-[#f5e4ba] shadow-2xl"
            onKeyDown={handleDialogKeyDown}
            ref={dialogReference}
            role="dialog"
          >
            {selectedCombatant ? (
              <form className="grid gap-4" onSubmit={applyAction}>
                <h2 id="combat-action-title" className="mt-0 font-[family-name:var(--font-display)] text-2xl">Aplicar {pendingAction === 'attack' ? 'dano' : 'cura'} em {selectedCombatant.name}</h2>
                {amountError ? <p className="text-[#f08a8a]" role="alert">{amountError}</p> : null}
                <label className="grid gap-1.5">
                  {amountLabel}
                  <input className="min-h-10 border border-[#8a6a38] bg-[#100c09] px-2 text-inherit focus-visible:outline-3 focus-visible:outline-[#f8df9d]" min="1" name="amount" required step="1" type="number" />
                </label>
                <div className="flex justify-end gap-3">
                  <button className="min-h-11 cursor-pointer border border-[rgba(211,173,103,0.62)] bg-[rgba(93,67,39,0.72)] px-4 py-2 font-bold text-[#f3dfb4] hover:border-[#e4bc6e] hover:bg-[rgba(124,91,51,0.85)] focus-visible:outline-3 focus-visible:outline-[#f8df9d] focus-visible:outline-offset-2" type="button" onClick={() => setSelectedCombatant(null)}>Voltar</button>
                  <button className="min-h-11 cursor-pointer border border-[#f3d38a] bg-linear-to-br from-[#d5a951] to-[#a8742c] px-4 py-2 font-bold text-[#26180b] hover:from-[#e6bb61] hover:to-[#bd8637] focus-visible:outline-3 focus-visible:outline-[#f8df9d] focus-visible:outline-offset-2" type="submit">Confirmar {pendingAction === 'attack' ? 'dano' : 'cura'}</button>
                </div>
              </form>
            ) : (
              <>
                <h2 id="combat-action-title" className="mt-0 font-[family-name:var(--font-display)] text-2xl">Escolher alvo para {actionLabel}</h2>
                <div className="my-[18px] grid gap-2">
                  {orderedCombatants.map((combatant) => (
                    <button className="min-h-11 cursor-pointer border border-[rgba(211,173,103,0.62)] bg-[rgba(93,67,39,0.72)] px-[13px] py-2 text-left font-bold text-[#f3dfb4] hover:border-[#e4bc6e] hover:bg-[rgba(124,91,51,0.85)] focus-visible:outline-3 focus-visible:outline-[#f8df9d] focus-visible:outline-offset-2" key={combatant.id} type="button" onClick={() => setSelectedCombatant(combatant)}>
                      {combatant.name}
                    </button>
                  ))}
                </div>
                <div className="flex justify-end gap-3">
                  <button className="min-h-11 cursor-pointer border border-[rgba(211,173,103,0.62)] bg-[rgba(93,67,39,0.72)] px-4 py-2 font-bold text-[#f3dfb4] hover:border-[#e4bc6e] hover:bg-[rgba(124,91,51,0.85)] focus-visible:outline-3 focus-visible:outline-[#f8df9d] focus-visible:outline-offset-2" type="button" onClick={closeDialog}>Cancelar</button>
                </div>
              </>
            )}
          </section>
        </div>
      ) : null}
    </main>
  )
}

export default CombatScreen
