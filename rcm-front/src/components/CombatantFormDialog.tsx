import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import type { Combatant, CombatantInput, CombatantType } from '../types/combatant'

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
    <div className="dialog-backdrop">
      <section
        aria-labelledby="combatant-form-title"
        aria-modal="true"
        className="combatant-dialog"
        onKeyDown={handleKeyDown}
        ref={dialogReference}
        role="dialog"
      >
        <form onSubmit={handleSubmit}>
          <h2 id="combatant-form-title">
            {isEditing ? 'Editar Combatente' : 'Criar Combatente'}
          </h2>
          {error ? <p role="alert">{error}</p> : null}

          <div aria-label="Tipo" className="combatant-type-toggle" role="radiogroup">
            <button
              aria-checked={type === 'player'}
              className={type === 'player' ? 'is-selected' : undefined}
              onClick={() => setType('player')}
              role="radio"
              tabIndex={type === 'player' ? 0 : -1}
              type="button"
            >
              Jogador
            </button>
            <button
              aria-checked={type === 'npc'}
              className={type === 'npc' ? 'is-selected' : undefined}
              onClick={() => setType('npc')}
              role="radio"
              tabIndex={type === 'npc' ? 0 : -1}
              type="button"
            >
              NPC
            </button>
          </div>
          <label>
            Nome
            <input defaultValue={combatant?.name} name="name" required type="text" />
          </label>
          <fieldset className="hit-points-fields">
            <legend>♥ PV (Pontos de Vida)</legend>
            <div className="hit-points-inputs">
              <label className="visually-hidden" htmlFor="current-hit-points">
                Vida atual
              </label>
              <input
                defaultValue={combatant?.currentHitPoints}
                id="current-hit-points"
                name="currentHitPoints"
                placeholder="vida atual"
                required
                step="1"
                type="number"
              />
              <span aria-hidden="true">/</span>
              <label className="visually-hidden" htmlFor="maximum-hit-points">
                Vida máxima
              </label>
              <input
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
          <label>
            🛡 CA (Classe de Armadura)
            <input
              defaultValue={combatant?.armorClass}
              min="0"
              name="armorClass"
              required
              step="1"
              type="number"
            />
          </label>
          <label>
            ⚔ Iniciativa
            <input
              defaultValue={combatant?.initiative ?? ''}
              name="initiative"
              step="1"
              type="number"
            />
          </label>
          <div className="dialog-actions">
            <button type="button" onClick={onClose}>
              Cancelar
            </button>
            <button className="primary-action" type="submit">
              {isEditing ? 'Salvar alterações' : 'Salvar combatente'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default CombatantFormDialog
