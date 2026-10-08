// Turso repository for client approvals (اعتماد العملاء).
// Server-only. Tables: approval_tokens, approval_receipts.
// Bank info is stored in site_settings under key "vip_bank_info".
import { db, rowsToObjects } from "./db";

export type ApprovalInstallmentRow = {
  id: string;
  token_id: string;
  installment_number: number;
  amount: string;
  paid_amount: string;
  status: string;
  created_at: string;
  paid_at: string | null;
};

export type ApprovalTokenRow = {
  id: string;
  token_code: string;
  client_id: string;
  client_name: string;
  project_id: string;
  project_name: string;
  total_commission: string;
  allowed_amount: string;
  paid_amount: string;
  status: string;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  installments: ApprovalInstallmentRow[];
};

export type ApprovalReceiptRow = {
  id: string;
  token_id: string;
  token_code: string;
  client_id: string;
  client_name: string;
  amount: string;
  ocr_result: string | null;
  ocr_amount: string | null;
  receipt_image_key: string | null;
  receipt_image_url: string | null;
  status: string;
  project_name: string | null;
  paid_amount: string | null;
  created_at: string;
  approved_at: string | null;
};

type ApprovalTokenInput = {
  client_id?: string;
  user_id?: string;
  client_name?: string;
  project_id?: string;
  project_name?: string;
  total_commission?: string;
  totalCommission?: string;
  allowed_amount?: string;
  allowed_payment_now?: string;
  installments?: string[];
  token?: string;
  code?: string;
};

let approvalTablesReady: Promise<void> | null = null;

function ensureApprovalTables(): Promise<void> {
  if (approvalTablesReady) return approvalTablesReady;

  approvalTablesReady = (async () => {
    await db.batch([
      {
        sql: `CREATE TABLE IF NOT EXISTS approval_tokens (
          id TEXT PRIMARY KEY,
          token TEXT,
          code TEXT,
          user_id TEXT,
          client_name TEXT,
          project_id TEXT,
          project_name TEXT,
          total_commission TEXT,
          allowed_payment_now TEXT,
          paid_amount TEXT NOT NULL DEFAULT '0',
          status TEXT NOT NULL DEFAULT 'active',
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`,
        args: [],
      },
      {
        sql: `CREATE TABLE IF NOT EXISTS approval_installments (
          id TEXT PRIMARY KEY,
          token_id TEXT NOT NULL,
          installment_number INTEGER NOT NULL,
          amount TEXT NOT NULL,
          paid_amount TEXT NOT NULL DEFAULT '0',
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          paid_at TEXT
        )`,
        args: [],
      },
      {
        sql: `CREATE TABLE IF NOT EXISTS approval_receipts (
          id TEXT PRIMARY KEY,
          token_id TEXT NOT NULL,
          token_code TEXT,
          user_id TEXT,
          client_name TEXT,
          amount TEXT NOT NULL,
          ocr_result TEXT,
          ocr_amount TEXT,
          receipt_image_key TEXT,
          receipt_image_url TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          project_name TEXT,
          paid_amount TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          approved_at TEXT
        )`,
        args: [],
      },
    ]);

    let tokenColumnNames = new Set<string>();
    const receiptColumns = await db.execute("PRAGMA table_info(approval_receipts)");
    const installmentColumns = await db.execute("PRAGMA table_info(approval_installments)");
    tokenColumnNames = new Set(rowsToObjects<{ name: string }>(await db.execute("PRAGMA table_info(approval_tokens)")).map((column) => String(column.name)));
    const receiptColumnNames = new Set(rowsToObjects<{ name: string }>(receiptColumns).map((column) => String(column.name)));
    const installmentColumnNames = new Set(rowsToObjects<{ name: string }>(installmentColumns).map((column) => String(column.name)));
    const missingTokenColumns: Record<string, string> = {
      code: "TEXT",
      token_code: "TEXT",
      client_id: "TEXT",
      client_name: "TEXT",
      project_id: "TEXT",
      project_name: "TEXT",
      total_commission: "TEXT",
      allowed_amount: "TEXT",
      updated_at: "TEXT",
      approved_at: "TEXT",
    };
    const missingReceiptColumns: Record<string, string> = {
      approved_at: "TEXT",
      project_name: "TEXT",
      paid_amount: "TEXT",
    };
    const schemaUpdates = Object.entries(missingTokenColumns)
      .filter(([column]) => !tokenColumnNames.has(column))
      .map(([column, definition]) => ({
        sql: `ALTER TABLE approval_tokens ADD COLUMN ${column} ${definition}`,
        args: [],
      }));
    const receiptSchemaUpdates = Object.entries(missingReceiptColumns)
      .filter(([column]) => !receiptColumnNames.has(column))
      .map(([column, definition]) => ({
        sql: `ALTER TABLE approval_receipts ADD COLUMN ${column} ${definition}`,
        args: [],
      }));
    if (schemaUpdates.length > 0 || receiptSchemaUpdates.length > 0) {
      await db.batch([...schemaUpdates, ...receiptSchemaUpdates]);
      tokenColumnNames = new Set(rowsToObjects<{ name: string }>(await db.execute("PRAGMA table_info(approval_tokens)")).map((column) => String(column.name)));
    }
    const indexes = [];

    if (tokenColumnNames.has("status")) {
      indexes.push({ sql: "CREATE INDEX IF NOT EXISTS idx_approval_tokens_status ON approval_tokens(status)", args: [] });
    }
    if (receiptColumnNames.has("status")) {
      indexes.push({ sql: "CREATE INDEX IF NOT EXISTS idx_approval_receipts_status ON approval_receipts(status)", args: [] });
    }
    if (receiptColumnNames.has("token_id")) {
      indexes.push({ sql: "CREATE INDEX IF NOT EXISTS idx_approval_receipts_token ON approval_receipts(token_id)", args: [] });
    }
    if (installmentColumnNames.has("token_id")) {
      indexes.push({ sql: "CREATE INDEX IF NOT EXISTS idx_approval_installments_token ON approval_installments(token_id, installment_number)", args: [] });
    }

    if (indexes.length > 0) await db.batch(indexes);
  })();

  return approvalTablesReady;
}

