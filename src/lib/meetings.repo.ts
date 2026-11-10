// Turso repository for `meetings` (admin-scheduled client meetings).
import { db, rowsToObjects } from "./db";

export type MeetingRow = {
  id: string;
  owner_email: string;
  owner_name: string;
  client_email: string;
  client_name: string;
  meeting_date: string;
  meeting_time: string;
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

function decode(r: any): MeetingRow {
  return {
    id: String(r.id),
    owner_email: String(r.owner_email ?? ""),
    owner_name: String(r.owner_name ?? ""),
    client_email: String(r.client_email ?? ""),
    client_name: String(r.client_name ?? ""),
    meeting_date: String(r.meeting_date ?? ""),
    meeting_time: String(r.meeting_time ?? ""),
    created_at: String(r.created_at ?? ""),
  };
}

export async function insertMeeting(data: Omit<MeetingRow, "id" | "created_at">): Promise<MeetingRow> {
  await ensureMeetingsTable();
  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();
  await db.execute(
    `INSERT INTO meetings (id, owner_email, owner_name, client_email, client_name, meeting_date, meeting_time, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.owner_email, data.owner_name, data.client_email, data.client_name, data.meeting_date, data.meeting_time, created_at],
  );
  return { id, ...data, created_at };
}

export async function listMeetings(): Promise<MeetingRow[]> {
  await ensureMeetingsTable();
  const r = await db.execute(`SELECT * FROM meetings ORDER BY meeting_date DESC, meeting_time DESC`);
  return rowsToObjects(r).map(decode);
}
