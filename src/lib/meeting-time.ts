export const MEETING_TIMEZONE = "Asia/Riyadh";
const MEETING_UTC_OFFSET = "+03:00";

export function riyadhToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MEETING_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function meetingStartTimestamp(date: string, time: string): number {
  return new Date(`${date}T${time}:00${MEETING_UTC_OFFSET}`).getTime();
}
