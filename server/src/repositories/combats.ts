import oracledb from 'oracledb';
import { getOracleConnection } from '../oracle-pool.js';
import type { Combat, CombatState, Combats } from '../models/combat.js';
import type { Identity } from '../models/profile.js';

import { accessibleSheet } from './friendships.js';

type CombatRow = { ID: number; TITLE: string; DESCRIPTION: string | null; STARTED: number; CURRENT_PARTICIPANT_ID: number | null; VERSION: number };
type ParticipantRow = { ID: number; COMBATANT_ID: number; CURRENT_HIT_POINTS: number; ADDITIONAL_HIT_POINTS: number | null; INITIATIVE: number | null; NATURAL_INITIATIVE: 1 | 20 | null; CONDITION_ID: string | null };
async function read(connection: oracledb.Connection, identity: Identity, id: number): Promise<Combat | null> {
  const result = await connection.execute<CombatRow>(`SELECT c.id, c.title, c.description, c.started, c.current_participant_id, c.version FROM combats c JOIN app_users u ON u.id = c.user_id WHERE c.id = :id AND u.firebase_uid = :firebaseUid`, { id, firebaseUid: identity.uid }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
  const row = result.rows?.[0];
  if (!row) return null;
  const items = await connection.execute<ParticipantRow>(`SELECT p.id, p.combatant_id, p.current_hit_points, p.additional_hit_points, p.initiative, p.natural_initiative, pc.condition_id FROM combat_participants p LEFT JOIN combat_participant_conditions pc ON pc.participant_id = p.id WHERE p.combat_id = :id ORDER BY p.position, p.id`, { id }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
  const participants: Combat['participants'] = [];
  for (const p of items.rows ?? []) {
    let entry = participants.find(item => item.id === p.ID);
    if (!entry) { entry = { id: p.ID, combatantId: p.COMBATANT_ID, currentHitPoints: p.CURRENT_HIT_POINTS, additionalHitPoints: p.ADDITIONAL_HIT_POINTS, initiative: p.INITIATIVE, naturalInitiative: p.NATURAL_INITIATIVE, conditions: [] }; participants.push(entry); }
    if (p.CONDITION_ID) entry.conditions.push(p.CONDITION_ID);
  }
  return { id: row.ID, title: row.TITLE, description: row.DESCRIPTION, started: row.STARTED === 1, currentParticipantId: row.CURRENT_PARTICIPANT_ID, version: row.VERSION, participants };
}
export const combats: Combats = {
  async list(identity) {
    const connection = await getOracleConnection();
    try {
      await connection.execute('SET TRANSACTION READ ONLY');
      const result = await connection.execute<{ ID: number }>(`SELECT c.id FROM combats c JOIN app_users u ON u.id = c.user_id WHERE u.firebase_uid = :firebaseUid ORDER BY c.id`, { firebaseUid: identity.uid }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
      const items: (Combat | null)[] = [];
      for (const row of result.rows ?? []) items.push(await read(connection, identity, row.ID));
      return items.filter((item): item is Combat => item !== null);
    } finally { await connection.close(); }
  },
  async get(identity, id) { const connection = await getOracleConnection(); try { await connection.execute('SET TRANSACTION READ ONLY'); return await read(connection, identity, id); } finally { await connection.close(); } },
  async create(identity, title, description) {
    const connection = await getOracleConnection();
    try {
      const result = await connection.execute(`INSERT INTO combats (user_id, title, description) VALUES ((SELECT id FROM app_users WHERE firebase_uid = :firebaseUid), :title, :description) RETURNING id INTO :outId`, { firebaseUid: identity.uid, title, description, outId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } }, { autoCommit: true });
      return { id: (result.outBinds as { outId: number[] }).outId[0], title, description, started: false, currentParticipantId: null, version: 1, participants: [] };
    } finally { await connection.close(); }
  },
  async update(identity, id, input: CombatState) {
    const connection = await getOracleConnection();
    try {
      await connection.execute('SELECT id FROM app_users WHERE firebase_uid = :firebaseUid FOR UPDATE', { firebaseUid: identity.uid });
      const maximumBySheet = new Map<number, number>();
      const sourceIds = [...new Set(input.participants.map(p => p.combatantId))].sort((a, b) => a - b);
      for (const combatantId of sourceIds) {
        const sources = await connection.execute<{ MAXIMUM_HIT_POINTS: number }>(`
          SELECT s.maximum_hit_points FROM combatants s CROSS JOIN app_users actor
          WHERE s.id = :combatantId AND actor.firebase_uid = :firebaseUid AND ${accessibleSheet('actor', 's')}
          FOR UPDATE OF s.maximum_hit_points`, { combatantId, firebaseUid: identity.uid }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        const sheet = sources.rows?.[0];
        if (sheet) maximumBySheet.set(combatantId, sheet.MAXIMUM_HIT_POINTS);
      }
      const locked = await connection.execute<{ VERSION: number }>(`SELECT c.version FROM combats c JOIN app_users u ON u.id = c.user_id WHERE c.id = :id AND u.firebase_uid = :firebaseUid FOR UPDATE OF c.version`, { id, firebaseUid: identity.uid }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
      if (!locked.rows?.length) return 'not-found';
      if (locked.rows[0].VERSION !== input.version) return 'conflict';
      if (input.participants.some(p => !maximumBySheet.has(p.combatantId) || p.currentHitPoints > maximumBySheet.get(p.combatantId)!)) {
        return 'invalid-participant';
      }
      await connection.execute(`UPDATE combats SET current_participant_id = NULL WHERE id = :id`, { id });
      await connection.execute(`DELETE FROM combat_participants WHERE combat_id = :id`, { id });
      for (const [position, p] of input.participants.entries()) {
        await connection.execute(`INSERT INTO combat_participants (id, combat_id, combatant_id, position, current_hit_points, additional_hit_points, initiative, natural_initiative) VALUES (:participantId, :combatId, :combatantId, :position, :currentHitPoints, :additionalHitPoints, :initiative, :naturalInitiative)`, { participantId: p.id, combatId: id, combatantId: p.combatantId, position, currentHitPoints: p.currentHitPoints, additionalHitPoints: p.additionalHitPoints, initiative: p.initiative, naturalInitiative: p.naturalInitiative });
        for (const condition of p.conditions) await connection.execute(`INSERT INTO combat_participant_conditions (participant_id, condition_id) VALUES (:participantId, :conditionId)`, { participantId: p.id, conditionId: condition });
      }
      await connection.execute(`UPDATE combats SET title = :title, description = :description, started = :started, current_participant_id = :currentParticipantId, version = version + 1, updated_at = SYSTIMESTAMP WHERE id = :id`, { id, title: input.title, description: input.description, started: input.started ? 1 : 0, currentParticipantId: input.currentParticipantId });
      await connection.commit();
      return { ...input, id, version: input.version + 1 };
    } catch (error) { await connection.rollback(); throw error; } finally { await connection.close(); }
  },
  async delete(identity, id) {
    const connection = await getOracleConnection();
    try {
      await connection.execute(`UPDATE combats SET current_participant_id = NULL WHERE id = :id AND user_id = (SELECT id FROM app_users WHERE firebase_uid = :firebaseUid)`, { id, firebaseUid: identity.uid });
      const result = await connection.execute(`DELETE FROM combats WHERE id = :id AND user_id = (SELECT id FROM app_users WHERE firebase_uid = :firebaseUid)`, { id, firebaseUid: identity.uid }, { autoCommit: true });
      return !!result.rowsAffected;
    } catch (error) { await connection.rollback(); throw error; } finally { await connection.close(); }
  },
};
