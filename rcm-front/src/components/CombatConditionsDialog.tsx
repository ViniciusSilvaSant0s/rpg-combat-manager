import { useState } from 'react'
import type { ConditionId } from '../conditions'
import type { Combatant } from '../types/combatant'
import { ConditionDialog, ConditionPickerContent } from './ConditionPickerDialog'
import CharacterSprite from './CharacterSprite'
import PixelCornerFrame from './PixelCornerFrame'

export default function CombatConditionsDialog({ combatants, onConfirm, onClose, returnFocusTo }: {
  combatants: readonly Combatant[]
  onConfirm: (targetIds: string[], conditions: ConditionId[]) => void
  onClose: () => void
  returnFocusTo: HTMLElement | null
}) {
  const [step, setStep] = useState<'targets' | 'conditions'>('targets')
  const [targetIds, setTargetIds] = useState<string[]>([])
  const [conditionIds, setConditionIds] = useState<ConditionId[]>([])

  return <ConditionDialog title={step === 'targets' ? 'Selecionar combatentes' : 'Condição / Bonûs'} onClose={onClose} returnFocusTo={returnFocusTo}>
    {step === 'targets' ? <>
      <p className="mt-0 text-sm text-[#d6c4a2]">Selecione os combatentes que receberão as opções de Condição / Bonûs.</p>
      <div className="condition-target-grid">
        {combatants.map((combatant) => <PixelCornerFrame as="button" className="condition-target"
          type="button" key={combatant.id} aria-label={combatant.name}
          aria-pressed={targetIds.includes(combatant.id)}
          onClick={() => setTargetIds((ids) => ids.includes(combatant.id)
            ? ids.filter((id) => id !== combatant.id) : [...ids, combatant.id])}>
          <CharacterSprite characterId={combatant.characterId} label={`Personagem de ${combatant.name}`} />
          <strong>{combatant.name}</strong>
          <span>{combatant.type === 'player' ? 'Jogador' : 'NPC'}</span>
          <span aria-hidden="true">{targetIds.includes(combatant.id) ? '✓ Selecionado' : 'Selecionar'}</span>
        </PixelCornerFrame>)}
      </div>
      <p className="text-sm" role="status">{targetIds.length} {targetIds.length === 1 ? 'combatente selecionado' : 'combatentes selecionados'}</p>
      <div className="condition-dialog-actions">
        <PixelCornerFrame as="button" className="condition-action" type="button" onClick={onClose}>Cancelar</PixelCornerFrame>
        <PixelCornerFrame as="button" className="condition-action condition-action--primary" type="button" disabled={targetIds.length === 0} onClick={() => setStep('conditions')}>Continuar</PixelCornerFrame>
      </div>
    </> : <ConditionPickerContent selectedIds={conditionIds} onChange={setConditionIds}
      onConfirm={() => onConfirm(targetIds, conditionIds)} onClose={onClose}
      onBack={() => setStep('targets')} />}
  </ConditionDialog>
}
