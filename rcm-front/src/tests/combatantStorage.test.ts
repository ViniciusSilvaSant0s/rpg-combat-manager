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
  additionalHitPoints: null,
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

  test('migrates legacy combatants and caps current hit points at the maximum', () => {
    const legacyCombatant = {
      ...combatant,
      currentHitPoints: 30,
      additionalHitPoints: undefined,
      name: 'Aria',
    }
    delete (legacyCombatant as Partial<typeof combatant>).additionalHitPoints
    localStorage.setItem(storageKey, JSON.stringify([legacyCombatant]))

    expect(loadCombatants()).toEqual([{
      ...combatant,
      currentHitPoints: 24,
      name: 'Aria',
      additionalHitPoints: null,
    }])
  })

  test.each([null, 5])('preserves valid additional hit points: %s', (additionalHitPoints) => {
    localStorage.setItem(storageKey, JSON.stringify([{ ...combatant, additionalHitPoints }]))

    expect(loadCombatants()[0].additionalHitPoints).toBe(additionalHitPoints)
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
    ['a combatant with negative additional hit points', JSON.stringify([{ ...combatant, additionalHitPoints: -1 }])],
    ['a combatant with fractional additional hit points', JSON.stringify([{ ...combatant, additionalHitPoints: 1.5 }])],
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
