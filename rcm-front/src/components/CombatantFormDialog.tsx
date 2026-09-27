import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import type { Combatant, CombatantInput, CombatantType } from '../types/combatant'
import CombatIcon from './CombatIcon'
import PixelCornerFrame from './PixelCornerFrame'

type CombatantFormDialogProps = {
  combatant?: Combatant
  onClose: () => void
  onSave: (combatant: CombatantInput) => void
}

function CombatantFormDialog({ combatant, onClose, onSave }: CombatantFormDialogProps) {
  const [type, setType] = useState<CombatantType>(combatant?.type ?? 'player')
  const [error, setError] = useState<string | null>(null)
  const dialogReference = useRef<HTMLElement>(null)
  const triggerReference = useRef<HTMLElement | null>(null)
  const isEditing = combatant !== undefined

  useEffect(() => {
    triggerReference.current = document.activeElement as HTMLElement
    dialogReference.current?.querySelector<HTMLElement>('[role="radio"], input, button')?.focus()

    return () => {
      triggerReference.current?.focus()
    }
  }, [])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') ?? '').trim()
    const initiativeValue = String(formData.get('initiative') ?? '').trim()

    if (!name) {
      setError('Informe um nome.')
      return
    }

    onSave({
      type,
      name,
      currentHitPoints: Number(formData.get('currentHitPoints')),
      maximumHitPoints: Number(formData.get('maximumHitPoints')),
      armorClass: Number(formData.get('armorClass')),
      initiative: initiativeValue === '' ? null : Number(initiativeValue),
    })
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      onClose()
      return
    }

    if (event.key !== 'Tab') {
      return
    }

    const focusableElements = Array.from(
      dialogReference.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled)',
      ) ?? [],
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-6">
      <section
        aria-labelledby="combatant-form-title"
        aria-modal="true"
        className="max-h-[calc(100svh-48px)] w-full max-w-[520px] overflow-y-auto border border-[#c79a4e] bg-[#21170f] p-7 text-[#f5e4ba] shadow-2xl"
        onKeyDown={handleKeyDown}
        ref={dialogReference}
        role="dialog"
      >
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <h2 id="combatant-form-title" className="mt-0 mb-1 font-[family-name:var(--font-display)] text-2xl">
            {isEditing ? 'Editar Combatente' : 'Criar Combatente'}
          </h2>
          {error ? <p className="m-0 text-[#f08a8a]" role="alert">{error}</p> : null}

          <div aria-label="Tipo" className="grid grid-cols-2" role="radiogroup">
            <button
              aria-checked={type === 'player'}
              className={`min-h-11 border border-[rgba(211,173,103,0.55)] bg-[rgba(58,42,27,0.8)] px-3 py-2 font-bold text-[#d6c4a2] transition focus-visible:z-10 focus-visible:outline-3 focus-visible:outline-[#f8df9d] ${type === 'player' ? 'rounded-l-sm border-[#f3d38a] bg-linear-to-br from-[#d5a951] to-[#a8742c] text-[#26180b]' : 'rounded-l-sm'}`}
              onClick={() => setType('player')}
              role="radio"
              tabIndex={type === 'player' ? 0 : -1}
              type="button"
            >
              Jogador
            </button>
            <button
              aria-checked={type === 'npc'}
              className={`-ml-px min-h-11 border border-[rgba(211,173,103,0.55)] bg-[rgba(58,42,27,0.8)] px-3 py-2 font-bold text-[#d6c4a2] transition focus-visible:z-10 focus-visible:outline-3 focus-visible:outline-[#f8df9d] ${type === 'npc' ? 'rounded-r-sm border-[#f3d38a] bg-linear-to-br from-[#d5a951] to-[#a8742c] text-[#26180b]' : 'rounded-r-sm'}`}
              onClick={() => setType('npc')}
              role="radio"
              tabIndex={type === 'npc' ? 0 : -1}
              type="button"
            >
              NPC
            </button>
          </div>
          <label className="grid gap-1.5 text-sm font-semibold">
            Nome
            <input className="min-h-10 border border-[#8a6a38] bg-[#100c09] px-2 font-normal text-inherit focus-visible:outline-3 focus-visible:outline-[#f8df9d]" defaultValue={combatant?.name} name="name" required type="text" />
          </label>
          <fieldset className="m-0 min-w-0 border-0 p-0">
            <legend className="mb-1.5 p-0 font-semibold"><CombatIcon name="heart" />PV (Pontos de Vida)</legend>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <label className="sr-only" htmlFor="current-hit-points">
                Vida atual
              </label>
              <input
                className="min-h-10 w-full border border-[#8a6a38] bg-[#100c09] px-2 text-inherit focus-visible:outline-3 focus-visible:outline-[#f8df9d]"
                defaultValue={combatant?.currentHitPoints}
                id="current-hit-points"
                name="currentHitPoints"
                placeholder="vida atual"
                required
                step="1"
                type="number"
              />
              <span className="text-xl font-bold text-[#d7af66]" aria-hidden="true">/</span>
              <label className="sr-only" htmlFor="maximum-hit-points">
                Vida máxima
              </label>
              <input
                className="min-h-10 w-full border border-[#8a6a38] bg-[#100c09] px-2 text-inherit focus-visible:outline-3 focus-visible:outline-[#f8df9d]"
                defaultValue={combatant?.maximumHitPoints}
                id="maximum-hit-points"
                name="maximumHitPoints"
                placeholder="vida máxima"
                required
                step="1"
                type="number"
              />
            </div>
          </fieldset>
          <label className="grid gap-1.5 text-sm font-semibold">
            <><CombatIcon name="shield" />CA (Classe de Armadura)</>
            <input
              className="min-h-10 border border-[#8a6a38] bg-[#100c09] px-2 font-normal text-inherit focus-visible:outline-3 focus-visible:outline-[#f8df9d]"
              defaultValue={combatant?.armorClass}
              min="0"
              name="armorClass"
              required
              step="1"
              type="number"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">
            <><CombatIcon name="thunder" />Iniciativa</>
            <input
              className="min-h-10 border border-[#8a6a38] bg-[#100c09] px-2 font-normal text-inherit focus-visible:outline-3 focus-visible:outline-[#f8df9d]"
              defaultValue={combatant?.initiative ?? ''}
              name="initiative"
              step="1"
              type="number"
            />
          </label>
          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <PixelCornerFrame as="button" className="min-h-11 cursor-pointer border border-[rgba(211,173,103,0.62)] bg-[rgba(93,67,39,0.72)] px-4 py-2 font-bold text-[#f3dfb4] hover:border-[#e4bc6e] hover:bg-[rgba(124,91,51,0.85)] focus-visible:outline-3 focus-visible:outline-[#f8df9d] focus-visible:outline-offset-2" type="button" onClick={onClose}>
              Cancelar
            </PixelCornerFrame>
            <PixelCornerFrame as="button" className="min-h-11 cursor-pointer border border-[#f3d38a] bg-linear-to-br from-[#d5a951] to-[#a8742c] px-4 py-2 font-bold text-[#26180b] hover:from-[#e6bb61] hover:to-[#bd8637] focus-visible:outline-3 focus-visible:outline-[#f8df9d] focus-visible:outline-offset-2" type="submit">
              {isEditing ? 'Salvar alterações' : 'Salvar combatente'}
            </PixelCornerFrame>
          </div>
        </form>
      </section>
    </div>
  )
}

export default CombatantFormDialog
