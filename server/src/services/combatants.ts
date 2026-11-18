import type { Identity } from '../models/profile.js';
import type { CombatantInput, Combatants } from '../models/combatant.js';

export function createCombatantsService(combatants: Combatants) {
  return {
    list: (identity: Identity) => combatants.list(identity),
    hasProfile: (identity: Identity) => combatants.hasProfile(identity),
    countCombats: (identity: Identity, id: number) => combatants.countCombats(identity, id),
    create: (identity: Identity, input: CombatantInput) => combatants.create(identity, input),
    update: (identity: Identity, id: number, input: CombatantInput) => combatants.update(identity, id, input),
    delete: (identity: Identity, id: number) => combatants.delete(identity, id),
  };
}

export type CombatantsService = ReturnType<typeof createCombatantsService>;
