import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { loadCombatants, saveCombatants } from '../combatantStorage'
import type { Combatant, CombatantInput } from '../types/combatant'
import CombatIcon from './CombatIcon'
import CombatantFormDialog from './CombatantFormDialog'
import CombatScreen from './CombatScreen'
import PixelCornerFrame from './PixelCornerFrame'
import CharacterSprite from './CharacterSprite'

function QuickCombatScreen() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [combatants, setCombatants] = useState<Combatant[]>(loadCombatants)
  const [editingCombatant, setEditingCombatant] = useState<Combatant | null>(null)
  const [combatantToRemove, setCombatantToRemove] = useState<Combatant | null>(null)
  const [isCombatStarted, setIsCombatStarted] = useState(false)
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

  if (isCombatStarted) {
    return <CombatScreen combatants={combatants} onCombatantsChange={setCombatants} />
  }

  return (
    <main aria-label="Combate rápido" className="flex min-h-[100svh] justify-center bg-[radial-gradient(circle_at_50%_0%,rgba(166,119,48,0.2),transparent_42%),linear-gradient(135deg,rgba(22,15,10,0.9),rgba(8,7,7,0.96))] px-6 py-12 max-[620px]:px-4">
      <section className="w-full max-w-[900px]" aria-labelledby="quick-combat-title">
        <p className="m-0 font-[family-name:var(--font-ui)] text-xs font-bold tracking-[0.2em] text-[#d7af66] uppercase">Modo offline</p>
        <h1 id="quick-combat-title" className="mt-3 mb-6 font-[family-name:var(--font-display)] text-4xl font-semibold text-[#f5e4ba]">Combate rápido</h1>
        <PixelCornerFrame as="button"
          type="button"
          className="min-h-11 cursor-pointer rounded-sm border border-[#f3d38a] bg-linear-to-br from-[#d5a951] to-[#a8742c] px-4 py-2 font-[family-name:var(--font-ui)] text-xs font-bold tracking-[0.06em] text-[#26180b] uppercase transition hover:-translate-y-px hover:from-[#e6bb61] hover:to-[#bd8637] focus-visible:outline-3 focus-visible:outline-[#f8df9d] focus-visible:outline-offset-3"
          onClick={() => setIsFormOpen(true)}
        >
          Criar Combatente
        </PixelCornerFrame>
        <PixelCornerFrame as="button"
          className="ml-2 min-h-11 cursor-pointer rounded-sm border border-[rgba(211,173,103,0.62)] bg-[rgba(93,67,39,0.72)] px-4 py-2 font-[family-name:var(--font-ui)] text-xs font-bold tracking-[0.06em] text-[#f3dfb4] uppercase transition hover:-translate-y-px hover:bg-[rgba(124,91,51,0.85)] hover:border-[#e4bc6e] focus-visible:outline-3 focus-visible:outline-[#f8df9d] focus-visible:outline-offset-3 disabled:cursor-not-allowed disabled:opacity-55 max-[620px]:ml-0 max-[620px]:mt-2"
          disabled={combatants.length === 0}
          type="button"
          onClick={() => setIsCombatStarted(true)}
        >
          Iniciar Combate
        </PixelCornerFrame>
        <div className="mt-6 grid gap-3" aria-label="Combatentes">
          {orderedCombatants.map((combatant) => (
            <article
              className={`combatant-card--${combatant.type} flex items-center justify-between gap-3 border bg-[rgba(30,21,14,0.78)] p-[18px] shadow-[0_10px_22px_rgba(0,0,0,0.2)] ${combatant.type === 'player' ? 'border-[#82bde8] shadow-[0_0_0_1px_rgba(130,189,232,0.18),0_10px_22px_rgba(0,0,0,0.2)]' : 'border-[#d57d68] shadow-[0_0_0_1px_rgba(213,125,104,0.18),0_10px_22px_rgba(0,0,0,0.2)]'}`}
              key={combatant.id}
            >
              <div className="min-w-0 flex-1 break-words">
                <h2 className="m-0 font-[family-name:var(--font-display)] text-2xl">{combatant.name}</h2>
                <p className="mt-1.5 mb-0 text-sm text-[#d6c4a2]">{combatant.type === 'player' ? 'Jogador' : 'NPC'}</p>
                <p className="mt-1.5 mb-0 font-bold text-[#f08a8a]">
                  <CombatIcon name="heart" />PV: {combatant.currentHitPoints} / {combatant.maximumHitPoints}
                  {combatant.additionalHitPoints && combatant.additionalHitPoints > 0
                    ? ` - ${combatant.additionalHitPoints}`
                    : ''}
                </p>
                <p className="mt-1.5 mb-0 font-bold text-[#94bce9]"><CombatIcon name="shield" />CA: {combatant.armorClass}</p>
                <p className="mt-1.5 mb-0"><CombatIcon name="thunder" />Iniciativa: {combatant.initiative ?? '—'}</p>
                <div className="mt-3.5 flex flex-wrap gap-2">
                  <PixelCornerFrame as="button" className="min-h-[38px] cursor-pointer rounded-sm border border-[rgba(211,173,103,0.62)] bg-[rgba(93,67,39,0.72)] px-[13px] py-2 text-xs font-bold tracking-[0.06em] text-[#f3dfb4] uppercase transition hover:-translate-y-px hover:border-[#e4bc6e] hover:bg-[rgba(124,91,51,0.85)] focus-visible:outline-3 focus-visible:outline-[#f8df9d] focus-visible:outline-offset-3" type="button" onClick={() => setEditingCombatant(combatant)}>
                    Editar
                  </PixelCornerFrame>
                  <PixelCornerFrame as="button" className="min-h-[38px] cursor-pointer rounded-sm border border-[#e39782] bg-[#8c362d] px-[13px] py-2 text-xs font-bold tracking-[0.06em] text-[#fff4ec] uppercase shadow-[inset_0_1px_rgba(255,235,227,0.35),0_4px_12px_rgba(0,0,0,0.18)] transition hover:-translate-y-px hover:border-[#ffc0ad] hover:bg-[#a9473b] focus-visible:outline-3 focus-visible:outline-[#f8df9d] focus-visible:outline-offset-3" type="button" onClick={() => setCombatantToRemove(combatant)}>
                    Remover
                  </PixelCornerFrame>
                </div>
              </div>
              {combatant.characterId ? (
                <div className="flex shrink-0 items-center justify-center">
                  <CharacterSprite characterId={combatant.characterId} label={`Personagem de ${combatant.name}`} />
                </div>
              ) : null}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-6">
          <section
            aria-labelledby="remove-combatant-title"
            aria-modal="true"
            className="w-full max-w-[520px] border border-[#c79a4e] bg-[#21170f] p-7 text-[#f5e4ba] shadow-2xl"
            onKeyDown={handleRemovalKeyDown}
            ref={removalDialogReference}
            role="dialog"
          >
            <h2 id="remove-combatant-title" className="mt-0 font-[family-name:var(--font-display)] text-2xl">Remover {combatantToRemove.name}?</h2>
            <p className="text-[#d6c4a2]">Esta ação não pode ser desfeita.</p>
            <div className="mt-6 flex justify-end gap-3">
              <PixelCornerFrame as="button" className="min-h-11 cursor-pointer border border-[rgba(211,173,103,0.62)] bg-[rgba(93,67,39,0.72)] px-4 py-2 text-sm font-bold text-[#f3dfb4] hover:border-[#e4bc6e] hover:bg-[rgba(124,91,51,0.85)] focus-visible:outline-3 focus-visible:outline-[#f8df9d] focus-visible:outline-offset-2" type="button" onClick={() => setCombatantToRemove(null)}>
                Cancelar
              </PixelCornerFrame>
              <PixelCornerFrame as="button" className="min-h-11 cursor-pointer border border-[#e39782] bg-[#8c362d] px-4 py-2 text-sm font-bold text-[#fff4ec] hover:border-[#ffc0ad] hover:bg-[#a9473b] focus-visible:outline-3 focus-visible:outline-[#f8df9d] focus-visible:outline-offset-2" type="button" onClick={removeCombatant}>
                Remover combatente
              </PixelCornerFrame>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}

export default QuickCombatScreen
