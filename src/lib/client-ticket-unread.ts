export type TicketUnreadSource = {
  id: string;
  unread_admin_message_count: number;
};

export function getTicketUnreadCount(ticket: TicketUnreadSource): number {
  return ticket.unread_admin_message_count > 0 ? 1 : 0;
}
