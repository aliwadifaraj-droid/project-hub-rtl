import { Link, useRouterState } from "@tanstack/react-router";
import { Building2, ClipboardList, Megaphone, Bell, MessagesSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listMyNotifications,
  countMyUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/notifications.functions";
import { countUnreadTeamMessages } from "@/lib/chat.functions";
import { getMe } from "@/lib/auth.functions";

const CHAT_SEEN_KEY = "team_chat_last_seen";

export function SiteHeader() {
  const [signedIn, setSignedIn] = useState(false);
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const qc = useQueryClient();
  const countUnread = useServerFn(countMyUnreadNotifications);
  const listNotifs = useServerFn(listMyNotifications);
  const markRead = useServerFn(markNotificationRead);
  const markAllRead = useServerFn(markAllNotificationsRead);
  const fetchMe = useServerFn(getMe);
  const countChatFn = useServerFn(countUnreadTeamMessages);

  useEffect(() => {
    let mounted = true;
    fetchMe()
      .then((me) => {
        if (mounted) setSignedIn(!!me);
      })
      .catch(() => {
        if (mounted) setSignedIn(false);
      });
    return () => {
      mounted = false;
    };
  }, [fetchMe, path]);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notif-unread-count"],
    queryFn: () => countUnread(),
    enabled: signedIn,
    refetchInterval: 30000,
  });
  const { data: notifs } = useQuery({
    queryKey: ["my-notifications"],
    queryFn: () => listNotifs(),
    enabled: signedIn && open,
  });

  const { data: chatUnread = 0, refetch: refetchChat } = useQuery({
    queryKey: ["chat-unread-count"],
    queryFn: async () => {
      const since = typeof window !== "undefined" ? localStorage.getItem(CHAT_SEEN_KEY) : null;
      const res = await countChatFn({ data: { since } });
      return res.count;
    },
    enabled: signedIn,
  });

  void refetchChat;

  async function toggle(next: boolean) {
    setOpen(next);
    if (next && unreadCount > 0) {
      await markAllRead();
      qc.invalidateQueries({ queryKey: ["notif-unread-count"] });
    }
  }

  function handleChatClick() {
    if (typeof window !== "undefined") {
      localStorage.setItem(CHAT_SEEN_KEY, new Date().toISOString());
    }
    qc.setQueryData(["chat-unread-count"], 0);
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[image:var(--gradient-accent)] text-accent-foreground">
            <Building2 className="h-5 w-5" />
          </span>
          <span>العمران</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/projects"
            className="rounded-md px-2 sm:px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground data-[status=active]:text-foreground"
          >
            المشاريع
          </Link>
          <Link
            to="/ads"
            className="inline-flex items-center gap-1 rounded-md px-2 sm:px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground data-[status=active]:text-foreground"
          >
            <Megaphone className="h-4 w-4" /> الإعلانات
          </Link>
          <Link
            to="/my-requests"
            className="inline-flex items-center gap-1 rounded-md px-2 sm:px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground data-[status=active]:text-foreground"
          >
            <ClipboardList className="h-4 w-4" /> طلباتي
          </Link>

          {signedIn && (
            <Link
              to="/admin/chat"
              onClick={handleChatClick}
              aria-label="شات الفريق"
              className={`relative inline-flex h-9 w-9 items-center justify-center rounded-md border transition ${
                chatUnread > 0
                  ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border-border bg-background hover:bg-secondary"
              }`}
            >
              <MessagesSquare className="h-4 w-4" />
              {chatUnread > 0 && (
                <span className="absolute -top-1.5 -end-1.5 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-background bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {chatUnread > 99 ? "99+" : chatUnread}
                </span>
              )}
            </Link>
          )}

          {signedIn && (
            <div className="relative">
              <button
                onClick={() => toggle(!open)}
                aria-label="إشعاراتي"
                className={`relative inline-flex h-9 w-9 items-center justify-center rounded-md border transition ${
                  unreadCount > 0
                    ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border-border bg-background hover:bg-secondary"
                }`}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -end-1.5 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-background bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
              {open && (
                <div className="absolute end-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
                  <div className="border-b border-border px-3 py-2 text-sm font-semibold">إشعاراتي</div>
                  <div className="max-h-96 overflow-auto">
                    {(notifs ?? []).length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground">لا توجد إشعارات</div>
                    ) : (
                      (notifs ?? []).map((n) => {
                        const content = (
                          <div className={`border-b border-border px-3 py-2 text-xs hover:bg-secondary ${n.read ? "" : "bg-primary/5"}`}>
                            <div className="font-semibold">{n.title}</div>
                            {n.body ? <div className="mt-0.5 text-muted-foreground">{n.body}</div> : null}
                            {n.link ? (
                              <div className="mt-1 text-[11px] text-primary underline">عرض المنشور</div>
                            ) : null}
                            <div className="mt-1 text-[10px] text-muted-foreground">
                              {new Date(n.created_at).toLocaleString("ar")}
                            </div>
                          </div>
                        );
                        return n.link ? (
                          <a
                            key={n.id}
                            href={n.link}
                            onClick={async () => {
                              await markRead({ data: { id: n.id } });
                              qc.invalidateQueries({ queryKey: ["my-notifications"] });
                              setOpen(false);
                            }}
                            className="block"
                          >
                            {content}
                          </a>
                        ) : (
                          <div key={n.id}>{content}</div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <Link
            to="/contact"
            className="rounded-md bg-foreground px-3 sm:px-4 py-2 text-sm font-semibold text-background transition hover:bg-foreground/90"
          >
            تواصل بنا
          </Link>
        </nav>
      </div>
    </header>
  );
}
