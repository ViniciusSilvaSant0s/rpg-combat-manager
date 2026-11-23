import { readFileSync } from 'node:fs';
import { expect, it, vi } from 'vitest';
const db = vi.hoisted(() => ({ execute: vi.fn(), commit: vi.fn(), rollback: vi.fn(), close: vi.fn() }));
vi.mock('../src/oracle-pool.js', () => ({ getOracleConnection: async () => db }));
import { friendships } from '../src/repositories/friendships.js';
import { createFriendshipsService } from '../src/services/friendships.js';

it('enforces canonical distinct pairs, sender membership and valid states', () => {
  const sql = readFileSync(new URL('../migrations/V4__create_friendships.sql', import.meta.url), 'utf8');
  for (const fragment of ['PRIMARY KEY (low_id, high_id)', 'low_id < high_id', 'sender_id IN (low_id, high_id)', "status IN ('pending', 'accepted')"]) expect(sql).toContain(fragment);
});
it('looks up an exact nickname and returns public fields', async () => {
  db.execute.mockResolvedValueOnce({ rows: [{ ID: 5, NICKNAME: 'Alice', EMAIL: 'private' }] });
  expect(await friendships.search({ uid: 'viewer' }, 'aLiCe')).toEqual({ id: 5, nickname: 'Alice' });
  expect(db.execute.mock.calls.at(-1)?.[0]).toContain('LOWER(other.nickname) = LOWER(:nickname)');
});
it('locks profiles before reading the pair and accepts a crossed request', async () => {
  db.execute.mockReset().mockResolvedValueOnce({ rows: [{ ID: 1, IS_ACTOR: 0 }, { ID: 3, IS_ACTOR: 1 }] })
    .mockResolvedValueOnce({ rows: [{ SENDER_ID: 1, STATUS: 'pending' }] }).mockResolvedValueOnce({});
  expect(await createFriendshipsService(friendships).act({ uid: 'b' }, 1, 'request')).toBe('ok');
  expect(db.execute.mock.calls[0][0]).toMatch(/ORDER BY id FOR UPDATE/i);
  expect(db.execute.mock.calls[2][0]).toContain("status = 'accepted'");
});

it('removes bilateral links, preserving other turns and updating each affected combat once', async () => {
  db.execute.mockReset();
  db.commit.mockReset();
  const rows = (items: [number, number][], current: number) =>
    items.map(([ID, REMOVED]) => ({ ID, REMOVED, CURRENT_PARTICIPANT_ID: current }));
  db.execute.mockImplementation(async (sql: string, binds: { combatId: number }) => {
    if (sql.includes('AS is_actor')) return { rows: [{ ID: 1, IS_ACTOR: 1 }, { ID: 3, IS_ACTOR: 0 }] };
    if (sql.includes('SELECT sender_id')) return { rows: [{ SENDER_ID: 1, STATUS: 'accepted' }] };
    if (sql.includes('WHERE EXISTS')) return { rows: [2, 4, 8, 9].map(ID => ({ ID })) };
    if (sql.includes('AS removed')) {
      const participants = {
        2: rows([[7, 0], [1, 1], [2, 1]], 1),
        4: rows([[3, 1]], 3),
        8: rows([[4, 0], [5, 1]], 4),
        9: rows([[6, 0]], 6),
      };
      return { rows: participants[binds.combatId as keyof typeof participants] };
    }
    return {};
  });
  await expect(createFriendshipsService(friendships).act({ uid: 'a' }, 3, 'remove')).resolves.toBe('ok');
  const writes = db.execute.mock.calls.filter(([sql]) => sql.includes('version = version + 1'));
  expect(writes.map(([, binds]) => binds)).toEqual([
    { combatId: 2, nextId: 7 }, { combatId: 4, nextId: null }, { combatId: 8, nextId: 4 },
  ]);
  expect(db.execute.mock.calls.filter(([sql]) => sql.includes('DELETE FROM combat_participants'))).toHaveLength(3);
  expect(db.execute.mock.calls.some(([sql]) => sql.includes('DELETE FROM combatants'))).toBe(false);
  expect(db.commit).toHaveBeenCalledOnce();
});
it('rolls back a failed unfriend without committing the relationship change', async () => {
  db.execute.mockReset();
  db.commit.mockReset();
  db.rollback.mockReset();
  db.execute.mockResolvedValueOnce({ rows: [{ ID: 1, IS_ACTOR: 1 }, { ID: 3, IS_ACTOR: 0 }] })
    .mockResolvedValueOnce({ rows: [{ SENDER_ID: 1, STATUS: 'accepted' }] })
    .mockRejectedValueOnce(new Error('connection lost'));
  await expect(createFriendshipsService(friendships).act({ uid: 'a' }, 3, 'remove')).rejects.toThrow('connection lost');
  expect(db.rollback).toHaveBeenCalledOnce();
  expect(db.commit).not.toHaveBeenCalled();
});

it('lists friends and pending invitations with id and nickname only', async () => {
  db.execute.mockReset().mockResolvedValueOnce({ rows: [
    { ID: 1, NICKNAME: 'Alice', CATEGORY: 'friends', EMAIL: 'private' },
    { ID: 2, NICKNAME: 'Bob', CATEGORY: 'received', BIRTH_DATE: 'private' },
    { ID: 3, NICKNAME: 'Carol', CATEGORY: 'sent' },
  ] }).mockResolvedValueOnce({ rows: [{ ID: null }] }).mockResolvedValueOnce({ rows: [] });
  const actor = { uid: 'user' };
  await expect(friendships.list(actor)).resolves.toEqual({
    friends: [{ id: 1, nickname: 'Alice' }], received: [{ id: 2, nickname: 'Bob' }], sent: [{ id: 3, nickname: 'Carol' }],
  });
  await expect(friendships.list(actor)).resolves.toEqual({ friends: [], received: [], sent: [] });
  await expect(friendships.list(actor)).resolves.toBeNull();
});
