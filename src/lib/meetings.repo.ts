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

export type MeetingParticipantRole = "owner" | "client";

export type MeetingControl = {
  meeting_id: string;
  participant_role: MeetingParticipantRole;
  muted: boolean;
  kicked: boolean;
  updated_at: string;
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
      .then(() => db.execute(`CREATE TABLE IF NOT EXISTS meeting_participant_controls (
        meeting_id TEXT NOT NULL,
        participant_role TEXT NOT NULL CHECK (participant_role IN ('owner', 'client')),
        muted INTEGER NOT NULL DEFAULT 0,
        kicked INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (meeting_id, participant_role)
      )`))
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

export async function setMeetingParticipantControl(
  meetingId: string,
  participantRole: MeetingParticipantRole,
  action: "mute" | "unmute" | "kick",
): Promise<MeetingControl> {
  await ensureMeetingsTable();
  const muted = action === "mute" ? 1 : action === "unmute" ? 0 : null;
  const kicked = action === "kick" ? 1 : null;
  await db.execute(
    `INSERT INTO meeting_participant_controls (meeting_id, participant_role, muted, kicked, updated_at)
     VALUES (?, ?, COALESCE(?, 0), COALESCE(?, 0), ?)
     ON CONFLICT(meeting_id, participant_role) DO UPDATE SET
       muted = COALESCE(?, meeting_participant_controls.muted),
       kicked = COALESCE(?, meeting_participant_controls.kicked),
       updated_at = excluded.updated_at`,
    [meetingId, participantRole, muted, kicked, new Date().toISOString(), muted, kicked],
  );
  const control = await getMeetingParticipantControl(meetingId, participantRole);
  if (!control) throw new Error("تعذر تحديث صلاحية المشارك");
  return control;
}

export async function getMeetingParticipantControl(
  meetingId: string,
  participantRole: MeetingParticipantRole,
): Promise<MeetingControl | null> {
  await ensureMeetingsTable();
  const result = await db.execute(
    `SELECT meeting_id, participant_role, muted, kicked, updated_at
     FROM meeting_participant_controls
     WHERE meeting_id = ? AND participant_role = ?
     LIMIT 1`,
    [meetingId, participantRole],
  );
  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    meeting_id: String(row.meeting_id),
    participant_role: row.participant_role as MeetingParticipantRole,
    muted: Boolean(row.muted),
    kicked: Boolean(row.kicked),
    updated_at: String(row.updated_at),
  };
}
