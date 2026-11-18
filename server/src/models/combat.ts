import type { Identity } from './profile.js';

export interface ParticipantInput {
  id: number;
  combatantId: number;
  currentHitPoints: number;
  additionalHitPoints: number | null;
  initiative: number | null;
  naturalInitiative: 1 | 20 | null;
  conditions: string[];
}
export interface CombatState {
  title: string;
  description: string | null;
  started: boolean;
  currentParticipantId: number | null;
  version: number;
  participants: ParticipantInput[];
}
export interface Combat extends CombatState { id: number }
export type CombatWriteResult = Combat | 'not-found' | 'conflict' | 'invalid-participant';
export interface Combats {
  list(identity: Identity): Promise<Combat[]>;
  get(identity: Identity, id: number): Promise<Combat | null>;
  create(identity: Identity, title: string, description: string | null): Promise<Combat>;
  update(identity: Identity, id: number, state: CombatState): Promise<CombatWriteResult>;
  delete(identity: Identity, id: number): Promise<boolean>;
}
