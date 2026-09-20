import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { loadCombatants, saveCombatants } from '../combatantStorage'
import type { Combatant, CombatantInput } from '../types/combatant'
import CombatantFormDialog from './CombatantFormDialog'

function QuickCombatScreen() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [combatants, setCombatants] = useState<Combatant[]>(loadCombatants)
  const [editingCombatant, setEditingCombatant] = useState<Combatant | null>(null)
  const [combatantToRemove, setCombatantToRemove] = useState<Combatant | null>(null)
  const removalDialogReference = useRef<HTMLElement>(null)
  const removalTriggerReference = useRef<HTMLElement | null>(null)

  useEffect(() => {
    saveCombatants(combatants)
  }, [combatants])

  useEffect(() => {
    if (!combatantToRemove) {
      return
    }

    removalTriggerReference.current = document.activeElement as HTMLElement
    removalDialogReference.current?.querySelector<HTMLElement>('button')?.focus()

    return () => {
      removalTriggerReference.current?.focus()
    }
  }, [combatantToRemove])

  function createCombatant(combatant: CombatantInput) {
    setCombatants((currentCombatants) => [
      ...currentCombatants,
      { ...combatant, id: crypto.randomUUID() },
    ])
    setIsFormOpen(false)
  }

  function updateCombatant(combatant: CombatantInput) {
    if (!editingCombatant) {
      return
    }

    setCombatants((currentCombatants) => currentCombatants.map((currentCombatant) => (
      currentCombatant.id === editingCombatant.id
        ? { ...combatant, id: editingCombatant.id }
        : currentCombatant
    )))
    setEditingCombatant(null)
  }

  function removeCombatant() {
    if (!combatantToRemove) {
      return
    }

    setCombatants((currentCombatants) => currentCombatants.filter(
      (combatant) => combatant.id !== combatantToRemove.id,
    ))
    setCombatantToRemove(null)
  }

  function handleRemovalKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      setCombatantToRemove(null)
      return
    }

    if (event.key !== 'Tab') {
      return
    }

    const focusableElements = Array.from(
      removalDialogReference.current?.querySelectorAll<HTMLElement>('button:not(:disabled)') ?? [],
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements.at(-1)

    if (!firstElement || !lastElement) {
      return
    }

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }

  const orderedCombatants = [...combatants].sort((first, second) => {
    if (first.initiative === null) {
      return second.initiative === null ? 0 : 1
    }

    if (second.initiative === null) {
      return -1
    }

    return second.initiative - first.initiative
  })

  return (
    <main aria-label="Combate rápido" className="quick-combat-screen">
      <section className="quick-combat-panel" aria-labelledby="quick-combat-title">
        <p className="eyebrow">Modo offline</p>
        <h1 id="quick-combat-title">Combate rápido</h1>
        <button
          type="button"
          className="primary-action"
          onClick={() => setIsFormOpen(true)}
        >
          Criar Combatente
        </button>
        <div className="combatant-list" aria-label="Combatentes">
          {orderedCombatants.map((combatant) => (
            <article
              className={`combatant-card combatant-card--${combatant.type}`}
              key={combatant.id}
            >
              <h2>{combatant.name}</h2>
              <p>{combatant.type === 'player' ? 'Jogador' : 'NPC'}</p>
              <p className="combatant-stat hit-points">
                ♥ PV: {combatant.currentHitPoints} / {combatant.maximumHitPoints}
              </p>
              <p className="combatant-stat armor-class">🛡 CA: {combatant.armorClass}</p>
              <p>⚔ Iniciativa: {combatant.initiative ?? '—'}</p>
              <div className="combatant-actions">
                <button type="button" onClick={() => setEditingCombatant(combatant)}>
                  Editar
                </button>
                <button type="button" onClick={() => setCombatantToRemove(combatant)}>
                  Remover
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
      {isFormOpen ? (
        <CombatantFormDialog
          onClose={() => setIsFormOpen(false)}
          onSave={createCombatant}
        />
      ) : null}
      {editingCombatant ? (
        <CombatantFormDialog
          combatant={editingCombatant}
          onClose={() => setEditingCombatant(null)}
          onSave={updateCombatant}
        />
      ) : null}
      {combatantToRemove ? (
        <div className="dialog-backdrop">
          <section
            aria-labelledby="remove-combatant-title"
            aria-modal="true"
            className="combatant-dialog"
            onKeyDown={handleRemovalKeyDown}
            ref={removalDialogReference}
            role="dialog"
          >
            <h2 id="remove-combatant-title">Remover {combatantToRemove.name}?</h2>
            <p>Esta ação não pode ser desfeita.</p>
            <div className="dialog-actions">
              <button type="button" onClick={() => setCombatantToRemove(null)}>
                Cancelar
              </button>
              <button className="danger-action" type="button" onClick={removeCombatant}>
                Remover combatente
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}

export default QuickCombatScreen
