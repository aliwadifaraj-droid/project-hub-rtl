// Turso repository for the existing teachers_market table and teachers login table.
import { db, rowsToObjects } from "./db";

const TEACHER_LOGIN_TABLE = `
  CREATE TABLE IF NOT EXISTS teachers (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`;

type RawRow = Record<string, unknown>;

async function marketColumns(): Promise<Map<string, string>> {
  const result = await db.execute("PRAGMA table_info(teachers_market)");
  return new Map(
    rowsToObjects<RawRow>(result).map((row): [string, string] => [String(row.name), String(row.type ?? "")]),
  );
}

async function loginColumns(): Promise<Set<string>> {
  await db.execute(TEACHER_LOGIN_TABLE);
  const result = await db.execute("PRAGMA table_info(teachers)");
  return new Set(rowsToObjects<RawRow>(result).map((row) => String(row.name)));
}

async function ensureMarketStatus(): Promise<void> {
  const columns = await marketColumns();
  if (!columns.has("status")) {
    await db.execute("ALTER TABLE teachers_market ADD COLUMN status TEXT NOT NULL DEFAULT 'active'");
  }
}

function firstColumn(columns: { has(name: string): boolean }, names: string[]): string | null {
  return names.find((name) => columns.has(name)) ?? null;
}

function value(row: RawRow, names: string[], fallback = ""): string {
  const key = names.find((name) => row[name] !== undefined && row[name] !== null);
  return key ? String(row[key]) : fallback;
}

export type TeacherMarketRow = {
  id: string;
  full_name: string;
  phone: string;
  city: string;
  profession: string;
  email: string;
  status: string;
  created_at: string;
};

export type TeacherLoginRow = {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
};

function decodeTeacher(row: RawRow): TeacherMarketRow {
  return {
    id: value(row, ["id", "uuid", "teacher_id"]),
    full_name: value(row, ["full_name", "name", "teacher_name", "fullName"]),
    phone: value(row, ["phone", "phone_number", "mobile", "mobile_number"]),
    city: value(row, ["city", "location", "region"]),
    profession: value(row, ["profession", "job", "occupation", "specialty"]),
    email: value(row, ["email", "email_address"]),
    status: value(row, ["status"], "active"),
    created_at: value(row, ["created_at", "registered_at", "createdAt"]),
  };
}

export async function listAllTeachers(): Promise<TeacherMarketRow[]> {
  await ensureMarketStatus();
  const result = await db.execute("SELECT * FROM teachers_market ORDER BY rowid DESC LIMIT 500");
  return rowsToObjects<RawRow>(result).map(decodeTeacher);
}

export async function getTeacherById(id: string): Promise<TeacherMarketRow | null> {
  await ensureMarketStatus();
  const columns = await marketColumns();
  const idColumn = firstColumn(columns, ["id", "uuid", "teacher_id"]);
  if (!idColumn) return null;
  const result = await db.execute(`SELECT * FROM teachers_market WHERE ${idColumn} = ? LIMIT 1`, [id]);
  const rows = rowsToObjects<RawRow>(result);
  return rows[0] ? decodeTeacher(rows[0]) : null;
}

export async function findTeacherByEmail(email: string): Promise<TeacherMarketRow | null> {
  await ensureMarketStatus();
  const columns = await marketColumns();
  const emailColumn = firstColumn(columns, ["email", "email_address"]);
  if (!emailColumn) return null;
  const result = await db.execute(
    `SELECT * FROM teachers_market WHERE lower(${emailColumn}) = lower(?) LIMIT 1`,
    [email],
  );
  const rows = rowsToObjects<RawRow>(result);
  return rows[0] ? decodeTeacher(rows[0]) : null;
}

