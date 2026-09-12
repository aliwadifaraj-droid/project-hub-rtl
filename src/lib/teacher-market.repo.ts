import { db, rowsToObjects } from "./db";

export type TeacherMarketRow = {
  id: number;
  name: string;
  email: string;
  city: string;
  phone: string;
  cv: string | null;
  password: string | null;
  entry_date: string;
  exit_date: string | null;
  status: string;
};

function decode(row: any): TeacherMarketRow {
  return {
    id: Number(row.id),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    city: String(row.city ?? ""),
    phone: String(row.phone ?? ""),
    cv: row.cv ?? null,
    password: row.password ?? null,
    entry_date: String(row.entry_date ?? ""),
    exit_date: row.exit_date ?? null,
    status: String(row.status ?? "active"),
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
