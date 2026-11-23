import request from 'supertest';
import { expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import type { Friendships, Pair } from '../src/models/friendship.js';

function setup() {
  const people = [{ id: 1, nickname: 'Alice' }, { id: 2, nickname: 'Bobby' }, { id: 3, nickname: 'Carol' }];
  const pairs = new Map<string, Pair>();
  const repository: Friendships = {
    list: vi.fn(async () => ({ friends: [], received: [], sent: [] })),
    search: vi.fn(async (_identity, name) => people.find(p => p.nickname.toLowerCase() === name.toLowerCase()) ?? null),
    async change(identity, id, decide) {
      const actor = Number(identity.uid);
      if (!people.some(p => p.id === id)) return 'missing';
      const key = [actor, id].sort().join(',');
      const previous = pairs.get(key);
      const decision = decide(actor, previous ?? null);
      switch (decision) {
        case 'insert': pairs.set(key, { status: 'pending', senderId: actor }); break;
        case 'accept': pairs.set(key, { ...previous!, status: 'accepted' }); break;
        case 'delete':
        case 'unfriend': pairs.delete(key); break;
        default: return decision;
      }
      return 'ok';
    },
  };
  const app = createApp({ verify: async uid => ({ uid }), profiles: { find: vi.fn(), create: vi.fn(), update: vi.fn() }, friendships: repository });
  function act(actor: number, target: number, action: string) {
    const path = '/friendships/' + target;
    const req = action === 'remove' ? request(app).delete(path) : request(app).post(path + '/' + action);
    return req.set('Authorization', 'Bearer ' + actor);
  }
  return { app, act, pairs };
}
it('authenticates endpoints and searches only complete nicknames', async () => {
  const { app } = setup();
  await request(app).get('/friendships').expect(401);
  await request(app).get('/friendships').set('Authorization', 'Bearer 1').expect(200, { friends: [], received: [], sent: [] });
  const find = (nickname: string) => request(app).get('/friendships/search').query({ nickname }).set('Authorization', 'Bearer 1');
  await find('bOBBy').expect(200, { id: 2, nickname: 'Bobby' });
  await find('Bob').expect(404);
  await find('Bo%').expect(400);
});
it('enforces sender and recipient roles and only changes the authenticated pair', async () => {
  const { act } = setup();
  await act(1, 1, 'request').expect(400);
  await act(1, 4, 'request').expect(404);
  await act(1, 2, 'request').expect(204);
  await act(1, 2, 'request').expect(409);
  await act(1, 2, 'accept').expect(403);
  await act(1, 2, 'decline').expect(403);
  await act(2, 1, 'cancel').expect(403);
  await act(3, 1, 'accept').expect(404);
  await act(2, 1, 'decline').expect(204);
  await act(1, 2, 'request').expect(204);
  await act(1, 2, 'cancel').expect(204);
  await act(1, 2, 'request').expect(204);
  await act(2, 1, 'accept').expect(204);
  await act(1, 2, 'request').expect(409);
  await act(3, 2, 'remove').expect(404);
  await act(1, 2, 'remove').expect(204);
});
it('accepts simultaneous crossed requests as one friendship', async () => {
  const { act, pairs } = setup();
  await Promise.all([act(1, 2, 'request').expect(204), act(2, 1, 'request').expect(204)]);
  expect([...pairs.values()]).toMatchObject([{ status: 'accepted' }]);
});
