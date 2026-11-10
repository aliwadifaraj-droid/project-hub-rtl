// Turso repository for `meetings` (admin-scheduled client meetings).
import { db } from "./db";

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
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`)
      .then(() => db.execute(`CREATE INDEX IF NOT EXISTS idx_meetings_client ON meetings(client_email)`))
      .then(() => undefined);
  }
  return meetingsTableReady;
}

export async function insertMeeting(data: MeetingInput): Promise<MeetingRow> {
  await ensureMeetingsTable();
  const row: MeetingRow = { id: crypto.randomUUID(), ...data, created_at: new Date().toISOString() };
  await db.execute(
    `INSERT INTO meetings (id, owner_email, owner_name, client_email, client_name, meeting_date, meeting_time, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [row.id, row.owner_email, row.owner_name, row.client_email, row.client_name, row.meeting_date, row.meeting_time, row.created_at],
  );
  return row;
}
