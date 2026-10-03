export type TicketUnreadSource = {
  id: string;
  admin_message_count: number;
};

function readCountKey(ticketId: string): string {
  return `client-ticket-read-count:${ticketId}`;
}

export function getTicketUnreadCount(ticket: TicketUnreadSource): number {
  if (typeof window === "undefined") return ticket.admin_message_count;
  const readCount = Number(window.localStorage.getItem(readCountKey(ticket.id)) ?? 0);
  return Math.max(0, ticket.admin_message_count - readCount);
}

export function markTicketMessagesRead(ticketId: string, adminMessageCount: number): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(readCountKey(ticketId), String(adminMessageCount));
  }
}