async function getApprovalTokenColumns(): Promise<Set<string>> {
  await ensureApprovalTables();
  const result = await db.execute("PRAGMA table_info(approval_tokens)");
  return new Set(rowsToObjects<{ name: string }>(result).map((column) => String(column.name)));
}

async function getApprovalReceiptColumns(): Promise<Set<string>> {
  await ensureApprovalTables();
  const result = await db.execute("PRAGMA table_info(approval_receipts)");
  return new Set(rowsToObjects<{ name: string }>(result).map((column) => String(column.name)));
}

export async function getVipBankInfo(): Promise<string> {
  const r = await db.execute(
    "SELECT value FROM site_settings WHERE key = ? LIMIT 1",
    ["vip_bank_info"],
  );
  const row = rowsToObjects<{ value: string | null }>(r)[0];
  return row?.value ?? "";
}

function decodeInstallment(r: any): ApprovalInstallmentRow {
  return {
    id: String(r.id ?? ""),
    token_id: String(r.token_id ?? ""),
    installment_number: Number(r.installment_number ?? 0),
    amount: String(r.amount ?? "0"),
    paid_amount: String(r.paid_amount ?? "0"),
    status: String(r.status ?? "pending"),
    created_at: String(r.created_at ?? ""),
    paid_at: r.paid_at ?? null,
  };
}

function decodeToken(r: any): ApprovalTokenRow {
  return {
    id: String(r.id ?? ""),
    token_code: String(r.token_code || r.code || r.token || ""),
    client_id: String(r.client_id || r.user_id || ""),
    client_name: String(r.client_name ?? ""),
    project_id: String(r.project_id ?? ""),
    project_name: String(r.project_name ?? ""),
    total_commission: String(r.total_commission || r.amount || "0"),
    allowed_amount: String(r.allowed_amount || r.allowed_payment_now || "0"),
    paid_amount: String(r.paid_amount ?? "0"),
    status: String(r.status ?? "active"),
    created_at: String(r.created_at ?? ""),
    updated_at: String(r.updated_at ?? ""),
    approved_at: r.approved_at ?? null,
    installments: [],
  };
}

function decodeReceipt(r: any): ApprovalReceiptRow {
  return {
    id: String(r.id ?? ""),
    token_id: String(r.token_id ?? ""),
    token_code: String(r.token_code || r.code || r.token || ""),
    client_id: String(r.client_id || r.user_id || ""),
    client_name: String(r.client_name ?? ""),
    amount: String(r.amount ?? "0"),
    ocr_result: r.ocr_result ?? null,
    ocr_amount: r.ocr_amount ?? null,
    receipt_image_key: r.receipt_image_key ?? null,
    receipt_image_url: r.receipt_image_url ?? null,
    status: String(r.status ?? "pending"),
    project_name: r.project_name ?? null,
    paid_amount: r.paid_amount ?? null,
    created_at: String(r.created_at ?? ""),
    approved_at: r.approved_at ?? null,
  };
}

function normalizeTokenCode(code: string): string {
  return code.trim().toUpperCase().replace(/[‐‑‒–—−]/g, "-").replace(/\s+/g, "");
}

function genTokenCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "AOM-";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function createApprovalToken(data: ApprovalTokenInput = {}): Promise<ApprovalTokenRow> {
  const columns = await getApprovalTokenColumns();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  let generatedCode = normalizeTokenCode(data.code ?? data.token ?? genTokenCode());

  for (let attempt = 0; attempt < 5; attempt++) {
    const lookupColumn = columns.has("code") ? "code" : columns.has("token") ? "token" : "token_code";
    const existing = await db.execute(
      `SELECT id FROM approval_tokens WHERE ${lookupColumn} = ? LIMIT 1`,
      [generatedCode],
    );
    if (rowsToObjects(existing).length === 0) break;
    generatedCode = genTokenCode();
  }

  const values: Record<string, string> = {
    id,
    token: generatedCode,
    code: generatedCode,
    token_code: generatedCode,
    user_id: data.user_id ?? data.client_id ?? "",
    client_id: data.client_id ?? data.user_id ?? "",
    client_name: data.client_name ?? "",
    project_id: data.project_id ?? "",
    project_name: data.project_name ?? "",
    amount: data.total_commission ?? data.totalCommission ?? "",
    total_commission: data.total_commission ?? data.totalCommission ?? "",
    allowed_payment_now: data.allowed_payment_now ?? data.allowed_amount ?? "",
    allowed_amount: data.allowed_amount ?? data.allowed_payment_now ?? "",
    paid_amount: "0",
    status: "active",
    created_at: now,
    updated_at: now,
  };

  const preferredColumns = [
    "id", "token", "code", "user_id", "client_name", "project_id", "project_name",
    "amount", "total_commission", "allowed_payment_now", "paid_amount", "status", "created_at", "updated_at",
    "token_code", "client_id", "allowed_amount",
  ];
  const insertColumns = preferredColumns.filter((column) => columns.has(column));
  const insertValues = insertColumns.map((column) => values[column]);
  await db.execute(
    `INSERT INTO approval_tokens (${insertColumns.join(", ")}) VALUES (${insertColumns.map(() => "?").join(", ")})`,
    insertValues,
  );

  const installmentAmounts = data.installments?.length ? data.installments : [data.allowed_amount ?? data.allowed_payment_now ?? "0"];
  await db.batch(installmentAmounts.map((amount, index) => ({
    sql: `INSERT INTO approval_installments (id, token_id, installment_number, amount, paid_amount, status, created_at)
      VALUES (?, ?, ?, ?, '0', 'pending', ?)`,
    args: [crypto.randomUUID(), id, index + 1, amount, now],
  })));

  return (await findTokenById(id))!;
}

export async function listApprovalInstallments(tokenId: string): Promise<ApprovalInstallmentRow[]> {
  await ensureApprovalTables();
  const r = await db.execute(
    "SELECT * FROM approval_installments WHERE token_id = ? ORDER BY installment_number ASC",
    [tokenId],
  );
  return rowsToObjects(r).map(decodeInstallment);
}

export async function findTokenById(id: string): Promise<ApprovalTokenRow | null> {
  await ensureApprovalTables();
  const r = await db.execute("SELECT * FROM approval_tokens WHERE id = ? LIMIT 1", [id]);
  const rows = rowsToObjects(r);
  if (!rows[0]) return null;
  const token = decodeToken(rows[0]);
  token.installments = await listApprovalInstallments(id);
  return token;
}

export async function findTokenByCode(code: string): Promise<ApprovalTokenRow | null> {
  const columns = await getApprovalTokenColumns();
  const normalizedCode = normalizeTokenCode(code);
  const lookupColumns = ["token", "code", "token_code"].filter((column) => columns.has(column));
  if (lookupColumns.length === 0) return null;

  const conditions = lookupColumns.map((column) => `${column} = ?`).join(" OR ");
  const r = await db.execute(
    `SELECT * FROM approval_tokens WHERE ${conditions} LIMIT 1`,
    lookupColumns.map(() => normalizedCode),
  );
  const rows = rowsToObjects(r);
  return rows[0] ? findTokenById(String(rows[0].id)) : null;
}

export async function listAllApprovalTokens(): Promise<ApprovalTokenRow[]> {
  await ensureApprovalTables();
  const r = await db.execute("SELECT * FROM approval_tokens ORDER BY created_at DESC");
  return Promise.all(rowsToObjects(r).map(async (row) => {
    const token = decodeToken(row);
    token.installments = await listApprovalInstallments(token.id);
    return token;
  }));
}

export async function listActiveApprovalTokens(): Promise<ApprovalTokenRow[]> {
  await ensureApprovalTables();
  const r = await db.execute("SELECT * FROM approval_tokens WHERE status = 'active' ORDER BY created_at DESC");
  return rowsToObjects(r).map(decodeToken);
}

export async function updateTokenPaidAmount(tokenId: string, paidAmount: string, status: string): Promise<void> {
  await ensureApprovalTables();
  const now = new Date().toISOString();
  await db.execute(
    "UPDATE approval_tokens SET paid_amount = ?, status = ?, updated_at = ? WHERE id = ?",
    [paidAmount, status, now, tokenId],
  );
}

