// Repository for the `bot_qa` table on Turso.
// Server-only — do not import from client code.

import { db, rowsToObjects } from "./db";

export type BotQa = {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  is_active: boolean;
  sort_order: number;
  action: "none" | "escalate";
  created_at?: string;
  updated_at?: string;
};

function decode(row: any): BotQa {
  return {
    id: String(row.id),
    question: String(row.question ?? ""),
    answer: String(row.answer ?? ""),
    keywords: parseKeywords(row.keywords),
    is_active: Number(row.is_active) === 1,
    sort_order: Number(row.sort_order ?? 0),
    action: (row.action ?? "none") as "none" | "escalate",
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
  };
}
function parseKeywords(v: unknown): string[] {
  if (Array.isArray(v)) return v as string[];
  if (typeof v === "string" && v.trim()) {
    try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; }
    catch { return []; }
  }
  return [];
}

/** All active QAs matching any of the given tokens in question/answer. */
export async function searchActiveQa(tokens: string[], limit = 6): Promise<BotQa[]> {
  if (!tokens.length) {
    const r = await db.execute(
      "SELECT * FROM bot_qa WHERE is_active = 1 ORDER BY sort_order ASC LIMIT ?",
      [limit],
    );
    return rowsToObjects(r).map(decode);
  }
  const ors = tokens.map(() => "(question LIKE ? OR answer LIKE ?)").join(" OR ");
  const args: (string | number)[] = [];
  for (const t of tokens) { args.push(`%${t}%`, `%${t}%`); }
  args.push(limit);
  const r = await db.execute(
    `SELECT * FROM bot_qa WHERE is_active = 1 AND (${ors}) ORDER BY sort_order ASC LIMIT ?`,
    args,
  );
  return rowsToObjects(r).map(decode);
}

/** All active QAs (used by matcher). */
export async function listActiveQa(): Promise<BotQa[]> {
  const r = await db.execute(
    "SELECT * FROM bot_qa WHERE is_active = 1 ORDER BY sort_order ASC",
    [],
  );
  return rowsToObjects(r).map(decode);
}

export async function listActiveForVisitors(): Promise<
  Pick<BotQa, "id" | "question" | "answer" | "keywords" | "sort_order" | "action">[]
> {
  const r = await db.execute(
    "SELECT id,question,answer,keywords,sort_order,action FROM bot_qa WHERE is_active = 1 ORDER BY sort_order ASC",
    [],
  );
  return rowsToObjects(r).map(decode).map(({ id, question, answer, keywords, sort_order, action }) => ({
    id, question, answer, keywords, sort_order, action,
  }));
}

export async function getQaById(id: string): Promise<Pick<BotQa, "answer" | "action"> | null> {
  const r = await db.execute(
    "SELECT answer, action FROM bot_qa WHERE id = ? AND is_active = 1 LIMIT 1",
    [id],
  );
  const rows = rowsToObjects(r);
  if (!rows.length) return null;
  return { answer: String(rows[0].answer ?? ""), action: (rows[0].action ?? "none") as any };
}

export async function listAllQa(): Promise<BotQa[]> {
  const r = await db.execute(
    "SELECT * FROM bot_qa ORDER BY sort_order ASC",
    [],
  );
  return rowsToObjects(r).map(decode);
}

export async function upsertQa(input: {
  id?: string | null;
  question: string;
  answer: string;
  keywords: string[];
  is_active: boolean;
  sort_order: number;
  action: "none" | "escalate";
}): Promise<void> {
  const kw = JSON.stringify(input.keywords ?? []);
  const active = input.is_active ? 1 : 0;
  const now = new Date().toISOString();
  if (input.id) {
    await db.execute(
      `UPDATE bot_qa SET question=?, answer=?, keywords=?, is_active=?, sort_order=?, action=?, updated_at=? WHERE id=?`,
      [input.question, input.answer, kw, active, input.sort_order, input.action, now, input.id],
    );
  } else {
    const id = crypto.randomUUID();
    await db.execute(
      `INSERT INTO bot_qa (id, question, answer, keywords, is_active, sort_order, action, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, input.question, input.answer, kw, active, input.sort_order, input.action, now, now],
    );
  }
}

export async function deleteQa(id: string): Promise<void> {
  await db.execute("DELETE FROM bot_qa WHERE id = ?", [id]);
}
