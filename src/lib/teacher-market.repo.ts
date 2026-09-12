import { db, rowsToObjects } from "./db";

db.execute(`ALTER TABLE teachers_market ADD COLUMN profession TEXT`).catch(() => undefined);

// Ensure unique constraints to prevent duplicate registrations at the DB level.
// These run once on startup; if duplicates already exist the CREATE will fail
// silently (caught) and the app-level checks in teacher-market.functions.ts
// remain the primary guard.
db.execute(
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_teachers_market_email ON teachers_market(LOWER(TRIM(email)))`
).catch(() => undefined);
db.execute(
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_teachers_market_phone ON teachers_market(LOWER(TRIM(phone)))`
).catch(() => undefined);
db.execute(
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_teachers_market_name ON teachers_market(LOWER(TRIM(name)))`
).catch(() => undefined);

export type TeacherMarketRow = {
  id: number;
  name: string;
  email: string;
  city: string;
  phone: string;
  profession: string;
  cv: string | null;
  password: string | null;
  entry_date: string;
  exit_date: string | null;
  status: string;
};

export type TeacherNotificationRow = {
  id: number;
  teacher_email: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
};

function decode(row: any): TeacherMarketRow {
  return {
    id: Number(row.id),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    city: String(row.city ?? ""),
    phone: String(row.phone ?? ""),
    profession: String(row.profession ?? ""),
    cv: row.cv ?? null,
    password: row.password ?? null,
    entry_date: String(row.entry_date ?? ""),
    exit_date: row.exit_date ?? null,
    status: String(row.status ?? "active"),
  };
}

function decodeNotification(row: any): TeacherNotificationRow {
  return {
    id: Number(row.id),
    teacher_email: String(row.teacher_email ?? ""),
    title: String(row.title ?? ""),
    body: row.body ?? null,
    read: Number(row.read) === 1,
    created_at: String(row.created_at ?? ""),
  };
}

export async function listTeachersMarket(): Promise<TeacherMarketRow[]> {
  const res = await db.execute(
    `SELECT * FROM teachers_market ORDER BY entry_date DESC`
  );
  return rowsToObjects<TeacherMarketRow>(res).map(decode);
}

export async function insertTeacherMarket(input: {
  name: string;
  email: string;
  city: string;
  phone: string;
  profession: string;
  cv: string | null;
  password: string | null;
}): Promise<number> {
  await db.execute(
    `INSERT INTO teachers_market (name, email, city, phone, cv, password) VALUES (?, ?, ?, ?, ?, ?)`,
    [input.name, input.email, input.city, input.phone, input.cv, input.password]
  );
  const res = await db.execute(`SELECT last_insert_rowid() as id`);
  const rows = rowsToObjects<{ id: number }>(res);
  return rows[0]?.id ?? 0;
}

export async function updateTeacherMarketStatus(
  id: number,
  status: string,
  exit_date: string | null
): Promise<void> {
  await db.execute(
    `UPDATE teachers_market SET status = ?, exit_date = ? WHERE id = ?`,
    [status, exit_date, id]
  );
}

export async function findTeacherMarketByEmail(
  email: string
): Promise<TeacherMarketRow | null> {
  const res = await db.execute(
    `SELECT * FROM teachers_market WHERE email = ? COLLATE NOCASE LIMIT 1`,
    [email]
  );
  const rows = rowsToObjects<TeacherMarketRow>(res).map(decode);
  return rows[0] ?? null;
}

export async function findTeacherMarketByPhone(
  phone: string
): Promise<TeacherMarketRow | null> {
  const res = await db.execute(
    `SELECT * FROM teachers_market WHERE phone = ? COLLATE NOCASE LIMIT 1`,
    [phone]
  );
  const rows = rowsToObjects<TeacherMarketRow>(res).map(decode);
  return rows[0] ?? null;
}

export async function findTeacherMarketByName(
  name: string
): Promise<TeacherMarketRow | null> {
  const res = await db.execute(
    `SELECT * FROM teachers_market WHERE name = ? COLLATE NOCASE LIMIT 1`,
    [name]
  );
  const rows = rowsToObjects<TeacherMarketRow>(res).map(decode);
  return rows[0] ?? null;
}

export async function getTeacherMarketById(
  id: number
): Promise<TeacherMarketRow | null> {
  const res = await db.execute(
    `SELECT * FROM teachers_market WHERE id = ? LIMIT 1`,
    [id]
  );
  const rows = rowsToObjects<TeacherMarketRow>(res).map(decode);
  return rows[0] ?? null;
}

// --- Teacher notifications ---

let _tnTableReady: Promise<void> | null = null;

async function ensureTeacherNotificationsTable(): Promise<void> {
  if (!_tnTableReady) {
    _tnTableReady = (async () => {
      await db.execute(
        `CREATE TABLE IF NOT EXISTS teacher_notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          teacher_email TEXT NOT NULL,
          title TEXT NOT NULL,
          body TEXT,
          read INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
      );
      await db.execute(
        `CREATE INDEX IF NOT EXISTS idx_teacher_notifications_email ON teacher_notifications(teacher_email)`
      );
    })().catch((e) => {
      _tnTableReady = null;
      throw e;
    });
  }
  return _tnTableReady;
}

export async function insertTeacherNotification(input: {
  teacher_email: string;
  title: string;
  body: string | null;
}): Promise<void> {
  await ensureTeacherNotificationsTable();
  await db.execute(
    `INSERT INTO teacher_notifications (teacher_email, title, body) VALUES (?, ?, ?)`,
    [input.teacher_email, input.title, input.body]
  );
}

export async function listTeacherNotifications(
  email: string,
  limit = 50
): Promise<TeacherNotificationRow[]> {
  await ensureTeacherNotificationsTable();
  const res = await db.execute(
    `SELECT * FROM teacher_notifications WHERE teacher_email = ? COLLATE NOCASE ORDER BY created_at DESC LIMIT ?`,
    [email, limit]
  );
  return rowsToObjects<TeacherNotificationRow>(res).map(decodeNotification);
}

export async function countUnreadTeacherNotifications(
  email: string
): Promise<number> {
  await ensureTeacherNotificationsTable();
  const res = await db.execute(
    `SELECT COUNT(*) AS c FROM teacher_notifications WHERE teacher_email = ? AND read = 0`,
    [email]
  );
  const rows = rowsToObjects<{ c: number }>(res);
  return Number(rows[0]?.c ?? 0);
}

export async function markTeacherNotificationRead(
  email: string,
  id: number
): Promise<void> {
  await ensureTeacherNotificationsTable();
  await db.execute(
    `UPDATE teacher_notifications SET read = 1 WHERE id = ? AND teacher_email = ?`,
    [id, email]
  );
}

export async function markAllTeacherNotificationsRead(
  email: string
): Promise<void> {
  await ensureTeacherNotificationsTable();
  await db.execute(
    `UPDATE teacher_notifications SET read = 1 WHERE teacher_email = ? AND read = 0`,
    [email]
  );
}
