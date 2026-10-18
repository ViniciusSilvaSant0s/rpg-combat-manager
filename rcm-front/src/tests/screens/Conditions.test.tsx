import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { loadCombatants } from '../../combatantStorage'
import { beginCombat, enterQuickCombat } from './helpers'
import type { Combatant } from '../../types/combatant'
import { ConditionDialog } from '../../components/ConditionPickerDialog'
import { findCondition } from '../../conditions'
import { ConditionIcon } from '../../components/ConditionDisplay'

test('loads supplied spell and escape artwork in original colors and keeps missing icons', () => {
  for (const id of ['action-cast-spell', 'bonus-cast-spell', 'reaction-cast-spell', 'escape']) {
    const condition = findCondition(id)!
    expect(condition.originalColorIcon).toMatch(/\/(cast-spell|scape)\.png/)
    const view = render(<ConditionIcon condition={condition} />)
    const icon = view.container.querySelector('img')!
    expect(icon).toHaveAttribute('src', condition.originalColorIcon)
    expect(icon.style.backgroundColor).toBe('')
    expect(icon.style.maskImage).toBe('')
    view.unmount()
  }
  expect(findCondition('blinded')?.originalColorIcon).toBeUndefined()
})

const aria: Combatant = {
  id: 'aria', type: 'player', name: 'Aria', currentHitPoints: 18,
  maximumHitPoints: 24, additionalHitPoints: null, conditions: [], armorClass: 15, initiative: 18,
}
const witch: Combatant = { ...aria, id: 'witch', type: 'npc', name: 'Bruxa', initiative: 20 }

test('searches bilingual cards without accents and preserves hidden selections', () => {
  enterQuickCombat([aria])
  fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar Condição / Bônus' }))
  const picker = screen.getByRole('dialog', { name: 'Condição / Bônus' })
  expect(within(picker).getByText('Blinded / Cego')).toBeVisible()
  const search = within(picker).getByRole('searchbox', { name: 'Pesquisar condições' })
  fireEvent.change(search, { target: { value: 'BLIND' } })
  fireEvent.click(within(picker).getByRole('button', { name: 'Cego / Blinded' }))
  expect(within(picker).queryByRole('group', { name: 'Movimento' })).not.toBeInTheDocument()
  fireEvent.change(search, { target: { value: 'exaustao' } })
  expect(within(picker).getByRole('button', { name: 'Exaustão / Exhaustion' })).toBeVisible()
  fireEvent.change(search, { target: { value: 'zzzzzz' } })
  expect(within(picker).getByRole('status')).toHaveTextContent('Nenhuma condição encontrada')
  fireEvent.change(search, { target: { value: '' } })
  expect(within(picker).getByRole('button', { name: 'Cego / Blinded' })).toHaveAttribute('aria-pressed', 'true')
  const confirm = within(picker).getByRole('button', { name: 'Confirmar Condição / Bônus' })
  confirm.focus()
  expect(confirm).toHaveFocus()
  fireEvent.keyDown(confirm, { key: 'Tab' })
  expect(search).toHaveFocus()
})

test('offers every reference entry in its group with Portuguese descriptions', () => {
  enterQuickCombat([aria])
  fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar Condição / Bônus' }))
  const picker = screen.getByRole('dialog', { name: 'Condição / Bônus' })
  const referenceGroups = {
    Estados: ['Blinded', 'Charmed', 'Deafened', 'Exhaustion', 'Frightened', 'Grappled', 'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious'],
    Movimento: ['Move', 'Climb', 'Swim', 'Drop prone', 'Crawl', 'Stand up', 'High jump', 'Long jump', 'Improvise', 'Difficult terrain', 'Grapple move'],
    Ações: ['Attack', 'Grapple', 'Shove', 'Cast a spell', 'Dash', 'Disengage', 'Dodge', 'Escape', 'Help', 'Use Object', 'Use shield', 'Hide', 'Search', 'Ready', 'Use class feature', 'Improvise'],
    'Ações bônus': ['Offhand Attack', 'Cast a spell', 'Use class feature'],
    Reações: ['Opportunity attack', 'Readied action', 'Cast a spell'],
    Obscurecimento: ['Lightly obscured', 'Heavily obscured'],
    Iluminação: ['Bright light', 'Dim light', 'Darkness'],
    'Sentidos especiais': ['Blindsight', 'Darkvision', 'Truesight'],
    Cobertura: ['Half cover', 'Three-quarters cover', 'Full cover'],
  }
  for (const [group, expectedTitles] of Object.entries(referenceGroups)) {
    const buttons = within(within(picker).getByRole('group', { name: group })).getAllByRole('button')
    expect(buttons.map((button) => button.getAttribute('aria-label')?.split(' / ').at(-1))).toEqual(expectedTitles)
  }
  expect(within(picker).queryByRole('status')).not.toBeInTheDocument()
  expect(screen.getByRole('tooltip')).toHaveTextContent('Você não consegue enxergar')
  expect(screen.getByRole('tooltip').querySelector('p')).toHaveAttribute('lang', 'pt-BR')
})

