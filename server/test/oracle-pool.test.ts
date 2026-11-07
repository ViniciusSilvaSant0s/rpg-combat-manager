import { beforeEach, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ createPool: vi.fn(), getConnection: vi.fn(), close: vi.fn() }));
vi.mock('oracledb', () => ({ default: { createPool: mock.createPool } }));
import { getOracleConnection, closeOraclePool } from '../src/oracle-pool.js';

beforeEach(() => { vi.clearAllMocks(); mock.createPool.mockResolvedValue({ getConnection: mock.getConnection, close: mock.close }); mock.getConnection.mockResolvedValue({}); mock.close.mockResolvedValue(undefined); });

it('shares a pool across concurrent requests and closes it', async () => {
  await Promise.all([getOracleConnection(), getOracleConnection()]);
  expect(mock.createPool).toHaveBeenCalledTimes(1);
  expect(mock.getConnection).toHaveBeenCalledTimes(2);
  await closeOraclePool();
  expect(mock.close).toHaveBeenCalledOnce();
});

it('retries pool creation after failure', async () => {
  mock.createPool.mockRejectedValueOnce(new Error('unavailable'));
  await expect(getOracleConnection()).rejects.toThrow('unavailable');
  await getOracleConnection();
  expect(mock.createPool).toHaveBeenCalledTimes(2);
  await closeOraclePool();
});