export async function approveTokenWithPaidAmount(tokenId: string, paidAmount: string): Promise<void> {
  await ensureApprovalTables();
  const receiptColumns = await getApprovalReceiptColumns();
  const now = new Date().toISOString();

  const totalCommission = Number((await findTokenById(tokenId))?.total_commission ?? 0);
  const nextStatus = Number(paidAmount) >= totalCommission - 0.01 ? "approved" : "active";
  await db.execute(
    "UPDATE approval_tokens SET paid_amount = ?, status = ?, approved_at = ?, updated_at = ? WHERE id = ?",
    [paidAmount, nextStatus, nextStatus === "approved" ? now : null, now, tokenId],
  );

  const token = await findTokenById(tokenId);
  if (!token) return;

  let remainingPaid = Math.max(0, Number(paidAmount) || 0);
  for (const installment of token.installments) {
    const installmentAmount = Math.max(0, Number(installment.amount) || 0);
    const installmentPaid = Math.min(installmentAmount, remainingPaid);
    remainingPaid -= installmentPaid;
    await db.execute(
      "UPDATE approval_installments SET paid_amount = ?, status = ?, paid_at = ? WHERE id = ?",
      [String(installmentPaid), installmentPaid >= installmentAmount ? "paid" : "pending", installmentPaid > 0 && installmentPaid >= installmentAmount ? now : null, installment.id],
    );
  }

  const latestReceipt = await findLatestReceiptByTokenId(tokenId);
  if (latestReceipt) {
    if (receiptColumns.has("project_name")) {
      await db.execute(
        "UPDATE approval_receipts SET project_name = ?, paid_amount = ?, approved_at = ? WHERE id = ?",
        [token.project_name, paidAmount, now, latestReceipt.id],
      );
    } else {
      await db.execute(
        "UPDATE approval_receipts SET paid_amount = ?, approved_at = ? WHERE id = ?",
        [paidAmount, now, latestReceipt.id],
      );
    }
  }
}

export async function createApprovalReceipt(data: {
  token_id?: string;
  token_code?: string;
  token?: string;
  code?: string;
  client_id?: string;
  user_id?: string;
  client_name?: string;
  amount?: string;
  ocr_result?: string | null;
  ocr_amount?: string | null;
  receipt_image_key?: string | null;
  receipt_image_url?: string | null;
} = {}): Promise<string> {
  await ensureApprovalTables();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute(
    `INSERT INTO approval_receipts (id, token_id, token_code, user_id, client_name, amount, ocr_result, ocr_amount, receipt_image_key, receipt_image_url, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    [id, data.token_id ?? "", data.token_code ?? data.code ?? data.token ?? "", data.user_id ?? data.client_id ?? "", data.client_name ?? "", data.amount ?? "", data.ocr_result ?? null, data.ocr_amount ?? null, data.receipt_image_key ?? null, data.receipt_image_url ?? null, now],
  );
  return id;
}

export async function listAllApprovalReceipts(): Promise<ApprovalReceiptRow[]> {
  await ensureApprovalTables();
  const r = await db.execute("SELECT * FROM approval_receipts ORDER BY created_at DESC");
  return rowsToObjects(r).map(decodeReceipt);
}

export async function findReceiptById(id: string): Promise<ApprovalReceiptRow | null> {
  await ensureApprovalTables();
  const r = await db.execute("SELECT * FROM approval_receipts WHERE id = ? LIMIT 1", [id]);
  const rows = rowsToObjects(r);
  return rows[0] ? decodeReceipt(rows[0]) : null;
}

export async function findLatestReceiptByTokenId(tokenId: string): Promise<ApprovalReceiptRow | null> {
  await ensureApprovalTables();
  const r = await db.execute(
    "SELECT * FROM approval_receipts WHERE token_id = ? ORDER BY created_at DESC LIMIT 1",
    [tokenId],
  );
  const rows = rowsToObjects(r);
  return rows[0] ? decodeReceipt(rows[0]) : null;
}

export async function updateReceiptStatus(receiptId: string, status: string): Promise<void> {
  await ensureApprovalTables();
  const now = new Date().toISOString();
  await db.execute(
    "UPDATE approval_receipts SET status = ?, approved_at = ? WHERE id = ?",
    [status, now, receiptId],
  );
}

export async function getReceiptWithToken(receiptId: string): Promise<{ receipt: ApprovalReceiptRow; token: ApprovalTokenRow } | null> {
  const receipt = await findReceiptById(receiptId);
  if (!receipt) return null;
  const token = await findTokenById(receipt.token_id);
  if (!token) return null;
  return { receipt, token };
}