test('persists new entries and distinguishes spell actions, bonus actions and reactions', () => {
  enterQuickCombat([{ ...aria, conditions: ['blinded'] }])
  fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar Condição / Bônus' }))
  const picker = screen.getByRole('dialog', { name: 'Condição / Bônus' })
  for (const group of ['Ações', 'Ações bônus', 'Reações']) {
    fireEvent.click(within(within(picker).getByRole('group', { name: group })).getByRole('button', { name: 'Conjurar magia / Cast a spell' }))
  }
  fireEvent.click(within(within(picker).getByRole('group', { name: 'Cobertura' })).getByRole('button', { name: 'Meia cobertura / Half cover' }))
  expect(screen.getByRole('tooltip')).toHaveTextContent('+2 na CA')
  fireEvent.click(within(picker).getByRole('button', { name: 'Confirmar Condição / Bônus' }))
  fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
  expect(loadCombatants()[0].conditions).toEqual(['blinded', 'action-cast-spell', 'bonus-cast-spell', 'reaction-cast-spell', 'half-cover'])
  const spells = within(screen.getByRole('article')).getAllByRole('button', { name: 'Conjurar magia / Cast a spell' })
  fireEvent.mouseEnter(spells[1])
  expect(screen.getByRole('tooltip')).toHaveTextContent('Ações bônus')
  expect(screen.getByRole('tooltip')).toHaveTextContent('Conjure uma magia cujo tempo de conjuração seja uma ação bônus')
  expect(screen.getByRole('tooltip').querySelector('p')).toHaveAttribute('lang', 'pt-BR')
  fireEvent.click(screen.getByRole('button', { name: 'Remover Conjurar magia / Cast a spell (Ações bônus)' }))
  expect(loadCombatants()[0].conditions).toEqual(['blinded', 'action-cast-spell', 'reaction-cast-spell', 'half-cover'])
})

test('restores the captured trigger after the browser blurs an inert background', () => {
  render(<button type="button">Abrir condições</button>)
  const trigger = screen.getByRole('button', { name: 'Abrir condições' })
  trigger.focus()
  trigger.blur()
  const dialog = render(<ConditionDialog title="Condições" returnFocusTo={trigger} onClose={() => {}}>
    <button type="button">Cancelar</button>
  </ConditionDialog>)
  expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus()
  dialog.unmount()
  expect(trigger).toHaveFocus()
})

test('loads legacy combatants and normalizes condition data without losing combatants', () => {
  localStorage.setItem('rpg-combat-manager.combatants', JSON.stringify([
    { ...aria, conditions: undefined },
    { ...witch, conditions: ['blinded', 'unknown', 'blinded', 'poisoned', 123] },
    { ...aria, id: 'malformed', conditions: 'blinded' },
  ]))
  expect(loadCombatants().map((combatant) => combatant.conditions)).toEqual([
    [], ['blinded', 'poisoned'], [],
  ])
})

