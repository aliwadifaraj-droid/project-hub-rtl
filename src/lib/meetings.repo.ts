// Turso repository for `meetings` (admin-scheduled client meetings).
import { db } from "./db";
import { riyadhToday } from "./meeting-time";

export type MeetingInput = {
  owner_email: string;
  owner_name: string;
  client_email: string;
  client_name: string;
  meeting_date: string;
  meeting_time: string;
};

export type MeetingRow = MeetingInput & {
  id: string;
  created_at: string;
  status: string;
  joined_at: string | null;
  closed_at: string | null;
};

let meetingsTableReady: Promise<void> | null = null;

function ensureMeetingsTable(): Promise<void> {
  if (!meetingsTableReady) {
    meetingsTableReady = db
      .execute(`CREATE TABLE IF NOT EXISTS meetings (
        id TEXT PRIMARY KEY,
        owner_email TEXT NOT NULL DEFAULT '',
        owner_name TEXT NOT NULL DEFAULT '',
        client_email TEXT NOT NULL,
        client_name TEXT NOT NULL DEFAULT '',
        meeting_date TEXT NOT NULL,
        meeting_time TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'scheduled',
        joined_at TEXT,
        closed_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`)
      .then(() => db.execute(`CREATE INDEX IF NOT EXISTS idx_meetings_client ON meetings(client_email)`))
      .then(() => db.execute(`CREATE INDEX IF NOT EXISTS idx_meetings_owner ON meetings(owner_email)`))
      .then(() => db.execute(`CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status)`))
      .then(() => db.execute(`CREATE INDEX IF NOT EXISTS idx_meetings_date_status ON meetings(meeting_date, status)`))
      .then(() => undefined);
  }
  return meetingsTableReady;
}

export async function insertMeeting(data: MeetingInput): Promise<MeetingRow> {
  await ensureMeetingsTable();
  const row: MeetingRow = { id: crypto.randomUUID(), ...data, status: "scheduled", joined_at: null, closed_at: null, created_at: new Date().toISOString() };
  await db.execute(
    `INSERT INTO meetings (id, owner_email, owner_name, client_email, client_name, meeting_date, meeting_time, status, joined_at, closed_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [row.id, row.owner_email, row.owner_name, row.client_email, row.client_name, row.meeting_date, row.meeting_time, row.status, row.joined_at, row.closed_at, row.created_at],
  );
  return row;
}

export async function listUpcomingByEmail(email: string): Promise<MeetingRow[]> {
  await ensureMeetingsTable();
  const today = riyadhToday();
  const result = await db.execute(
    `SELECT * FROM meetings
     WHERE (lower(client_email) = lower(?) OR lower(owner_email) = lower(?))
       AND meeting_date >= ?
       AND status IN ('scheduled', 'active')
     ORDER BY meeting_date ASC, meeting_time ASC
     LIMIT 10`,
    [email, email, today],
  );
  return result.rows as unknown as MeetingRow[];
}

export async function listUpcomingForAdmin(): Promise<MeetingRow[]> {
  await ensureMeetingsTable();
  const today = riyadhToday();
  const result = await db.execute(
    `SELECT * FROM meetings
     WHERE meeting_date >= ?
       AND status IN ('scheduled', 'active')
     ORDER BY meeting_date ASC, meeting_time ASC
     LIMIT 100`,
    [today],
  );
  return result.rows as unknown as MeetingRow[];
}

export async function getMeetingById(id: string): Promise<MeetingRow | null> {
  await ensureMeetingsTable();
  const result = await db.execute(`SELECT * FROM meetings WHERE id = ? LIMIT 1`, [id]);
  const rows = result.rows as unknown as MeetingRow[];
  return rows[0] ?? null;
}

export async function markMeetingJoined(id: string): Promise<void> {
  await ensureMeetingsTable();
  await db.execute(
    `UPDATE meetings SET status = 'active', joined_at = ? WHERE id = ? AND status = 'scheduled'`,
    [new Date().toISOString(), id],
  );
}

export async function markMeetingClosed(id: string): Promise<void> {
  await ensureMeetingsTable();
  await db.execute(
    `UPDATE meetings SET status = 'closed', closed_at = ? WHERE id = ? AND status IN ('scheduled', 'active')`,
    [new Date().toISOString(), id],
  );
}

export async function markMeetingNoShow(id: string): Promise<void> {
  await ensureMeetingsTable();
  await db.execute(
    `UPDATE meetings SET status = 'no_show', closed_at = ? WHERE id = ? AND status IN ('scheduled', 'active')`,
    [new Date().toISOString(), id],
  );
}
