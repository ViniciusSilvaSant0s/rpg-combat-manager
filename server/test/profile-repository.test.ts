import { expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ execute: vi.fn(), close: vi.fn(), getConnection: vi.fn() }));
vi.mock('../src/oracle-pool.js', () => ({ getOracleConnection: mock.getConnection }));
import { profiles } from '../src/repositories/profiles.js';

it('updates only requested fields and returns the row in one database operation', async () => {
  mock.execute.mockResolvedValue({ rowsAffected: 1, outBinds: { outId: [1], outEmail: ['hero@example.com'], outName: [null], outNickname: ['Hero2'], outBirthDate: ['2000-01-01'] } });
  mock.close.mockResolvedValue(undefined);
  mock.getConnection.mockResolvedValue({ execute: mock.execute, close: mock.close });
  const result = await profiles.update({ uid: 'uid' }, { nickname: 'Hero2' });
  expect(result).toEqual({ id: 1, email: 'hero@example.com', displayName: null, nickname: 'Hero2', birthDate: '2000-01-01' });
  expect(mock.execute).toHaveBeenCalledTimes(1);
  expect(mock.execute.mock.calls[0][0]).toContain('RETURNING');
  expect(mock.execute.mock.calls[0][0]).not.toContain('birth_date =');
  expect(mock.close).toHaveBeenCalledOnce();
});
