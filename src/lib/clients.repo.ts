// clients table — customer login. Server-only.
import { db, rowsToObjects } from "./db";

export type ClientRow = {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
};

function decodeClient(r: any): ClientRow {
  return {
    id: String(r.id),
    email: String(r.email),
    password_hash: String(r.password_hash),
    created_at: String(r.created_at ?? ""),
  };
}

export async function findClientByEmail(email: string): Promise<ClientRow | null> {
  const r = await db.execute(
    "SELECT id, email, password_hash, created_at FROM clients WHERE lower(email) = lower(?) LIMIT 1",
    [email],
  );
  const rows = rowsToObjects(r);
  return rows[0] ? decodeClient(rows[0]) : null;
}

export async function findClientById(id: string): Promise<ClientRow | null> {
  const r = await db.execute(
    "SELECT id, email, password_hash, created_at FROM clients WHERE id = ? LIMIT 1",
    [id],
  );
  const rows = rowsToObjects(r);
  return rows[0] ? decodeClient(rows[0]) : null;
}

export async function createClient(email: string, password_hash: string): Promise<string> {
  const id = crypto.randomUUID();
  await db.execute(
    "INSERT INTO clients (id, email, password_hash) VALUES (?, ?, ?)",
    [id, email.toLowerCase(), password_hash],
  );
  return id;
}

export async function updateClientPassword(id: string, passwordHash: string): Promise<void> {
  await db.execute(
    "UPDATE clients SET password_hash = ? WHERE id = ?",
    [passwordHash, id],
  );
}
