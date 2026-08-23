import { d as db, r as rowsToObjects } from "./db-BSVZwhof.mjs";
function decodeUser(r) {
  return {
    id: String(r.id),
    email: String(r.email),
    password_hash: String(r.password_hash),
    created_at: String(r.created_at ?? "")
  };
}
async function findUserByEmail(email) {
  const r = await db.execute(
    "SELECT id,email,password_hash,created_at FROM users WHERE lower(email) = lower(?) LIMIT 1",
    [email]
  );
  const rows = rowsToObjects(r);
  return rows[0] ? decodeUser(rows[0]) : null;
}
async function findUserById(id) {
  const r = await db.execute(
    "SELECT id,email,password_hash,created_at FROM users WHERE id = ? LIMIT 1",
    [id]
  );
  const rows = rowsToObjects(r);
  return rows[0] ? decodeUser(rows[0]) : null;
}
async function createUser(email, passwordHash) {
  const id = crypto.randomUUID();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await db.execute(
    "INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)",
    [id, email, passwordHash, now]
  );
  await db.execute(
    "INSERT INTO profiles (id, user_id, created_at) VALUES (?, ?, ?)",
    [crypto.randomUUID(), id, now]
  );
  return id;
}
async function updateUserPassword(id, passwordHash) {
  await db.execute("UPDATE users SET password_hash = ? WHERE id = ?", [passwordHash, id]);
}
async function countUsers() {
  const r = await db.execute("SELECT COUNT(*) AS c FROM users", []);
  const rows = rowsToObjects(r);
  return Number(rows[0]?.c ?? 0);
}
async function getRolesForUser(userId) {
  const r = await db.execute(
    "SELECT role FROM user_roles WHERE user_id = ?",
    [userId]
  );
  return rowsToObjects(r).map((x) => String(x.role));
}
async function grantRole(userId, role) {
  await db.execute(
    "INSERT OR IGNORE INTO user_roles (id, user_id, role, created_at) VALUES (?, ?, ?, ?)",
    [crypto.randomUUID(), userId, role, (/* @__PURE__ */ new Date()).toISOString()]
  );
}
async function deleteUser(userId) {
  await db.batch([
    { sql: "DELETE FROM user_roles WHERE user_id = ?", args: [userId] },
    { sql: "DELETE FROM profiles WHERE user_id = ?", args: [userId] },
    { sql: "DELETE FROM users WHERE id = ?", args: [userId] }
  ]);
}
async function getRoleNameById(roleId) {
  const r = await db.execute("SELECT name FROM roles WHERE id = ? LIMIT 1", [roleId]);
  const row = rowsToObjects(r)[0];
  return row?.name ? String(row.name) : null;
}
async function listUsersWithRoles(limit = 200) {
  const r = await db.execute(
    `SELECT u.id, u.email, u.created_at,
            (SELECT group_concat(role, ',') FROM user_roles WHERE user_id = u.id) AS roles
     FROM users u ORDER BY u.created_at DESC LIMIT ?`,
    [limit]
  );
  return rowsToObjects(r).map((x) => ({
    id: String(x.id),
    email: String(x.email),
    created_at: String(x.created_at ?? ""),
    roles: x.roles ? String(x.roles).split(",").filter(Boolean) : []
  }));
}
export {
  grantRole as a,
  getRolesForUser as b,
  createUser as c,
  deleteUser as d,
  countUsers as e,
  findUserByEmail as f,
  getRoleNameById as g,
  findUserById as h,
  listUsersWithRoles as l,
  updateUserPassword as u
};
