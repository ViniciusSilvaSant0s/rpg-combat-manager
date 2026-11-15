import { expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ execute: vi.fn(), close: vi.fn(), getConnection: vi.fn() }));
vi.mock('../src/oracle-pool.js', () => ({ getOracleConnection: mock.getConnection }));
import { combatants } from '../src/repositories/combatants.js';

it('lists only the authenticated user combatants and closes the connection', async () => {
  mock.execute.mockReset(); mock.close.mockReset();
  mock.getConnection.mockResolvedValue({ execute: mock.execute, close: mock.close });
  mock.execute.mockResolvedValue({ rows: [{ ID: 3, NAME: 'Aria', TYPE: 'player', CHARACTER_ID: null, MAXIMUM_HIT_POINTS: 12, ARMOR_CLASS: 15 }] });
  await expect(combatants.list({ uid: 'user-a' })).resolves.toEqual([{ id: 3, name: 'Aria', type: 'player', characterId: null, maximumHitPoints: 12, armorClass: 15 }]);
  expect(mock.execute.mock.calls[0][1]).toEqual({ firebaseUid: 'user-a' });
  expect(mock.close).toHaveBeenCalledOnce();
});

it('uses Oracle-compatible bind names for every combatant operation', async () => {
  mock.close.mockResolvedValue(undefined);
  mock.getConnection.mockResolvedValue({ execute: mock.execute, close: mock.close });
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
