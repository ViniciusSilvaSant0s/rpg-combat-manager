import { expect, it, vi } from 'vitest';
import { combats } from '../src/repositories/combats.js';
import { friendships } from '../src/repositories/friendships.js';
import { createFriendshipsService } from '../src/services/friendships.js';

const getConnection = vi.hoisted(() => vi.fn());
vi.mock('../src/oracle-pool.js', () => ({ getOracleConnection: getConnection }));

function signal() {
  let open!: () => void;
  const wait = new Promise<void>(resolve => { open = resolve; });
  return { open, wait };
}

// Model the shared profile lock. A missing or late lock allows the second transaction
// to observe stale authorization. The SQL and bind checks also verify which pair shares it.
it.each([
  ['save', 'alice', 1, 'bob', 2], ['unfriend', 'alice', 1, 'bob', 2],
  ['save', 'bob', 2, 'alice', 1], ['unfriend', 'bob', 2, 'alice', 1],
] as const)('retains no shared participant with %s first and %s saving', async (first, saver, saverId, remover, removerId) => {
  const locked = signal();
  const waiting = signal();
  const proceed = signal();
  const profileLocks = new Map<number, ReturnType<typeof signal>>();
  let connected = 0;
  let friends = true;
  let hasParticipant = true;
  let version = 1;
  getConnection.mockImplementation(async () => {
    const id = ++connected;
    const held = new Map<number, ReturnType<typeof signal>>();
    return {
      async execute(sql: string, binds: Record<string, unknown>) {
        const pairLock = sql.includes('AS is_actor') && sql.includes('FOR UPDATE');
        if (pairLock || sql.includes('FOR UPDATE OF u.id')) {
          const actor = binds.firebaseUid === 'alice' ? 1 : 2;
          expect(binds.firebaseUid).toBe(pairLock ? remover : saver);
          const ids = [actor];
          if (pairLock) {
            expect(sql).toMatch(/OR id = :targetId ORDER BY id FOR UPDATE/);
            expect(binds.targetId).toBe(saverId);
            ids.push(Number(binds.targetId));
            ids.sort((a, b) => a - b);
          }
          for (const profile of ids) {
            const prior = profileLocks.get(profile);
            if (prior) { waiting.open(); await prior.wait; }
            const release = signal();
            profileLocks.set(profile, release);
            held.set(profile, release);
          }
          if (id === 1) { locked.open(); await proceed.wait; }
          return { rows: pairLock ? ids.map(ID => ({ ID, IS_ACTOR: Number(ID === removerId) })) : [{ VERSION: version }] };
        }
        if (sql.includes('SELECT sender_id')) return { rows: [{ STATUS: 'accepted', SENDER_ID: 1 }] };
        if (sql.includes('SELECT s.maximum_hit_points')) {
          expect(sql).toContain("f.status = 'accepted'");
          return { rows: friends ? [{ MAXIMUM_HIT_POINTS: 12 }] : [] };
        }
        if (sql.includes('SELECT c.version')) return { rows: [{ VERSION: version }] };
        if (sql.includes('SELECT c.id FROM combats c WHERE EXISTS')) {
          expect(sql).toContain('c.user_id = :lowId AND s.user_id = :highId');
          expect(sql).toContain('c.user_id = :highId AND s.user_id = :lowId');
          return { rows: hasParticipant ? [{ ID: 7 }] : [] };
        }
        if (sql.includes('AS removed')) return { rows: [{ ID: 9, CURRENT_PARTICIPANT_ID: 9, REMOVED: 1 }] };
        if (sql.includes('version = version + 1')) version++;
        if (sql.includes('DELETE FROM combat_participants')) hasParticipant = false;
        if (sql.includes('INSERT INTO combat_participants')) hasParticipant = true;
        if (sql.includes('DELETE FROM friendships')) friends = false;
        return {};
      },
      commit: async () => {},
      close: async () => {
        for (const [profile, release] of held) {
          profileLocks.delete(profile);
          release.open();
        }
      },
      rollback: async () => {},
    };
  });
  const save = () => combats.update({ uid: saver }, 7, {
    title: 'Floresta', description: null, started: true, currentParticipantId: 9, version: 1,
    participants: [{ id: 9, combatantId: 5, currentHitPoints: 9, additionalHitPoints: 1, initiative: 10, naturalInitiative: null, conditions: [] }],
  });
  const unfriend = () => createFriendshipsService(friendships).act({ uid: remover }, saverId, 'remove');
  const a = first === 'save' ? save() : unfriend();
  await locked.wait;
  const b = first === 'save' ? unfriend() : save();
  await waiting.wait;
  proceed.open();
  const results = await Promise.all([a, b]);
  expect(results).toContain('ok');
  if (first === 'unfriend') expect(results).toContain('conflict');
  else expect(results[0]).toMatchObject({ version: 2 });
  expect(friends).toBe(false);
  expect(hasParticipant).toBe(false);
  expect(version).toBe(first === 'save' ? 3 : 2);
});
