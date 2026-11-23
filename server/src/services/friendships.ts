import type { Identity } from '../models/profile.js';
import type { Decision, Friendships, FriendshipAction, Pair } from '../models/friendship.js';

function decide(action: FriendshipAction, actor: number, target: number, pair: Pair | null): Decision {
  if (actor === target) return 'self';
  if (!pair) return action === 'request' ? 'insert' : 'missing';
  if (pair.status === 'accepted') return action === 'remove' ? 'unfriend' : 'conflict';
  const sender = pair.senderId === actor;
  switch (action) {
    case 'request': return sender ? 'conflict' : 'accept';
    case 'accept': return sender ? 'forbidden' : 'accept';
    case 'decline': return sender ? 'forbidden' : 'delete';
    case 'cancel': return sender ? 'delete' : 'forbidden';
    case 'remove': return 'conflict';
  }
}
export function createFriendshipsService(repository: Friendships) {
  return {
    list: repository.list,
    search: repository.search,
    act(identity: Identity, target: number, action: FriendshipAction) {
      return repository.change(identity, target, (actor, pair) => decide(action, actor, target, pair));
    },
  };
}
