import type { Identity } from './profile.js';

export interface CombatantInput { name: string; type: 'player' | 'npc'; characterId: string | null; maximumHitPoints: number; armorClass: number }
export interface Combatant extends CombatantInput { id: number }
export interface Combatants {
  list(identity: Identity): Promise<Combatant[] | null>;
  hasProfile(identity: Identity): Promise<boolean>;
  countCombats(identity: Identity, id: number): Promise<number | null>;
  create(identity: Identity, input: CombatantInput): Promise<Combatant>;
  update(identity: Identity, id: number, input: CombatantInput): Promise<Combatant | null>;
  delete(identity: Identity, id: number): Promise<boolean>;
}
