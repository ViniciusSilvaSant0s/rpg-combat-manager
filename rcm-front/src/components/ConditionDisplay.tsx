import { useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { conditions, conditionCategories, conditionGroups, findCondition, type ConditionDefinition, type ConditionId } from '../conditions'

const repeatedNames = new Set(conditions.map((condition) => condition.name)
  .filter((name, index, names) => names.indexOf(name) !== index))

export function ConditionIcon({ condition }: { condition: ConditionDefinition }) {
  const source = `url("${condition.icon}")`
  return <span aria-hidden="true" className="condition-icon" style={{
    backgroundColor: conditionCategories[condition.category].color,
    maskImage: source, WebkitMaskImage: source,
  }} />
}

export function ConditionButton({ condition, selected, onClick, tooltipOpen, onTooltipChange }: {
  condition: ConditionDefinition
  selected?: boolean
  onClick?: () => void
  tooltipOpen?: boolean
  onTooltipChange?: (open: boolean) => void
}) {
  const [localTooltipOpen, setLocalTooltipOpen] = useState(false)
  const isTooltipOpen = tooltipOpen ?? localTooltipOpen
  const setIsTooltipOpen = onTooltipChange ?? setLocalTooltipOpen
  const reference = useRef<HTMLButtonElement>(null)
  const tooltipId = useId()
  const rectangle = isTooltipOpen ? reference.current?.getBoundingClientRect() : undefined
  const tooltipWidth = Math.min(280, window.innerWidth - 24)

  return <>
    <button
      aria-label={condition.name}
      aria-description={conditionGroups[condition.group]}
      aria-pressed={selected}
      aria-describedby={isTooltipOpen ? tooltipId : undefined}
      className="condition-choice"
      type="button"
      ref={reference}
      onMouseEnter={() => setIsTooltipOpen(true)}
      onMouseLeave={() => setIsTooltipOpen(false)}
      onFocus={() => setIsTooltipOpen(true)}
      onBlur={() => setIsTooltipOpen(false)}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && isTooltipOpen && selected === undefined) {
          event.stopPropagation()
          setIsTooltipOpen(false)
        }
      }}
      onClick={() => {
        setIsTooltipOpen(true)
        onClick?.()
      }}
    >
      <ConditionIcon condition={condition} />
      {selected ? <span aria-hidden="true" className="condition-selected">✓</span> : null}
    </button>
    {isTooltipOpen && rectangle ? createPortal(
      <div role="tooltip" id={tooltipId} className="condition-tooltip" style={{
        width: tooltipWidth,
        left: Math.max(12, Math.min(rectangle.left, window.innerWidth - tooltipWidth - 12)),
        ...(rectangle.bottom + 160 < window.innerHeight
          ? { top: rectangle.bottom + 4 }
          : { bottom: window.innerHeight - rectangle.top + 4 }),
      }}>
        <strong>{condition.name}</strong>
        <span className="condition-group-label">{conditionGroups[condition.group]}</span>
        <p lang="pt-BR">{condition.description}</p>
      </div>, document.body,
    ) : null}
  </>
}

export default function ConditionList({ conditionIds, onRemove, compact = false }: {
  conditionIds: readonly ConditionId[]
  onRemove?: (conditionId: ConditionId) => void
  compact?: boolean
}) {
  if (conditionIds.length === 0) return null
  return <div aria-label="Condição / Bonûs" className={`condition-list${compact ? ' condition-list--compact' : ''}`}>
    {conditionIds.map((id) => {
      const condition = findCondition(id)
      if (!condition) return null
      return <div className="condition-badge" key={id}>
        <ConditionButton condition={condition} />
        {onRemove ? <button
          aria-label={`Remover ${condition.name}${repeatedNames.has(condition.name) ? ` (${conditionGroups[condition.group]})` : ''}`}
          className="condition-remove"
          type="button"
          onClick={() => onRemove(id)}
        >×</button> : null}
      </div>
    })}
  </div>
}
