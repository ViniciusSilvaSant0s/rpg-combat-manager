import oracledb from 'oracledb';
import { getOracleConnection } from '../oracle-pool.js';
import type { Friendships, FriendshipList, Pair } from '../models/friendship.js';
import { removeParticipations } from './participations.js';

const objects = { outFormat: oracledb.OUT_FORMAT_OBJECT };
export const friendships: Friendships = {
  async search(identity, nickname) {
    const connection = await getOracleConnection();
    try {
      const result = await connection.execute<{ ID: number; NICKNAME: string }>(`
        SELECT other.id, other.nickname FROM app_users other
        WHERE LOWER(other.nickname) = LOWER(:nickname) AND EXISTS (
          SELECT 1 FROM app_users actor WHERE actor.firebase_uid = :firebaseUid AND actor.id <> other.id
        )`, { nickname, firebaseUid: identity.uid }, objects);
      const row = result.rows?.[0];
      return row ? { id: row.ID, nickname: row.NICKNAME } : null;
    } finally { await connection.close(); }
  },
  async list(identity) {
    const connection = await getOracleConnection();
    try {
      const result = await connection.execute<{ ID: number | null; NICKNAME: string; CATEGORY: keyof FriendshipList }>(`
        SELECT other.id, other.nickname, CASE WHEN f.status = 'accepted' THEN 'friends'
          WHEN f.sender_id = actor.id THEN 'sent' ELSE 'received' END AS category
        FROM app_users actor LEFT JOIN friendships f ON actor.id IN (f.low_id, f.high_id)
        LEFT JOIN app_users other ON other.id = CASE WHEN actor.id = f.low_id THEN f.high_id ELSE f.low_id END
        WHERE actor.firebase_uid = :firebaseUid ORDER BY LOWER(other.nickname), other.id`, { firebaseUid: identity.uid }, objects);
      if (!result.rows?.length) return null;
      const list: FriendshipList = { friends: [], received: [], sent: [] };
      for (const row of result.rows) {
        if (row.ID !== null) list[row.CATEGORY].push({ id: row.ID, nickname: row.NICKNAME });
      }
      return list;
    } finally { await connection.close(); }
  },
  async change(identity, targetId, decide) {
    const connection = await getOracleConnection();
    try {
      const profiles = await connection.execute<{ ID: number; IS_ACTOR: number }>(`
        SELECT id, CASE WHEN firebase_uid = :firebaseUid THEN 1 ELSE 0 END AS is_actor FROM app_users
        WHERE firebase_uid = :firebaseUid OR id = :targetId ORDER BY id FOR UPDATE`, { firebaseUid: identity.uid, targetId }, objects);
      const actor = profiles.rows?.find(row => row.IS_ACTOR === 1);
      if (!actor || !profiles.rows?.some(row => row.ID === targetId)) return 'missing';
      const pair = { lowId: Math.min(actor.ID, targetId), highId: Math.max(actor.ID, targetId) };
      const where = 'low_id = :lowId AND high_id = :highId';
      const existing = await connection.execute<{ SENDER_ID: number; STATUS: Pair['status'] }>(
        `SELECT sender_id, status FROM friendships WHERE ${where}`, pair, objects);
      const row = existing.rows?.[0];
      const decision = decide(actor.ID, row ? { senderId: row.SENDER_ID, status: row.STATUS } : null);
      switch (decision) {
        case 'insert':
          await connection.execute(`INSERT INTO friendships (low_id, high_id, sender_id, status)
            VALUES (:lowId, :highId, :senderId, 'pending')`, { ...pair, senderId: actor.ID });
          break;
        case 'accept':
          await connection.execute(`UPDATE friendships SET status = 'accepted' WHERE ${where}`, pair);
          break;
        case 'unfriend':
        case 'delete':
          if (decision === 'unfriend') await removeParticipations(connection, pair);
          await connection.execute(`DELETE FROM friendships WHERE ${where}`, pair);
          break;
        default: return decision;
      }
      await connection.commit();
      return 'ok';
    } catch (error) { await connection.rollback(); throw error; } finally { await connection.close(); }
  },
};

export function accessibleSheet(actor: string, sheet: string) {
  return `(${sheet}.user_id = ${actor}.id OR EXISTS (
    SELECT 1 FROM friendships f WHERE f.status = 'accepted'
      AND f.low_id = LEAST(${actor}.id, ${sheet}.user_id)
      AND f.high_id = GREATEST(${actor}.id, ${sheet}.user_id)
  ))`;
}
