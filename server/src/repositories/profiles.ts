import oracledb from 'oracledb';
import type { Identity, Profile, ProfileInput, Profiles } from '../models/profile.js';

type Row = { ID: number; EMAIL: string | null; DISPLAY_NAME: string | null; NICKNAME: string; BIRTH_DATE: string };
function map(row: Row): Profile { return { id: row.ID, email: row.EMAIL, displayName: row.DISPLAY_NAME, nickname: row.NICKNAME, birthDate: row.BIRTH_DATE }; }
async function connect() {
  return oracledb.getConnection({ user: process.env.ORACLE_USER, password: process.env.ORACLE_PASSWORD, connectString: process.env.ORACLE_CONNECT_STRING });
}
async function select(connection: oracledb.Connection, uid: string): Promise<Profile | null> {
  const result = await connection.execute<Row>(`SELECT id, email, display_name, nickname, TO_CHAR(birth_date, 'YYYY-MM-DD') AS birth_date FROM app_users WHERE firebase_uid = :firebaseUid`, { firebaseUid: uid }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
  return result.rows?.[0] ? map(result.rows[0]) : null;
}
function conflict(error: unknown): never {
  if (typeof error === 'object' && error !== null && 'errorNum' in error && error.errorNum === 1) throw Object.assign(new Error('Profile conflict'), { code: 'PROFILE_CONFLICT' });
  throw error;
}
export const profiles: Profiles = {
  async find(identity) {
    const connection = await connect();
    try {
      const profile = await select(connection, identity.uid);
      if (profile) {
        await connection.execute('UPDATE app_users SET email = :email, display_name = :displayName WHERE firebase_uid = :firebaseUid', { email: identity.email ?? null, displayName: identity.name ?? null, firebaseUid: identity.uid }, { autoCommit: true });
        return { ...profile, email: identity.email ?? null, displayName: identity.name ?? null };
      }
      return null;
    } finally { await connection.close(); }
  },
  async create(identity, input) {
    const connection = await connect();
    try {
      await connection.execute(`INSERT INTO app_users (firebase_uid, email, display_name, nickname, birth_date) VALUES (:firebaseUid, :email, :displayName, :nickname, TO_DATE(:birthDate, 'YYYY-MM-DD'))`, { firebaseUid: identity.uid, email: identity.email ?? null, displayName: identity.name ?? null, ...input }, { autoCommit: true });
      return (await select(connection, identity.uid))!;
    } catch (error) { return conflict(error); } finally { await connection.close(); }
  },
  async update(identity, input) {
    const connection = await connect();
    try {
      await connection.execute(`UPDATE app_users SET nickname = :nickname, birth_date = TO_DATE(:birthDate, 'YYYY-MM-DD'), updated_at = SYSTIMESTAMP WHERE firebase_uid = :firebaseUid`, { ...input, firebaseUid: identity.uid }, { autoCommit: true });
      return await select(connection, identity.uid);
    } catch (error) { return conflict(error); } finally { await connection.close(); }
  },
};
