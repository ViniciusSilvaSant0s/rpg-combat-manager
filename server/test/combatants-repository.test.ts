import { expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ execute: vi.fn(), close: vi.fn(), commit: vi.fn(), rollback: vi.fn(), getConnection: vi.fn() }));
vi.mock('../src/oracle-pool.js', () => ({ getOracleConnection: mock.getConnection }));
import { combatants } from '../src/repositories/combatants.js';

it('lists only the authenticated user combatants and closes the connection', async () => {
  mock.execute.mockReset(); mock.close.mockReset();
  mock.getConnection.mockResolvedValue({ execute: mock.execute, close: mock.close, commit: mock.commit, rollback: mock.rollback });
  mock.execute.mockResolvedValue({ rows: [{ ID: 3, NAME: 'Aria', TYPE: 'player', CHARACTER_ID: null, MAXIMUM_HIT_POINTS: 12, ARMOR_CLASS: 15 }] });
  await expect(combatants.list({ uid: 'user-a' })).resolves.toEqual([{ id: 3, name: 'Aria', type: 'player', characterId: null, maximumHitPoints: 12, armorClass: 15 }]);
  expect(mock.execute.mock.calls[0][1]).toEqual({ firebaseUid: 'user-a' });
  expect(mock.close).toHaveBeenCalledOnce();
});

it('uses Oracle-compatible bind names for every combatant operation', async () => {
  mock.close.mockResolvedValue(undefined);
  mock.getConnection.mockResolvedValue({ execute: mock.execute, close: mock.close, commit: mock.commit, rollback: mock.rollback });
  mock.execute.mockImplementation(async (sql: string) => {
    if (/:uid\b/i.test(sql)) throw new Error('ORA-01745');
    return { rows: [{ ID: null }], rowsAffected: 1, outBinds: { outId: [1] } };
  });
  const input = { name: 'Aria', type: 'player' as const, characterId: null, maximumHitPoints: 10, armorClass: 12 };
  await expect(combatants.list({ uid: 'user' })).resolves.toEqual([]);
  await expect(combatants.create({ uid: 'user' }, input)).resolves.toMatchObject(input);
  await expect(combatants.update({ uid: 'user' }, 1, input)).resolves.toMatchObject(input);
  await expect(combatants.delete({ uid: 'user' }, 1)).resolves.toBe(true);
});

it('distinguishes a missing profile from a profile with no combatants in one query', async () => {
  mock.getConnection.mockResolvedValue({ execute: mock.execute, close: mock.close });
  mock.execute.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ ID: null }] });
  await expect(combatants.list({ uid: 'missing' })).resolves.toBeNull();
  await expect(combatants.list({ uid: 'empty' })).resolves.toEqual([]);
});

it('updates the sheet and adjusts all excess current health in the same transaction', async () => {
  mock.execute.mockReset(); mock.commit.mockReset(); mock.rollback.mockReset();
  mock.getConnection.mockResolvedValue({ execute: mock.execute, close: mock.close, commit: mock.commit, rollback: mock.rollback });
  mock.execute.mockResolvedValue({ rowsAffected: 1 });
  await combatants.update({ uid: 'alice' }, 4, { name: 'Aria', type: 'player', characterId: null, maximumHitPoints: 10, armorClass: 15 });
  const update = mock.execute.mock.calls.find(([sql]: [string]) => sql.includes('NVL(additional_hit_points'));
  expect(update?.[1]).toEqual({ id: 4, maximumHitPoints: 10 });
  expect(update?.[0]).toContain('NVL(additional_hit_points, 0) + current_hit_points - :maximumHitPoints');
  expect(mock.commit).toHaveBeenCalledOnce();
});

it('counts distinct combats for the owner', async () => {
  mock.execute.mockReset();
  mock.getConnection.mockResolvedValue({ execute: mock.execute, close: mock.close });
  mock.execute.mockResolvedValue({ rows: [{ TOTAL: 2 }] });
  await expect(combatants.countCombats({ uid: 'alice' }, 4)).resolves.toBe(2);
  expect(mock.execute.mock.calls[0][0]).toContain('COUNT(DISTINCT p.combat_id)');
  expect(mock.execute.mock.calls[0][1]).toEqual({ id: 4, firebaseUid: 'alice' });
});

it('advances past every removed occurrence and deletes them in one transaction', async () => {
  mock.execute.mockReset(); mock.commit.mockReset();
  mock.getConnection.mockResolvedValue({ execute: mock.execute, close: mock.close, commit: mock.commit, rollback: mock.rollback });
  mock.execute.mockResolvedValueOnce({ rows: [[4]] })
    .mockResolvedValueOnce({ rows: [{ ID: 1, CURRENT_PARTICIPANT_ID: 10 }] })
    .mockResolvedValueOnce({ rows: [{ ID: 10, COMBATANT_ID: 4 }, { ID: 11, COMBATANT_ID: 4 }, { ID: 12, COMBATANT_ID: 5 }] })
    .mockResolvedValueOnce({ rowsAffected: 1 }).mockResolvedValueOnce({ rowsAffected: 2 }).mockResolvedValueOnce({ rowsAffected: 1 });
  await expect(combatants.delete({ uid: 'alice' }, 4)).resolves.toBe(true);
  expect(mock.execute.mock.calls[3][1]).toEqual({ nextId: 12, combatId: 1 });
  expect(mock.commit).toHaveBeenCalledOnce();
});
