import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminListProjectOwners } from "@/lib/project-owner-admin.functions";
import { adminListClients } from "@/lib/admin.functions";
import {
  adminListUpcomingMeetings,
  createMeeting,
  setMeetingParticipantControl,
} from "@/lib/meetings.functions";
import { riyadhToday } from "@/lib/meeting-time";
import {
  ArrowRight,
  Ban,
  Building2,
  CalendarDays,
  Check,
  Clock,
  Loader2,
  Mail,
  Mic,
  MicOff,
  Search,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/meetings")({
  component: MeetingsPage,
});

type Owner = {
  id: string;
  email: string;
  company_name: string;
  city: string;
};

type Client = {
  email: string;
  display_name: string | null;
};

type UpcomingMeeting = {
  id: string;
  owner_email: string;
  owner_name: string;
  client_email: string;
  client_name: string;
  meeting_date: string;
  meeting_time: string;
  status: string;
};

function MeetingsPage() {
  const [owner, setOwner] = useState<Owner | null>(null);

  if (owner) {
    return <ClientsList owner={owner} onBack={() => setOwner(null)} />;
  }
  return <OwnersList onSelect={setOwner} />;
}

function OwnersList({ onSelect }: { onSelect: (owner: Owner) => void }) {
  const listOwners = useServerFn(adminListProjectOwners);
  const [q, setQ] = useState("");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-project-owners"],
    queryFn: () => listOwners(),
  });

  const term = q.trim().toLowerCase();
  const owners: Owner[] = ((data ?? []) as Owner[]).filter((o) => {
    if (!term) return true;
    return o.email.toLowerCase().includes(term) || (o.company_name ?? "").toLowerCase().includes(term);
  });

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">الاجتماعات</h1>
        <p className="text-sm text-muted-foreground">اختر صاحب مشروع لعرض العملاء المسجلين</p>
      </header>

      <UpcomingMeetingsList />

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث بالبريد أو اسم الشركة"
          className="w-full rounded-md border border-border bg-background py-2 ps-9 pe-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> جارٍ التحميل...
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">تعذّر تحميل أصحاب المشاريع. حاول مرة أخرى.</p>
      ) : owners.length === 0 ? (
        <p className="text-sm text-muted-foreground">لا يوجد أصحاب مشاريع مطابقون</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {owners.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => onSelect(o)}
                className="w-full rounded-lg border border-border bg-card p-4 text-start transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{o.company_name || "بدون اسم شركة"}</div>
                    <div className="truncate text-xs text-muted-foreground">{o.email}</div>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function UpcomingMeetingsList() {
  const listUpcoming = useServerFn(adminListUpcomingMeetings);
  const controlParticipant = useServerFn(setMeetingParticipantControl);
  const [mutedByMeeting, setMutedByMeeting] = useState<Record<string, { owner: boolean; client: boolean }>>({});
  const controlMutation = useMutation({
    mutationFn: (input: {
      id: string;
      participantRole: "owner" | "client";
      action: "mute" | "unmute" | "kick";
    }) => controlParticipant({ data: input }),
    onSuccess: (_, variables) => {
      if (variables.action === "mute" || variables.action === "unmute") {
        setMutedByMeeting((current) => ({
          ...current,
          [variables.id]: {
            owner: current[variables.id]?.owner ?? false,
            client: current[variables.id]?.client ?? false,
            [variables.participantRole]: variables.action === "mute",
          },
        }));
      }
      const actionLabel = variables.action === "kick" ? "تم طرد المشارك" : variables.action === "mute" ? "تم كتم المشارك" : "تم فك كتم المشارك";
      toast.success(actionLabel);
    },
    onError: () => toast.error("تعذر تنفيذ الإجراء الإداري"),
  });
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-upcoming-meetings"],
    queryFn: () => listUpcoming(),
  });
  const meetings = (data ?? []) as UpcomingMeeting[];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <CalendarDays className="h-4 w-4" /> الاجتماعات القادمة
      </div>
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> جارٍ التحميل...
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">تعذّر تحميل الاجتماعات. حاول مرة أخرى.</p>
      ) : meetings.length === 0 ? (
        <p className="text-sm text-muted-foreground">لا توجد اجتماعات قادمة</p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {meetings.map((m) => (
            <li key={m.id} className="space-y-3 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-medium">{m.client_name || m.client_email}</div>
                  <div className="truncate text-xs text-muted-foreground">مع {m.owner_name || m.owner_email}</div>
                </div>
                <div className="text-xs text-muted-foreground" dir="ltr">
                  {m.meeting_date} — {m.meeting_time}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                <MeetingParticipantControls
                  label={m.owner_name || "صاحب المشروع"}
                  participantRole="owner"
                  muted={mutedByMeeting[m.id]?.owner ?? false}
                  disabled={controlMutation.isPending}
                  onAction={(action) => controlMutation.mutate({ id: m.id, participantRole: "owner", action })}
                />
                <MeetingParticipantControls
                  label={m.client_name || "العميل"}
                  participantRole="client"
                  muted={mutedByMeeting[m.id]?.client ?? false}
                  disabled={controlMutation.isPending}
                  onAction={(action) => controlMutation.mutate({ id: m.id, participantRole: "client", action })}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MeetingParticipantControls({
  label,
  participantRole,
  muted,
  disabled,
  onAction,
}: {
  label: string;
  participantRole: "owner" | "client";
  muted: boolean;
  disabled: boolean;
  onAction: (action: "mute" | "unmute" | "kick") => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md bg-secondary/40 px-2 py-1.5">
      <span className="text-xs font-semibold">{label}</span>
      <button
        type="button"
        onClick={() => onAction(muted ? "unmute" : "mute")}
        disabled={disabled}
        className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-semibold transition hover:bg-secondary disabled:opacity-50"
      >
        {muted ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
        {muted ? "فك الكتم" : "كتم"}
      </button>
      <button
        type="button"
        onClick={() => onAction("kick")}
        disabled={disabled}
        className="inline-flex items-center gap-1 rounded-md border border-destructive/30 bg-destructive/5 px-2 py-1 text-xs font-semibold text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
      >
        <Ban className="h-3.5 w-3.5" /> طرد
      </button>
      <span className="sr-only">{participantRole}</span>
    </div>
  );
}

function ClientsList({ owner, onBack }: { owner: Owner; onBack: () => void }) {
  const listClients = useServerFn(adminListClients);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: () => listClients(),
  });
  const clients: Client[] = (data ?? []) as Client[];
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showSchedule, setShowSchedule] = useState(false);

  function toggleClient(email: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(email)) {
        next.delete(email);
      } else {
        next.add(email);
      }
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(clients.map((c) => c.email)));
  }

  function clearAll() {
    setSelected(new Set());
  }

  const selectedClients = clients.filter((c) => selected.has(c.email));

  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowRight className="h-4 w-4" /> رجوع إلى أصحاب المشاريع
        </button>
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold">{owner.company_name || "بدون اسم شركة"}</h1>
            <p className="text-sm text-muted-foreground">{owner.email}</p>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Users className="h-4 w-4" /> اختر العملاء لجدولة اجتماع
        </div>
        {clients.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <button type="button" onClick={selectAll} className="text-muted-foreground hover:text-foreground">
              تحديد الكل
            </button>
            <span className="text-muted-foreground">|</span>
            <button type="button" onClick={clearAll} className="text-muted-foreground hover:text-foreground">
              مسح التحديد
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> جارٍ التحميل...
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">تعذّر تحميل العملاء. حاول مرة أخرى.</p>
      ) : clients.length === 0 ? (
        <p className="text-sm text-muted-foreground">لا يوجد عملاء مسجلون</p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {clients.map((c) => {
            const isSelected = selected.has(c.email);
            return (
              <li key={c.email}>
                <button
                  type="button"
                  onClick={() => toggleClient(c.email)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-start transition hover:bg-secondary"
                >
                  <span
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded border transition ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background"
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary">
                    <UserCircle className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate font-medium">{c.display_name || "بدون اسم"}</div>
                    <div className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" /> {c.email}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {selected.size > 0 && (
        <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 shadow-lg">
          <span className="text-sm font-medium">
            {selected.size} عميل محدد
          </span>
          <button
            type="button"
            onClick={() => setShowSchedule(true)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            <CalendarDays className="h-4 w-4" />
            جدولة اجتماع
          </button>
        </div>
      )}

      {showSchedule && selectedClients.length > 0 && (
        <ScheduleMeetingDialog
          owner={owner}
          clients={selectedClients}
          onClose={() => setShowSchedule(false)}
          onScheduled={onBack}
        />
      )}
    </section>
  );
}

function ScheduleMeetingDialog({
  owner,
  clients,
  onClose,
  onScheduled,
}: {
  owner: Owner;
  clients: Client[];
  onClose: () => void;
  onScheduled: () => void;
}) {
  const schedule = useServerFn(createMeeting);
  const queryClient = useQueryClient();
  const today = riyadhToday();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      schedule({
        data: {
          owner_email: owner.email,
          owner_name: owner.company_name ?? "",
          clients: clients.map((c) => ({
            email: c.email,
            name: c.display_name ?? "",
          })),
          meeting_date: date,
          meeting_time: time,
        },
      }),
    onSuccess: (res: { created: number; results: Array<{ emailed: boolean; emailError: string | null }> }) => {
      const emailedCount = res.results.filter((r) => r.emailed).length;
      toast.success(`تم حفظ ${res.created} اجتماع`);
      if (emailedCount > 0) {
        toast.success(`تم إرسال ${emailedCount} إيميل دعوة`);
      }
      const failed = res.results.filter((r) => !r.emailed);
      if (failed.length > 0) {
        toast.error(`تعذّر إرسال ${failed.length} إيميل دعوة: ${failed[0].emailError ?? "سبب غير معروف"}`);
      }
      void queryClient.invalidateQueries({ queryKey: ["admin-upcoming-meetings"] });
      onScheduled();
    },
    onError: (e: Error) => {
      toast.error(e.message || "تعذّر حفظ الاجتماع. حاول مرة أخرى.");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !time) {
      setFormError("اختر التاريخ والوقت");
      return;
    }
    if (date < today) {
      setFormError("لا يمكن اختيار تاريخ في الماضي");
      return;
    }
    setFormError(null);
    mutation.mutate();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-5 rounded-lg border border-border bg-card p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">جدولة اجتماع</h2>
            <p className="text-sm text-muted-foreground">{clients.length} عميل</p>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="rounded-md p-1 hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-md bg-secondary/50 p-3 text-sm text-muted-foreground">
          سيتم إرسال دعوة بالبريد الإلكتروني لكل العملاء المحددين تحتوي على تاريخ ووقت الاجتماع.
        </div>

        <label className="block space-y-1.5">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <CalendarDays className="h-4 w-4" /> التاريخ
          </span>
          <input
            type="date"
            min={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <Clock className="h-4 w-4" /> الوقت
          </span>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </label>

        {formError && <p className="text-sm text-destructive">{formError}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-4 py-2 text-sm hover:bg-secondary"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            حفظ وإرسال الدعوات
          </button>
        </div>
      </form>
    </div>
  );
}
