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
      const result = await connection.execute(`UPDATE combatants SET name = :name, type = :type, character_id = :characterId, maximum_hit_points = :maximumHitPoints, armor_class = :armorClass, updated_at = SYSTIMESTAMP WHERE id = :id AND user_id = (SELECT id FROM app_users WHERE firebase_uid = :firebaseUid)`, { firebaseUid: identity.uid, id, ...input }, { autoCommit: true });
      return result.rowsAffected ? { id, ...input } : null;
    } finally { await connection.close(); }
  },
  async delete(identity, id) {
    const connection = await getOracleConnection();
    try {
      const result = await connection.execute(`DELETE FROM combatants WHERE id = :id AND user_id = (SELECT id FROM app_users WHERE firebase_uid = :firebaseUid)`, { firebaseUid: identity.uid, id }, { autoCommit: true });
      return !!result.rowsAffected;
    } finally { await connection.close(); }
  },
};
