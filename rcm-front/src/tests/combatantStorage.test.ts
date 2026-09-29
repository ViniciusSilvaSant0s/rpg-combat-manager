import { beforeEach, describe, expect, test } from 'vitest'
import { loadCombatants, saveCombatants } from '../combatantStorage'
import type { Combatant } from '../types/combatant'

const storageKey = 'rpg-combat-manager.combatants'

const combatant: Combatant = {
  id: 'aria',
  type: 'player',
  name: 'Aria',
  currentHitPoints: 18,
  maximumHitPoints: 24,
  armorClass: 15,
  initiative: 14,
}

describe('combatant storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('returns an empty list when no combatants have been saved', () => {
    expect(loadCombatants()).toEqual([])
  })

  test('loads saved combatants', () => {
    localStorage.setItem(storageKey, JSON.stringify([combatant]))

    expect(loadCombatants()).toEqual([combatant])
  })

  test('returns an empty list when saved JSON is malformed', () => {
    localStorage.setItem(storageKey, '{invalid json')

    expect(loadCombatants()).toEqual([])
  })

  test.each([
    ['a non-array value', JSON.stringify({ combatant })],
    ['a combatant with an invalid type', JSON.stringify([{ ...combatant, type: 'monster' }])],
    ['a combatant with a negative armor class', JSON.stringify([{ ...combatant, armorClass: -1 }])],
    ['a combatant with a fractional hit point value', JSON.stringify([{ ...combatant, currentHitPoints: 1.5 }])],
    ['a list containing an invalid combatant', JSON.stringify([combatant, { id: 'missing-fields' }])],
  ])('returns an empty list for %s', (_description, storedValue) => {
    localStorage.setItem(storageKey, storedValue)

    expect(loadCombatants()).toEqual([])
  })

  test('saves combatants as JSON under the application storage key', () => {
    saveCombatants([combatant])

    expect(localStorage.getItem(storageKey)).toBe(JSON.stringify([combatant]))
    expect(loadCombatants()).toEqual([combatant])
  })
})
