import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "./auth-middleware.server";
import { db, rowsToObjects } from "./db";

let tableReady: Promise<void> | null = null;

async function ensureTable(): Promise<void> {
  if (!tableReady) {
    tableReady = db
      .execute(
        `CREATE TABLE IF NOT EXISTS teacher_chat_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          teacher_email TEXT NOT NULL,
          sender TEXT NOT NULL CHECK (sender IN ('teacher', 'admin')),
          body TEXT NOT NULL,
          read INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
      )
      .then(() => undefined)
      .catch((error) => {
        tableReady = null;
        throw error;
      });
  }
  await tableReady;
}

export const getTotalUnreadTeacherChatMessages = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    await ensureTable();
    const result = await db.execute(
      `SELECT COUNT(*) AS count FROM teacher_chat_messages WHERE sender = 'teacher' AND read = 0`,
    );
    const rows = rowsToObjects<{ count: number }>(result);
    return Number(rows[0]?.count ?? 0);
  });
