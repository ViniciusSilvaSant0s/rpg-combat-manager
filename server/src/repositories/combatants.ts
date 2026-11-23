import oracledb from 'oracledb';
import { getOracleConnection } from '../oracle-pool.js';
import type { Identity } from '../models/profile.js';
import type { AccessibleCombatant, Combatants } from '../models/combatant.js';
import { accessibleSheet } from './friendships.js';
import { removeParticipations } from './participations.js';

type Row = { OWNER_ID: number; OWNER_NICKNAME: string; IS_OWNER: number; ID: number; NAME: string; TYPE: 'player' | 'npc'; CHARACTER_ID: string | null; MAXIMUM_HIT_POINTS: number; ARMOR_CLASS: number };
type EmptyRow = { ID: null };
function map(row: Row): AccessibleCombatant {
  return { owner: { id: row.OWNER_ID, nickname: row.OWNER_NICKNAME }, isOwner: row.IS_OWNER === 1, id: row.ID, name: row.NAME, type: row.TYPE, characterId: row.CHARACTER_ID, maximumHitPoints: row.MAXIMUM_HIT_POINTS, armorClass: row.ARMOR_CLASS };
}
const columns = 'c.id, c.name, c.type, c.character_id, c.maximum_hit_points, c.armor_class';
async function list(identity: Identity): Promise<AccessibleCombatant[] | null> {
  const connection = await getOracleConnection();
  try {
    const result = await connection.execute<Row | EmptyRow>(
      `WITH actor AS (SELECT id FROM app_users WHERE firebase_uid = :firebaseUid),
        visible AS (SELECT ${columns}, c.user_id AS owner_id, owner.nickname AS owner_nickname,
          CASE WHEN c.user_id = actor.id THEN 1 ELSE 0 END AS is_owner
          FROM combatants c JOIN app_users owner ON owner.id = c.user_id CROSS JOIN actor
          WHERE ${accessibleSheet('actor', 'c')})
        SELECT visible.* FROM actor LEFT JOIN visible ON 1 = 1 ORDER BY visible.id`,
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
      await connection.execute(`SELECT c.id FROM combats c WHERE c.id IN
        (SELECT p.combat_id FROM combat_participants p WHERE p.combatant_id = :id)
        ORDER BY c.id FOR UPDATE OF c.version`, { id });
      const overflow = await connection.execute(`SELECT 1 FROM combat_participants
        WHERE combatant_id = :id AND current_hit_points > :maximumHitPoints
        AND NVL(additional_hit_points, 0) + current_hit_points - :maximumHitPoints > :safeMaximum
        FETCH FIRST 1 ROW ONLY`, { id, maximumHitPoints: input.maximumHitPoints, safeMaximum: Number.MAX_SAFE_INTEGER });
      if (overflow.rows?.length) {
        await connection.rollback();
        return 'health-overflow';
      }
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
      await removeParticipations(connection, { sheetId: id });
      const result = await connection.execute(`DELETE FROM combatants WHERE id = :id AND user_id = (SELECT id FROM app_users WHERE firebase_uid = :firebaseUid)`, { firebaseUid: identity.uid, id });
      await connection.commit();
      return !!result.rowsAffected;
    } catch (error) { await connection.rollback(); throw error; } finally { await connection.close(); }
  },
};
