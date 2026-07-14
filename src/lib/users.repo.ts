// Users, user_roles, profiles — all on Turso. Server-only.
import { db, rowsToObjects } from "./db";

export type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
};

export type UserWithRoles = {
  id: string;
  email: string;
  roles: string[];
  created_at: string;
};

function decodeUser(r: any): UserRow {
  return {
    id: String(r.id),
    email: String(r.email),
    password_hash: String(r.password_hash),
    created_at: String(r.created_at ?? ""),
  };
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const r = await db.execute(
    "SELECT id,email,password_hash,created_at FROM users WHERE lower(email) = lower(?) LIMIT 1",
    [email],
  );
  const rows = rowsToObjects(r);
  return rows[0] ? decodeUser(rows[0]) : null;
}

export async function findUserById(id: string): Promise<UserRow | null> {
  const r = await db.execute(
    "SELECT id,email,password_hash,created_at FROM users WHERE id = ? LIMIT 1",
    [id],
  );
  const rows = rowsToObjects(r);
  return rows[0] ? decodeUser(rows[0]) : null;
}

export async function createUser(email: string, passwordHash: string): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute(
    "INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)",
    [id, email, passwordHash, now],
  );
  // Create profile row
  await db.execute(
    "INSERT INTO profiles (id, user_id, created_at) VALUES (?, ?, ?)",
    [crypto.randomUUID(), id, now],
  );
  return id;
}

export async function updateUserPassword(id: string, passwordHash: string): Promise<void> {
  await db.execute("UPDATE users SET password_hash = ? WHERE id = ?", [passwordHash, id]);
}

export async function countUsers(): Promise<number> {
  const r = await db.execute("SELECT COUNT(*) AS c FROM users", []);
  const rows = rowsToObjects<{ c: number }>(r);
  return Number(rows[0]?.c ?? 0);
}

/* ---------- user_roles ---------- */

export async function getRolesForUser(userId: string): Promise<string[]> {
  const r = await db.execute(
    "SELECT role FROM user_roles WHERE user_id = ?",
    [userId],
  );
  return rowsToObjects<{ role: string }>(r).map((x) => String(x.role));
}

export async function hasRole(userId: string, role: string): Promise<boolean> {
  const roles = await getRolesForUser(userId);
  return roles.includes(role);
}

export async function grantRole(userId: string, role: string): Promise<void> {
  await db.execute(
    "INSERT OR IGNORE INTO user_roles (id, user_id, role, created_at) VALUES (?, ?, ?, ?)",
    [crypto.randomUUID(), userId, role, new Date().toISOString()],
  );
}

export async function revokeRole(userId: string, role: string): Promise<void> {
  await db.execute(
    "DELETE FROM user_roles WHERE user_id = ? AND role = ?",
    [userId, role],
  );
}

export async function listUsersWithRoles(limit = 200): Promise<UserWithRoles[]> {
  const r = await db.execute(
    `SELECT u.id, u.email, u.created_at,
            (SELECT group_concat(role, ',') FROM user_roles WHERE user_id = u.id) AS roles
     FROM users u ORDER BY u.created_at DESC LIMIT ?`,
    [limit],
  );
  return rowsToObjects<{ id: string; email: string; created_at: string; roles: string | null }>(r).map((x) => ({
    id: String(x.id),
    email: String(x.email),
    created_at: String(x.created_at ?? ""),
    roles: x.roles ? String(x.roles).split(",").filter(Boolean) : [],
  }));
}

/* ---------- profiles ---------- */

export type ProfileRow = {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

export async function getProfileByUserId(userId: string): Promise<ProfileRow | null> {
  const r = await db.execute(
    "SELECT id, user_id, display_name, avatar_url, created_at FROM profiles WHERE user_id = ? LIMIT 1",
    [userId],
  );
  const rows = rowsToObjects(r);
  if (!rows[0]) return null;
  const x: any = rows[0];
  return {
    id: String(x.id),
    user_id: String(x.user_id),
    display_name: x.display_name ?? null,
    avatar_url: x.avatar_url ?? null,
    created_at: String(x.created_at ?? ""),
  };
}