test('selects several conditions in the form, persists and edits them', () => {
  enterQuickCombat([aria])
  fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar Condição / Bônus' }))
  const picker = screen.getByRole('dialog', { name: 'Condição / Bônus' })
  expect(within(picker).getByRole('button', { name: 'Confirmar Condição / Bônus' })).toBeDisabled()
  fireEvent.click(within(picker).getByRole('button', { name: 'Cego / Blinded' }))
  fireEvent.click(within(picker).getByRole('button', { name: 'Envenenado / Poisoned' }))
  expect(within(picker).getByRole('button', { name: 'Cego / Blinded' })).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(within(picker).getByRole('button', { name: 'Confirmar Condição / Bônus' }))
  expect(screen.getByRole('button', { name: 'Adicionar Condição / Bônus' })).toHaveFocus()
  expect(loadCombatants()[0].conditions).toEqual([])
  fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
  expect(loadCombatants()[0].conditions).toEqual(['blinded', 'poisoned'])
  expect(within(screen.getByRole('article')).getByRole('button', { name: 'Cego / Blinded' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
  fireEvent.click(screen.getByRole('button', { name: 'Remover Cego / Blinded' }))
  fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
  expect(loadCombatants()[0].conditions).toEqual(['poisoned'])
})

test('canceling nested condition selection preserves form data and confines keyboard focus', () => {
  enterQuickCombat([aria])
  fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Aria nova' } })
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar Condição / Bônus' }))
  const picker = screen.getByRole('dialog', { name: 'Condição / Bônus' })
  const first = within(picker).getByRole('button', { name: 'Cego / Blinded' })
  expect(first).toHaveFocus()
  const search = within(picker).getByRole('searchbox')
  search.focus()
  fireEvent.keyDown(search, { key: 'Tab', shiftKey: true })
  expect(within(picker).getByRole('button', { name: 'Cancelar' })).toHaveFocus()
  fireEvent.keyDown(picker, { key: 'Tab' })
  expect(search).toHaveFocus()
  fireEvent.click(first)
  expect(screen.getByRole('tooltip')).toHaveTextContent('Cego / Blinded')
  fireEvent.keyDown(picker, { key: 'Escape' })
  expect(screen.getByRole('dialog', { name: 'Editar Combatente' })).toBeInTheDocument()
  expect(screen.getByLabelText('Nome')).toHaveValue('Aria nova')
  expect(screen.queryByRole('button', { name: 'Remover Cego / Blinded' })).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Adicionar Condição / Bônus' })).toHaveFocus()
})

test('applies conditions to multiple targets, preserves existing ones and supports removal and undo', () => {
  beginCombat([{ ...witch, conditions: ['blinded'] }, aria])
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar Condição / Bônus' }))
  let targets = screen.getByRole('dialog', { name: 'Selecionar combatentes' })
  expect(within(targets).getByRole('button', { name: 'Continuar' })).toBeDisabled()
  fireEvent.click(within(targets).getByRole('button', { name: 'Bruxa' }))
  fireEvent.click(within(targets).getByRole('button', { name: 'Aria' }))
  fireEvent.click(within(targets).getByRole('button', { name: 'Continuar' }))
  fireEvent.click(screen.getByRole('button', { name: 'Cego / Blinded' }))
  fireEvent.click(screen.getByRole('button', { name: 'Envenenado / Poisoned' }))
  fireEvent.click(screen.getByRole('button', { name: 'Voltar' }))
  targets = screen.getByRole('dialog', { name: 'Selecionar combatentes' })
  expect(within(targets).getByRole('button', { name: 'Aria' })).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(within(targets).getByRole('button', { name: 'Continuar' }))
  expect(screen.getByRole('button', { name: 'Envenenado / Poisoned' })).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar Condição / Bônus' }))
  expect(loadCombatants().map((combatant) => combatant.conditions)).toEqual([
    ['blinded', 'poisoned'], ['blinded', 'poisoned'],
  ])
  const current = screen.getByRole('article', { name: 'Combatente atual: Bruxa' })
  fireEvent.click(within(current).getByRole('button', { name: 'Remover Cego / Blinded' }))
  expect(loadCombatants()[0].conditions).toEqual(['poisoned'])
  fireEvent.click(screen.getByRole('button', { name: 'Desfazer última ação' }))
  expect(loadCombatants()[0].conditions).toEqual(['blinded', 'poisoned'])
  fireEvent.click(screen.getByRole('button', { name: 'Desfazer última ação' }))
  expect(loadCombatants().map((combatant) => combatant.conditions)).toEqual([['blinded'], []])
})

test('canceling the combat picker does not modify conditions or the undo history', () => {
  beginCombat([aria])
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar Condição / Bônus' }))
  fireEvent.click(screen.getByRole('button', { name: 'Aria' }))
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
  fireEvent.click(screen.getByRole('button', { name: 'Cego / Blinded' }))
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
  expect(loadCombatants()[0].conditions).toEqual([])
  expect(screen.getByRole('button', { name: 'Desfazer última ação' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Adicionar Condição / Bônus' })).toHaveFocus()
})
