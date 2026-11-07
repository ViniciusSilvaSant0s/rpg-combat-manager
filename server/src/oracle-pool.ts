import oracledb from 'oracledb';

let poolPromise: Promise<oracledb.Pool> | undefined;

export function initializeOraclePool(): Promise<oracledb.Pool> {
  if (!poolPromise) {
    poolPromise = oracledb.createPool({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONNECT_STRING,
      poolMin: 1,
      poolMax: 4,
      poolIncrement: 1,
    }).catch(error => { poolPromise = undefined; throw error; });
  }
  return poolPromise;
}

export async function getOracleConnection(): Promise<oracledb.Connection> {
  return (await initializeOraclePool()).getConnection();
}

export async function closeOraclePool(): Promise<void> {
  if (!poolPromise) return;
  const current = poolPromise;
  try { await (await current).close(10); }
  finally { if (poolPromise === current) poolPromise = undefined; }
}
