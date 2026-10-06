import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Crown, Ticket, X } from "lucide-react";
import { ClientPortal } from "@/components/client-portal";
import { listMyClientTickets } from "@/lib/client-tickets.functions";
import { getTicketUnreadCount } from "@/lib/client-ticket-unread";
import { getClientVipStatus } from "@/lib/client-vip.functions";

export function ClientPortalShell() {
  const listTickets = useServerFn(listMyClientTickets);
  const getVipStatus = useServerFn(getClientVipStatus);
  const queryClient = useQueryClient();
  const [showVipIntro, setShowVipIntro] = useState(false);
  const { data: tickets = [] } = useQuery({
    queryKey: ["client-support-tickets"],
    queryFn: () => listTickets(),
    refetchInterval: 5000,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
  });
  const { data: vipStatus } = useQuery({
    queryKey: ["client-vip-status"],
    queryFn: () => getVipStatus(),
    refetchInterval: 10000,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
  });
  const unreadCount = tickets.reduce((total, ticket) => total + getTicketUnreadCount(ticket), 0);

  function closeVipIntro(): void {
    setShowVipIntro(false);
    void queryClient.invalidateQueries({ queryKey: ["client-vip-status"] });
  }

  return (
    <div className="relative">
      <ClientPortal />
      <div className="pointer-events-none absolute left-4 top-28 z-50 flex flex-col gap-2 sm:left-6 sm:top-32">
        <Link to="/client-support/tickets" className="pointer-events-auto inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 shadow-lg transition hover:bg-emerald-100">
          <Ticket className="h-4 w-4" />
          تذاكر الدعم
          {unreadCount > 0 && <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-emerald-700 px-1.5 py-0.5 text-xs font-bold text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
        </Link>
        {vipStatus?.isPremium ? (
          <div className="pointer-events-auto inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-800 shadow-lg">
            <Crown className="h-4 w-4" />
            عميل مميز
          </div>
        ) : (
          <button type="button" onClick={() => setShowVipIntro(true)} className="pointer-events-auto inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-800 shadow-lg transition hover:bg-amber-100">
            <Crown className="h-4 w-4" />
            كن عميلاً مميزاً
          </button>
        )}
      </div>

      {showVipIntro && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-labelledby="vip-intro-title">
          <div className="relative w-full max-w-lg rounded-3xl border border-amber-200 bg-card p-6 shadow-2xl sm:p-8">
            <button type="button" onClick={closeVipIntro} aria-label="إغلاق" className="absolute left-4 top-4 rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-700">
              <Crown className="h-7 w-7" />
            </div>
            <h2 id="vip-intro-title" className="mt-5 text-center text-2xl font-extrabold">كن من عملاء منصة العمران المميزين</h2>
            <p className="mt-4 text-center leading-8 text-muted-foreground">
              احصل على عروض ومشاريع مناسبة حسب المدن التي تختارها، واستفد من دعم فني فوري بكل حفاوة وترحيب، لتكون تجربتك مع منصة العمران أوضح وأسهل.
            </p>
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row">
              <button type="button" onClick={closeVipIntro} className="inline-flex flex-1 items-center justify-center rounded-xl border border-border bg-background px-5 py-3 font-semibold text-foreground transition hover:bg-secondary">
                إلغاء
              </button>
              <Link to="/vip/" onClick={closeVipIntro} className="inline-flex flex-1 items-center justify-center rounded-xl bg-amber-600 px-5 py-3 font-bold text-white transition hover:bg-amber-700">
                هل تريد الانضمام معنا؟
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
