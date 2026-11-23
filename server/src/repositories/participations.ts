import oracledb from 'oracledb';

const objects = { outFormat: oracledb.OUT_FORMAT_OBJECT };
type Removal = { sheetId: number } | { lowId: number; highId: number };

export async function removeParticipations(connection: oracledb.Connection, scope: Removal) {
  const predicate = 'sheetId' in scope ? 's.id = :sheetId' : `
    ((c.user_id = :lowId AND s.user_id = :highId) OR (c.user_id = :highId AND s.user_id = :lowId))`;
  const affected = await connection.execute<{ ID: number }>(`
    SELECT c.id FROM combats c WHERE EXISTS (
      SELECT 1 FROM combat_participants p JOIN combatants s ON s.id = p.combatant_id
      WHERE p.combat_id = c.id AND ${predicate}
    ) ORDER BY c.id FOR UPDATE OF c.version`, scope, objects);
  for (const combat of affected.rows ?? []) {
    const binds = { ...scope, combatId: combat.ID };
    const entries = await connection.execute<{ ID: number; REMOVED: number; CURRENT_PARTICIPANT_ID: number | null }>(`
      SELECT p.id, c.current_participant_id, CASE WHEN ${predicate} THEN 1 ELSE 0 END AS removed
      FROM combat_participants p JOIN combats c ON c.id = p.combat_id
      JOIN combatants s ON s.id = p.combatant_id WHERE c.id = :combatId
      ORDER BY CASE p.natural_initiative WHEN 20 THEN 0 WHEN 1 THEN 2 ELSE 1 END,
        p.initiative DESC NULLS LAST, p.position, p.id`, binds, objects);
    const rows = entries.rows ?? [];
    if (!rows.some(p => p.REMOVED === 1)) continue;
    let next = rows[0].CURRENT_PARTICIPANT_ID;
    const current = rows.findIndex(p => p.ID === next);
    if (current >= 0 && rows[current].REMOVED) {
      next = [...rows.slice(current + 1), ...rows.slice(0, current)].find(p => !p.REMOVED)?.ID ?? null;
    }
    await connection.execute(`UPDATE combats SET current_participant_id = :nextId, version = version + 1,
      updated_at = SYSTIMESTAMP WHERE id = :combatId`, { nextId: next, combatId: combat.ID });
    await connection.execute(`DELETE FROM combat_participants WHERE combat_id = :combatId AND combatant_id IN (
      SELECT s.id FROM combatants s CROSS JOIN combats c WHERE c.id = :combatId AND ${predicate}
    )`, binds);
  }
}
