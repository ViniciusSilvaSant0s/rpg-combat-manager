import type { Identity } from './profile.js';

export interface PublicUser { id: number; nickname: string }
export interface FriendshipList { friends: PublicUser[]; received: PublicUser[]; sent: PublicUser[] }
export type FriendshipAction = 'request' | 'accept' | 'decline' | 'cancel' | 'remove';
export type ActionResult = 'ok' | 'self' | 'missing' | 'conflict' | 'forbidden';
export interface Pair { status: 'pending' | 'accepted'; senderId: number }
export type Decision = 'insert' | 'accept' | 'delete' | 'unfriend' | Exclude<ActionResult, 'ok'>;
export interface Friendships {
  search(identity: Identity, nickname: string): Promise<PublicUser | null>;
  list(identity: Identity): Promise<FriendshipList | null>;
  change(identity: Identity, targetId: number, decide: (actorId: number, pair: Pair | null) => Decision): Promise<ActionResult>;
}
