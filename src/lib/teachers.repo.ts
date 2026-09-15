// Turso repository for teachers marketplace (حراج المعلمين).
// Server-only. Tables: teachers_market, teacher_offers, teacher_chat_messages, teacher_notifications.
import { db, rowsToObjects } from "./db";

export type TeacherRow = {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  city: string;
  profession: string;
  subscription_plan: string | null;
  subscription_status: string;
  subscription_starts_at: string | null;
  subscription_expires_at: string | null;
  created_at: string;
};

export type TeacherOfferRow = {
  id: string;
  teacher_id: string;
  project_title: string;
  amount: string;
  description: string;
  status: string;
  created_at: string;
};

export type TeacherNotificationRow = {
  id: string;
  teacher_id: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
};

function decodeTeacher(r: any): TeacherRow {
  return {
    id: String(r.id),
    full_name: String(r.full_name ?? ""),
    email: String(r.email ?? ""),
    password_hash: String(r.password_hash ?? ""),
    city: String(r.city ?? ""),
    profession: String(r.profession ?? ""),
    subscription_plan: r.subscription_plan ?? null,
    subscription_status: String(r.subscription_status ?? "inactive"),
    subscription_starts_at: r.subscription_starts_at ?? null,
    subscription_expires_at: r.subscription_expires_at ?? null,
    created_at: String(r.created_at ?? ""),
  };
}

export async function findTeacherByEmail(email: string): Promise<TeacherRow | null> {
  const r = await db.execute(
    "SELECT * FROM teachers_market WHERE lower(email) = lower(?) LIMIT 1",
    [email],
  );
  const rows = rowsToObjects(r);
  return rows[0] ? decodeTeacher(rows[0]) : null;
}

export async function findTeacherById(id: string): Promise<TeacherRow | null> {
  const r = await db.execute(
    "SELECT * FROM teachers_market WHERE id = ? LIMIT 1",
    [id],
  );
  const rows = rowsToObjects(r);
  return rows[0] ? decodeTeacher(rows[0]) : null;
}

export async function createTeacher(data: {
  full_name: string;
  email: string;
  password_hash: string;
  city: string;
  profession: string;
}): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute(
    `INSERT INTO teachers_market (id, full_name, email, password_hash, city, profession, subscription_status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'inactive', ?)`,
    [id, data.full_name, data.email.toLowerCase(), data.password_hash, data.city, data.profession, now],
  );
  return id;
}

export async function listAllTeachers(): Promise<TeacherRow[]> {
  const r = await db.execute(
    "SELECT * FROM teachers_market ORDER BY created_at DESC",
  );
  return rowsToObjects(r).map(decodeTeacher);
}

export async function updateTeacherSubscription(
  teacherId: string,
  plan: string,
  startsAt: string,
  expiresAt: string,
): Promise<void> {
  await db.execute(
    `UPDATE teachers_market
     SET subscription_plan = ?, subscription_status = 'active',
         subscription_starts_at = ?, subscription_expires_at = ?
     WHERE id = ?`,
    [plan, startsAt, expiresAt, teacherId],
  );
}

export async function createTeacherNotification(
  teacherId: string,
  title: string,
  body: string,
): Promise<void> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute(
    "INSERT INTO teacher_notifications (id, teacher_id, title, body, read, created_at) VALUES (?, ?, ?, ?, 0, ?)",
    [id, teacherId, title, body, now],
  );
}

export async function listTeacherNotifications(teacherId: string): Promise<TeacherNotificationRow[]> {
  const r = await db.execute(
    "SELECT id, teacher_id, title, body, read, created_at FROM teacher_notifications WHERE teacher_id = ? ORDER BY created_at DESC LIMIT 50",
    [teacherId],
  );
  return rowsToObjects(r).map((x: any) => ({
    id: String(x.id),
    teacher_id: String(x.teacher_id),
    title: String(x.title ?? ""),
    body: String(x.body ?? ""),
    read: Number(x.read) === 1,
    created_at: String(x.created_at ?? ""),
  }));
}

export async function countUnreadTeacherNotifications(teacherId: string): Promise<number> {
  const r = await db.execute(
    "SELECT COUNT(*) AS c FROM teacher_notifications WHERE teacher_id = ? AND read = 0",
    [teacherId],
  );
  const rows = rowsToObjects<{ c: number }>(r);
  return Number(rows[0]?.c ?? 0);
}

export async function markAllTeacherNotificationsRead(teacherId: string): Promise<void> {
  await db.execute(
    "UPDATE teacher_notifications SET read = 1 WHERE teacher_id = ?",
    [teacherId],
  );
}

export async function createTeacherOffer(data: {
  teacher_id: string;
  project_title: string;
  amount: string;
  description: string;
}): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute(
    `INSERT INTO teacher_offers (id, teacher_id, project_title, amount, description, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
    [id, data.teacher_id, data.project_title, data.amount, data.description, now],
  );
  return id;
}

export async function listTeacherOffers(teacherId: string): Promise<TeacherOfferRow[]> {
  const r = await db.execute(
    "SELECT id, teacher_id, project_title, amount, description, status, created_at FROM teacher_offers WHERE teacher_id = ? ORDER BY created_at DESC LIMIT 50",
    [teacherId],
  );
  return rowsToObjects(r).map((x: any) => ({
    id: String(x.id),
    teacher_id: String(x.teacher_id),
    project_title: String(x.project_title ?? ""),
    amount: String(x.amount ?? ""),
    description: String(x.description ?? ""),
    status: String(x.status ?? "pending"),
    created_at: String(x.created_at ?? ""),
  }));
}

export async function listAllTeacherOffers(): Promise<TeacherOfferRow[]> {
  const r = await db.execute(
    "SELECT id, teacher_id, project_title, amount, description, status, created_at FROM teacher_offers ORDER BY created_at DESC",
  );
  return rowsToObjects(r).map((x: any) => ({
    id: String(x.id),
    teacher_id: String(x.teacher_id),
    project_title: String(x.project_title ?? ""),
    amount: String(x.amount ?? ""),
    description: String(x.description ?? ""),
    status: String(x.status ?? "pending"),
    created_at: String(x.created_at ?? ""),
  }));
}
