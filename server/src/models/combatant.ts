import type { PublicUser } from './friendship.js';
import type { Identity } from './profile.js';

export interface CombatantInput { name: string; type: 'player' | 'npc'; characterId: string | null; maximumHitPoints: number; armorClass: number }
export interface Combatant extends CombatantInput { id: number }
export interface AccessibleCombatant extends Combatant { owner: PublicUser; isOwner: boolean }
export interface Combatants {
  list(identity: Identity): Promise<AccessibleCombatant[] | null>;
  hasProfile(identity: Identity): Promise<boolean>;
  countCombats(identity: Identity, id: number): Promise<number | null>;
  create(identity: Identity, input: CombatantInput): Promise<Combatant>;
  update(identity: Identity, id: number, input: CombatantInput): Promise<Combatant | 'health-overflow' | null>;
  delete(identity: Identity, id: number): Promise<boolean>;
}
