import { expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({ execute: vi.fn(), close: vi.fn(), commit: vi.fn(), rollback: vi.fn(), getConnection: vi.fn() }));
vi.mock('../src/oracle-pool.js', () => ({ getOracleConnection: mock.getConnection }));
import { combats } from '../src/repositories/combats.js';

it('rejects stale writes without modifying combat state', async () => {
  mock.execute.mockReset(); mock.commit.mockReset(); mock.close.mockReset();
  mock.getConnection.mockResolvedValue(mock);
  mock.execute.mockResolvedValueOnce({}).mockResolvedValueOnce({ rows: [{ VERSION: 2 }] });
  const result = await combats.update({ uid: 'alice' }, 1, { title: 'Combate', description: null, started: false, currentParticipantId: null, version: 1, participants: [] });
  expect(result).toBe('conflict');
  expect(mock.execute).toHaveBeenCalledTimes(2);
  expect(mock.commit).not.toHaveBeenCalled();
  expect(mock.close).toHaveBeenCalledOnce();
});

it('rolls back all writes if saving a participant fails', async () => {
  mock.execute.mockReset(); mock.commit.mockReset(); mock.rollback.mockReset();
  mock.getConnection.mockResolvedValue(mock);
  mock.execute.mockResolvedValueOnce({}).mockResolvedValueOnce({ rows: [{ MAXIMUM_HIT_POINTS: 10 }] }).mockResolvedValueOnce({ rows: [{ VERSION: 1 }] }).mockResolvedValueOnce({}).mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('failure'));
  const participant = { id: 5, combatantId: 4, currentHitPoints: 10, additionalHitPoints: null, initiative: null, naturalInitiative: null, conditions: [] };
  await expect(combats.update({ uid: 'alice' }, 1, { title: 'Combate', description: null, started: false, currentParticipantId: null, version: 1, participants: [participant] })).rejects.toThrow('failure');
  expect(mock.rollback).toHaveBeenCalledOnce();
  expect(mock.commit).not.toHaveBeenCalled();
});

it('reads combat and participants in a read-only transaction', async () => {
  mock.execute.mockReset();
  mock.getConnection.mockResolvedValue(mock);
  mock.execute.mockResolvedValueOnce({}).mockResolvedValueOnce({ rows: [{ ID: 1, TITLE: 'Floresta', DESCRIPTION: null, STARTED: 1, CURRENT_PARTICIPANT_ID: 3, VERSION: 4 }] }).mockResolvedValueOnce({ rows: [{ ID: 3, COMBATANT_ID: 9, CURRENT_HIT_POINTS: 5, ADDITIONAL_HIT_POINTS: 2, INITIATIVE: 12, NATURAL_INITIATIVE: null, CONDITION_ID: 'blinded' }] });
  const combat = await combats.get({ uid: 'alice' }, 1);
  expect(mock.execute.mock.calls[0][0]).toBe('SET TRANSACTION READ ONLY');
  expect(combat).toMatchObject({ version: 4, currentParticipantId: 3, participants: [{ currentHitPoints: 5, additionalHitPoints: 2, conditions: ['blinded'] }] });
});

it('rejects a combatant that is unavailable to the authenticated user', async () => {
  mock.execute.mockReset(); mock.commit.mockReset();
  mock.getConnection.mockResolvedValue(mock);
  mock.execute.mockResolvedValueOnce({}).mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ VERSION: 1 }] });
  const p = { id: 5, combatantId: 4, currentHitPoints: 10, additionalHitPoints: null, initiative: null, naturalInitiative: null, conditions: [] };
  await expect(combats.update({ uid: 'bob' }, 1, { title: 'Combate', description: null, started: false, currentParticipantId: null, version: 1, participants: [p] })).resolves.toBe('invalid-participant');
  expect(mock.execute).toHaveBeenCalledTimes(3);
  expect(mock.execute.mock.calls[0][0]).toMatch(/app_users.*FOR UPDATE/);
  expect(mock.execute.mock.calls[1][0]).toContain("f.status = 'accepted'");
  expect(mock.commit).not.toHaveBeenCalled();
});