export async function insertTeacher(input: {
  full_name: string;
  phone: string;
  city: string;
  profession: string;
  email: string;
}): Promise<string> {
  await ensureMarketStatus();
  const columns = await marketColumns();
  const idColumn = firstColumn(columns, ["id", "uuid", "teacher_id"]);
  const nameColumn = firstColumn(columns, ["full_name", "name", "teacher_name", "fullName"]);
  const phoneColumn = firstColumn(columns, ["phone", "phone_number", "mobile", "mobile_number"]);
  const cityColumn = firstColumn(columns, ["city", "location", "region"]);
  const professionColumn = firstColumn(columns, ["profession", "job", "occupation", "specialty"]);
  const emailColumn = firstColumn(columns, ["email", "email_address"]);
  if (!idColumn || !nameColumn || !phoneColumn || !cityColumn || !professionColumn || !emailColumn) {
    throw new Error("أعمدة جدول المعلمين الحالية لا تطابق نموذج التسجيل");
  }

  const idIsInteger = (columns.get(idColumn) ?? "").toUpperCase() === "INTEGER";
  const id = crypto.randomUUID();
  const createdColumn = firstColumn(columns, ["created_at", "registered_at", "createdAt"]);
  const insertColumns = [nameColumn, phoneColumn, cityColumn, professionColumn, emailColumn, "status"];
  const values: unknown[] = [input.full_name, input.phone, input.city, input.profession, input.email, "active"];
  if (!idIsInteger) {
    insertColumns.unshift(idColumn);
    values.unshift(id);
  }
  if (createdColumn) {
    insertColumns.push(createdColumn);
    values.push(new Date().toISOString());
  }
  const result = await db.execute(
    `INSERT INTO teachers_market (${insertColumns.join(",")}) VALUES (${insertColumns.map(() => "?").join(",")})`,
    values,
  );
  return idIsInteger ? String(result.lastInsertRowid) : id;
}

export async function updateTeacherStatus(id: string, status: string): Promise<void> {
  await ensureMarketStatus();
  const columns = await marketColumns();
  const idColumn = firstColumn(columns, ["id", "uuid", "teacher_id"]);
  if (!idColumn) throw new Error("معرّف جدول المعلمين غير موجود");
  await db.execute(`UPDATE teachers_market SET status = ? WHERE ${idColumn} = ?`, [status, id]);
}

export async function deleteTeacher(id: string): Promise<void> {
  const columns = await marketColumns();
  const idColumn = firstColumn(columns, ["id", "uuid", "teacher_id"]);
  if (!idColumn) throw new Error("معرّف جدول المعلمين غير موجود");
  await db.execute(`DELETE FROM teachers_market WHERE ${idColumn} = ?`, [id]);
}

export async function findLoginByEmail(email: string): Promise<TeacherLoginRow | null> {
  const columns = await loginColumns();
  const emailColumn = firstColumn(columns, ["email", "email_address"]);
  const passwordColumn = firstColumn(columns, ["password_hash", "password", "encrypted_password"]);
  if (!emailColumn || !passwordColumn) return null;
  const result = await db.execute(`SELECT * FROM teachers WHERE lower(${emailColumn}) = lower(?) LIMIT 1`, [email]);
  const rows = rowsToObjects<RawRow>(result);
  if (!rows[0]) return null;
  return {
    id: value(rows[0], ["id", "teacher_id"]),
    email: value(rows[0], [emailColumn]),
    password_hash: value(rows[0], [passwordColumn]),
    created_at: value(rows[0], ["created_at", "registered_at"]),
  };
}

export async function insertLogin(email: string, passwordHash: string): Promise<string> {
  const columns = await loginColumns();
  const idColumn = firstColumn(columns, ["id", "teacher_id"]);
  const emailColumn = firstColumn(columns, ["email", "email_address"]);
  const passwordColumn = firstColumn(columns, ["password_hash", "password", "encrypted_password"]);
  if (!idColumn || !emailColumn || !passwordColumn) throw new Error("جدول تسجيل دخول المعلمين غير مكتمل");
  const id = crypto.randomUUID();
  const createdColumn = firstColumn(columns, ["created_at", "registered_at"]);
  const insertColumns = [idColumn, emailColumn, passwordColumn];
  const values: unknown[] = [id, email.toLowerCase(), passwordHash];
  if (createdColumn) {
    insertColumns.push(createdColumn);
    values.push(new Date().toISOString());
  }
  await db.execute(
    `INSERT INTO teachers (${insertColumns.join(",")}) VALUES (${insertColumns.map(() => "?").join(",")})`,
    values,
  );
  return id;
}

export async function deleteLoginByEmail(email: string): Promise<void> {
  const columns = await loginColumns();
  const emailColumn = firstColumn(columns, ["email", "email_address"]);
  if (emailColumn) await db.execute(`DELETE FROM teachers WHERE lower(${emailColumn}) = lower(?)`, [email]);
}
