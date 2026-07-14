import { db, rowsToObjects } from "./db";

export type TeamMessageRow = {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
};

function decode(row: any): TeamMessageRow {
  return {
    id: String(row.id),
    user_id: String(row.user_id ?? row.author_id ?? ""),
    body: String(row.body ?? ""),
    created_at: String(row.created_at ?? ""),
  };
}

export async function listTeamMessages(limit = 500): Promise<TeamMessageRow[]> {
  const r = await db.execute(
    `SELECT id, author_id AS user_id, body, created_at FROM team_messages ORDER BY created_at ASC LIMIT ?`,
    [limit],
  );
  return rowsToObjects(r).map(decode);
}

export async function insertTeamMessage(userId: string, body: string): Promise<void> {
  await db.execute(
    `INSERT INTO team_messages (id, author_id, body, created_at) VALUES (?, ?, ?, ?)`,
    [crypto.randomUUID(), userId, body, new Date().toISOString()],
  );
}

export async function deleteTeamMessage(id: string, userId?: string): Promise<void> {
  if (userId) await db.execute(`DELETE FROM team_messages WHERE id = ? AND author_id = ?`, [id, userId]);
  else await db.execute(`DELETE FROM team_messages WHERE id = ?`, [id]);
}

export async function countUnreadTeamMessages(userId: string, since: string | null): Promise<number> {
  const where = since
    ? `WHERE author_id <> ? AND created_at > ?`
    : `WHERE author_id <> ?`;
  const args = since ? [userId, since] : [userId];
  const r = await db.execute(`SELECT COUNT(*) AS c FROM team_messages ${where}`, args);
  return Number(rowsToObjects<{ c: number }>(r)[0]?.c ?? 0);
}

export async function deleteAllTeamMessages(): Promise<void> {
  await db.execute(`DELETE FROM team_messages`);
}