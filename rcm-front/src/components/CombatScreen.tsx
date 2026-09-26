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
    <main aria-label="Combate em andamento" className="combat-screen">
      <header className="combat-turn-rail">
        <p className="eyebrow">Próximos combatentes</p>
        <div
          aria-label="Próximos combatentes"
          className={`combat-turn-rail__cards${upcomingCombatants.length >= 4 ? ' combat-turn-rail__cards--filled' : ''}`}
        >
          {upcomingCombatants.map((combatant) => (
            <article className={`combat-turn-card combatant-card--${combatant.type}`} key={combatant.id}>
              <h2>{combatant.name}</h2>
              <p>♥ PV: {combatant.currentHitPoints} / {combatant.maximumHitPoints}</p>
              <p>🛡 Defesa: {combatant.armorClass}</p>
              <p>⚔ Iniciativa: {combatant.initiative ?? '—'}</p>
            </article>
          ))}
        </div>
      </header>

      <section className="current-combatant-section" aria-labelledby="combat-title">
        <p className="eyebrow">Turno atual</p>
        <h1 id="combat-title">Combate em andamento</h1>
        <article
          aria-label={`Combatente atual: ${currentCombatant.name}`}
          className={`current-combatant-card combatant-card--${currentCombatant.type}`}
        >
          <h2>{currentCombatant.name}</h2>
          <p>{currentCombatant.type === 'player' ? 'Jogador' : 'NPC'}</p>
          <p className="combatant-stat hit-points">♥ PV: {currentCombatant.currentHitPoints} / {currentCombatant.maximumHitPoints}</p>
          <p className="combatant-stat armor-class">🛡 Defesa: {currentCombatant.armorClass}</p>
          <p>⚔ Iniciativa: {currentCombatant.initiative ?? '—'}</p>
        </article>
        <div className="combat-actions" aria-label="Ações de combate">
          <button aria-label="Atacar" type="button" onClick={() => setPendingAction('attack')}>⚔ Atacar</button>
          <button aria-label="Curar" type="button" onClick={() => setPendingAction('heal')}>✚ Curar</button>
          <button aria-label="Próximo Combatente" className="primary-action" type="button" onClick={advanceCombatant}>➜ Próximo Combatente</button>
        </div>
        <button aria-label="Desfazer última ação" className="undo-action" disabled={history.length === 0} type="button" onClick={undoLastAction}>
          ↶ Desfazer última ação
        </button>
      </section>

      {isDialogOpen ? (
        <div className="dialog-backdrop">
          <section
            aria-labelledby="combat-action-title"
            aria-modal="true"
            className="combatant-dialog combat-action-dialog"
            onKeyDown={handleDialogKeyDown}
            ref={dialogReference}
            role="dialog"
          >
            {selectedCombatant ? (
              <form onSubmit={applyAction}>
                <h2 id="combat-action-title">Aplicar {pendingAction === 'attack' ? 'dano' : 'cura'} em {selectedCombatant.name}</h2>
                {amountError ? <p role="alert">{amountError}</p> : null}
                <label>
                  {amountLabel}
                  <input min="1" name="amount" required step="1" type="number" />
                </label>
                <div className="dialog-actions">
                  <button type="button" onClick={() => setSelectedCombatant(null)}>Voltar</button>
                  <button className="primary-action" type="submit">Confirmar {pendingAction === 'attack' ? 'dano' : 'cura'}</button>
                </div>
              </form>
            ) : (
              <>
                <h2 id="combat-action-title">Escolher alvo para {actionLabel}</h2>
                <div className="combat-target-list">
                  {orderedCombatants.map((combatant) => (
                    <button key={combatant.id} type="button" onClick={() => setSelectedCombatant(combatant)}>
                      {combatant.name}
                    </button>
                  ))}
                </div>
                <div className="dialog-actions">
                  <button type="button" onClick={closeDialog}>Cancelar</button>
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
