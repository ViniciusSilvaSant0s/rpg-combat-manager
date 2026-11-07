import oracledb from 'oracledb';
import { measureProfileStep } from '../profile-timing.js';
import { getOracleConnection } from '../oracle-pool.js';
import type { Identity, Profile, ProfileInput, Profiles } from '../models/profile.js';

type Row = { ID: number; EMAIL: string | null; DISPLAY_NAME: string | null; NICKNAME: string; BIRTH_DATE: string };
function map(row: Row): Profile { return { id: row.ID, email: row.EMAIL, displayName: row.DISPLAY_NAME, nickname: row.NICKNAME, birthDate: row.BIRTH_DATE }; }
async function connect() {
  return measureProfileStep('db.connect', () => getOracleConnection());
}
async function select(connection: oracledb.Connection, uid: string): Promise<Profile | null> {
  const result = await measureProfileStep('db.select', () => connection.execute<Row>(`SELECT id, email, display_name, nickname, TO_CHAR(birth_date, 'YYYY-MM-DD') AS birth_date FROM app_users WHERE firebase_uid = :firebaseUid`, { firebaseUid: uid }, { outFormat: oracledb.OUT_FORMAT_OBJECT }));
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
        await measureProfileStep('db.sync', () => connection.execute('UPDATE app_users SET email = :email, display_name = :displayName WHERE firebase_uid = :firebaseUid', { email: identity.email ?? null, displayName: identity.name ?? null, firebaseUid: identity.uid }, { autoCommit: true }));
        return { ...profile, email: identity.email ?? null, displayName: identity.name ?? null };
      }
      return null;
    } finally { await measureProfileStep('db.close', () => connection.close()); }
  },
  async create(identity, input) {
    const connection = await connect();
    try {
      await measureProfileStep('db.insert', () => connection.execute(`INSERT INTO app_users (firebase_uid, email, display_name, nickname, birth_date) VALUES (:firebaseUid, :email, :displayName, :nickname, TO_DATE(:birthDate, 'YYYY-MM-DD'))`, { firebaseUid: identity.uid, email: identity.email ?? null, displayName: identity.name ?? null, ...input }, { autoCommit: true }));
      return (await select(connection, identity.uid))!;
    } catch (error) { return conflict(error); } finally { await measureProfileStep('db.close', () => connection.close()); }
  },
  async update(identity, input) {
    const connection = await connect();
    try {
      const assignments: string[] = [];
      const binds: oracledb.BindParameters = {
        firebaseUid: identity.uid,
        outId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        outEmail: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 1280 },
        outName: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 1020 },
        outNickname: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 80 },
        outBirthDate: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 10 },
      };
      if (input.nickname !== undefined) { assignments.push('nickname = :nickname'); binds.nickname = input.nickname; }
      if (input.birthDate !== undefined) { assignments.push("birth_date = TO_DATE(:birthDate, 'YYYY-MM-DD')"); binds.birthDate = input.birthDate; }
      if (!assignments.length) throw new Error('Empty profile update');
      assignments.push('updated_at = SYSTIMESTAMP');
      const result = await measureProfileStep('db.update', () => connection.execute(
        `UPDATE app_users SET ${assignments.join(', ')} WHERE firebase_uid = :firebaseUid RETURNING id, email, display_name, nickname, TO_CHAR(birth_date, 'YYYY-MM-DD') INTO :outId, :outEmail, :outName, :outNickname, :outBirthDate`,
        binds, { autoCommit: true },
      ));
      if (!result.rowsAffected) return null;
      const out = result.outBinds as { outId: number[]; outEmail: (string | null)[]; outName: (string | null)[]; outNickname: string[]; outBirthDate: string[] };
      return { id: out.outId[0], email: out.outEmail[0], displayName: out.outName[0], nickname: out.outNickname[0], birthDate: out.outBirthDate[0] };
    } catch (error) { return conflict(error); } finally { await measureProfileStep('db.close', () => connection.close()); }
  },
};
