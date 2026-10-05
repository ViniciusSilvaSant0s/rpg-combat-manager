import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { conditions, conditionCategories, conditionGroups, type ConditionId } from '../conditions'
import { ConditionButton } from './ConditionDisplay'
import PixelCornerFrame from './PixelCornerFrame'

export function ConditionDialog({ title, onClose, children, returnFocusTo }: {
  title: string
  onClose: () => void
  children: ReactNode
  returnFocusTo: HTMLElement | null
}) {
  const reference = useRef<HTMLElement>(null)
  const titleId = useId()

  useEffect(() => {
    const trigger = returnFocusTo
    return () => { if (trigger?.isConnected) trigger.focus() }
  }, [returnFocusTo])

  useEffect(() => {
    reference.current?.querySelector<HTMLElement>('button:not(:disabled)')?.focus()
  }, [title])

  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 p-4">
    <section aria-labelledby={titleId} aria-modal="true" className="condition-dialog"
      ref={reference} role="dialog" onKeyDown={(event) => {
        event.stopPropagation()
        if (event.key === 'Escape') {
          event.preventDefault()
          onClose()
        }
        if (event.key !== 'Tab') return
        const buttons = Array.from(reference.current?.querySelectorAll<HTMLElement>('button:not(:disabled)') ?? [])
        const first = buttons[0]
        const last = buttons.at(-1)
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }}>
      <h2 id={titleId} className="mt-0 mb-4 font-[family-name:var(--font-display)] text-2xl">{title}</h2>
      {children}
    </section>
  </div>
}

export function ConditionPickerContent({ selectedIds, onChange, onConfirm, onClose, onBack }: {
  selectedIds: readonly ConditionId[]
  onChange: (ids: ConditionId[]) => void
  onConfirm: () => void
  onClose: () => void
  onBack?: () => void
}) {
  const [tooltipConditionId, setTooltipConditionId] = useState<ConditionId | null>(null)

  return <>
    <p className="mt-0 text-sm text-[#d6c4a2]">Selecione uma ou mais opções. Passe o mouse ou selecione um ícone para consultar sua descrição.</p>
    <div className="condition-catalogue">
      {Object.entries(conditionGroups).map(([group, label]) => <fieldset key={group} className="condition-picker-group">
        <legend>{label}</legend>
        <div className="condition-picker-grid">
          {conditions.filter((condition) => condition.group === group).map((condition) => <div key={condition.id} className="condition-picker-item">
            <ConditionButton condition={condition} selected={selectedIds.includes(condition.id)}
              tooltipOpen={tooltipConditionId === condition.id}
              onTooltipChange={(open) => setTooltipConditionId((current) => open
                ? condition.id : current === condition.id ? null : current)}
              onClick={() => {
              onChange(selectedIds.includes(condition.id)
                ? selectedIds.filter((id) => id !== condition.id)
                : [...selectedIds, condition.id])
            }} />
          </div>)}
        </div>
      </fieldset>)}
      <div className="condition-legend" aria-label="Categorias de Condição / Bonûs">
        {Object.values(conditionCategories).map((category) => <span key={category.name}>
          <span aria-hidden="true" style={{ backgroundColor: category.color }} />{category.name}
        </span>)}
      </div>
    </div>
    <p className="text-sm">{selectedIds.length} {selectedIds.length === 1 ? 'opção selecionada' : 'opções selecionadas'}</p>
    <div className="condition-dialog-actions">
      {onBack ? <PixelCornerFrame as="button" className="condition-action" type="button" onClick={onBack}>Voltar</PixelCornerFrame> : null}
      <PixelCornerFrame as="button" className="condition-action" type="button" onClick={onClose}>Cancelar</PixelCornerFrame>
      <PixelCornerFrame as="button" className="condition-action condition-action--primary" type="button" disabled={selectedIds.length === 0} onClick={onConfirm}>Confirmar Condição / Bonûs</PixelCornerFrame>
    </div>
  </>
}

export default function ConditionPickerDialog({ selectedIds, onConfirm, onClose, returnFocusTo }: {
  selectedIds: readonly ConditionId[]
  onConfirm: (ids: ConditionId[]) => void
  onClose: () => void
  returnFocusTo: HTMLElement | null
}) {
  const [draft, setDraft] = useState<ConditionId[]>(() => [...selectedIds])
  return <ConditionDialog title="Condição / Bonûs" onClose={onClose} returnFocusTo={returnFocusTo}>
    <ConditionPickerContent selectedIds={draft} onChange={setDraft}
      onConfirm={() => onConfirm(draft)} onClose={onClose} />
  </ConditionDialog>
}
