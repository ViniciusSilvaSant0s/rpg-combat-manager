import oracledb from 'oracledb';
import { getOracleConnection } from '../oracle-pool.js';
import type { Identity } from '../models/profile.js';
import type { Combatant, Combatants } from '../models/combatant.js';

type Row = { ID: number; NAME: string; TYPE: 'player' | 'npc'; CHARACTER_ID: string | null; MAXIMUM_HIT_POINTS: number; ARMOR_CLASS: number };
type EmptyRow = { ID: null };
function map(row: Row): Combatant {
  return { id: row.ID, name: row.NAME, type: row.TYPE, characterId: row.CHARACTER_ID, maximumHitPoints: row.MAXIMUM_HIT_POINTS, armorClass: row.ARMOR_CLASS };
}
const columns = 'c.id, c.name, c.type, c.character_id, c.maximum_hit_points, c.armor_class';
async function list(identity: Identity): Promise<Combatant[] | null> {
  const connection = await getOracleConnection();
  try {
    const result = await connection.execute<Row | EmptyRow>(
      `SELECT ${columns} FROM app_users u LEFT JOIN combatants c ON u.id = c.user_id WHERE u.firebase_uid = :firebaseUid ORDER BY c.id`,
      { firebaseUid: identity.uid }, { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );
    const rows = result.rows ?? [];
    return rows.length ? rows.filter((row): row is Row => row.ID !== null).map(map) : null;
  } finally { await connection.close(); }
}
export const combatants: Combatants = {
  list,
  async countCombats(identity, id) {
    const connection = await getOracleConnection();
    try {
      const result = await connection.execute<{ TOTAL: number }>(`SELECT COUNT(DISTINCT p.combat_id) AS total FROM combatants c LEFT JOIN combat_participants p ON p.combatant_id = c.id WHERE c.id = :id AND c.user_id = (SELECT id FROM app_users WHERE firebase_uid = :firebaseUid) GROUP BY c.id`, { id, firebaseUid: identity.uid }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
      return result.rows?.[0]?.TOTAL ?? null;
    } finally { await connection.close(); }
  },
  async hasProfile(identity) {
    const connection = await getOracleConnection();
    try {
      const result = await connection.execute('SELECT id FROM app_users WHERE firebase_uid = :firebaseUid', { firebaseUid: identity.uid });
      return !!result.rows?.length;
    } finally { await connection.close(); }
  },
  async create(identity, input) {
    const connection = await getOracleConnection();
    try {
      const result = await connection.execute(`INSERT INTO combatants (user_id, name, type, character_id, maximum_hit_points, armor_class) VALUES ((SELECT id FROM app_users WHERE firebase_uid = :firebaseUid), :name, :type, :characterId, :maximumHitPoints, :armorClass) RETURNING id INTO :outId`, { firebaseUid: identity.uid, ...input, outId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } }, { autoCommit: true });
      const id = (result.outBinds as { outId: number[] }).outId[0];
      if (!id) throw new Error('Profile not found');
      return { ...input, id };
    } finally { await connection.close(); }
  },
  async update(identity, id, input) {
    const connection = await getOracleConnection();
    try {
      const result = await connection.execute(`UPDATE combatants SET name = :name, type = :type, character_id = :characterId, maximum_hit_points = :maximumHitPoints, armor_class = :armorClass, updated_at = SYSTIMESTAMP WHERE id = :id AND user_id = (SELECT id FROM app_users WHERE firebase_uid = :firebaseUid)`, { firebaseUid: identity.uid, id, ...input });
      if (!result.rowsAffected) return null;
      await connection.execute(`UPDATE combats SET version = version + 1, updated_at = SYSTIMESTAMP WHERE id IN (SELECT combat_id FROM combat_participants WHERE combatant_id = :id)`, { id });
      await connection.execute(`UPDATE combat_participants SET additional_hit_points = NVL(additional_hit_points, 0) + current_hit_points - :maximumHitPoints, current_hit_points = :maximumHitPoints WHERE combatant_id = :id AND current_hit_points > :maximumHitPoints`, { id, maximumHitPoints: input.maximumHitPoints });
      await connection.commit();
      return result.rowsAffected ? { id, ...input } : null;
    } catch (error) { await connection.rollback(); throw error; } finally { await connection.close(); }
  },
  async delete(identity, id) {
    const connection = await getOracleConnection();
    try {
      const owned = await connection.execute(`SELECT id FROM combatants WHERE id = :id AND user_id = (SELECT id FROM app_users WHERE firebase_uid = :firebaseUid) FOR UPDATE`, { id, firebaseUid: identity.uid });
      if (!owned.rows?.length) return false;
      const affected = await connection.execute<{ ID: number; CURRENT_PARTICIPANT_ID: number | null }>(`SELECT c.id, c.current_participant_id FROM combats c WHERE c.id IN (SELECT combat_id FROM combat_participants WHERE combatant_id = :id) FOR UPDATE OF c.version`, { id }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
      for (const combat of affected.rows ?? []) {
        const entries = await connection.execute<{ ID: number; COMBATANT_ID: number }>(`SELECT id, combatant_id FROM combat_participants WHERE combat_id = :combatId ORDER BY CASE natural_initiative WHEN 20 THEN 0 WHEN 1 THEN 2 ELSE 1 END, initiative DESC NULLS LAST, position, id`, { combatId: combat.ID }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        const participants = entries.rows ?? [];
        const currentIndex = participants.findIndex(p => p.ID === combat.CURRENT_PARTICIPANT_ID);
        let next = combat.CURRENT_PARTICIPANT_ID;
        if (currentIndex >= 0 && participants[currentIndex].COMBATANT_ID === id) {
          next = null;
          for (let offset = 1; offset < participants.length; offset++) {
            const candidate = participants[(currentIndex + offset) % participants.length];
            if (candidate.COMBATANT_ID !== id) { next = candidate.ID; break; }
          }
        }
        await connection.execute(`UPDATE combats SET current_participant_id = :nextId, version = version + 1, updated_at = SYSTIMESTAMP WHERE id = :combatId`, { nextId: next, combatId: combat.ID });
      }
      await connection.execute(`DELETE FROM combat_participants WHERE combatant_id = :id`, { id });
      const result = await connection.execute(`DELETE FROM combatants WHERE id = :id AND user_id = (SELECT id FROM app_users WHERE firebase_uid = :firebaseUid)`, { firebaseUid: identity.uid, id });
      await connection.commit();
      return !!result.rowsAffected;
    } catch (error) { await connection.rollback(); throw error; } finally { await connection.close(); }
  },
};
