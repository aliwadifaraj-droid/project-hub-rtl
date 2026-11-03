// Turso repository for `teachers_market` (profiles) and `teachers` (login).
import { db, rowsToObjects } from "./db";

// Ensure the teachers login table exists (idempotent).
db.execute(`
  CREATE TABLE IF NOT EXISTS teachers (
    id            TEXT PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  )
`).catch(() => undefined);

db.execute(`
  CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email)
`).catch(() => undefined);

export type TeacherMarketRow = {
  id: string;
  full_name: string;
  phone: string;
  city: string;
  profession: string;
  email: string;
  status: string; // active | banned
  created_at: string;
};

export type TeacherLoginRow = {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
};

function decodeTeacher(r: any): TeacherMarketRow {
  return {
    id: String(r.id),
    full_name: String(r.full_name ?? ""),
    phone: String(r.phone ?? ""),
    city: String(r.city ?? ""),
    profession: String(r.profession ?? ""),
    email: String(r.email ?? ""),
    status: String(r.status ?? "active"),
    created_at: String(r.created_at ?? ""),
  };
}

const MARKET_COLS =
  "id,full_name,phone,city,profession,email,status,created_at";

export async function listAllTeachers(): Promise<TeacherMarketRow[]> {
  const r = await db.execute(
    `SELECT ${MARKET_COLS} FROM teachers_market ORDER BY created_at DESC LIMIT 500`,
  );
  return rowsToObjects(r).map(decodeTeacher);
}

export async function listActiveTeachers(): Promise<TeacherMarketRow[]> {
  const r = await db.execute(
    `SELECT ${MARKET_COLS} FROM teachers_market WHERE status = 'active' ORDER BY created_at DESC LIMIT 500`,
  );
  return rowsToObjects(r).map(decodeTeacher);
}

export async function getTeacherById(id: string): Promise<TeacherMarketRow | null> {
  const r = await db.execute(
    `SELECT ${MARKET_COLS} FROM teachers_market WHERE id = ? LIMIT 1`,
    [id],
  );
  const rows = rowsToObjects(r);
  return rows[0] ? decodeTeacher(rows[0]) : null;
}

export async function findTeacherByEmail(email: string): Promise<TeacherMarketRow | null> {
  const r = await db.execute(
    `SELECT ${MARKET_COLS} FROM teachers_market WHERE lower(email) = lower(?) LIMIT 1`,
    [email],
  );
  const rows = rowsToObjects(r);
  return rows[0] ? decodeTeacher(rows[0]) : null;
}

export async function insertTeacher(input: {
  full_name: string;
  phone: string;
  city: string;
  profession: string;
  email: string;
}): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute(
    `INSERT INTO teachers_market (id,full_name,phone,city,profession,email,status,created_at)
     VALUES (?,?,?,?,?,?,?,?)`,
    [id, input.full_name, input.phone, input.city, input.profession, input.email, "active", now],
  );
  return id;
}

export async function updateTeacherStatus(id: string, status: string): Promise<void> {
  await db.execute(`UPDATE teachers_market SET status = ? WHERE id = ?`, [status, id]);
}

export async function deleteTeacher(id: string): Promise<void> {
  await db.execute(`DELETE FROM teachers_market WHERE id = ?`, [id]);
}

// ---- teachers login table ----

export async function findLoginByEmail(email: string): Promise<TeacherLoginRow | null> {
  const r = await db.execute(
    `SELECT id,email,password_hash,created_at FROM teachers WHERE lower(email) = lower(?) LIMIT 1`,
    [email],
  );
  const rows = rowsToObjects(r);
  if (!rows[0]) return null;
  const x = rows[0] as any;
  return {
    id: String(x.id),
    email: String(x.email ?? ""),
    password_hash: String(x.password_hash ?? ""),
    created_at: String(x.created_at ?? ""),
  };
}

export async function insertLogin(email: string, passwordHash: string): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute(
    `INSERT INTO teachers (id,email,password_hash,created_at) VALUES (?,?,?,?)`,
    [id, email.toLowerCase(), passwordHash, now],
  );
  return id;
}

export async function deleteLoginByEmail(email: string): Promise<void> {
  await db.execute(`DELETE FROM teachers WHERE lower(email) = lower(?)`, [email]);
}
