import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { adminListProjectOwners } from "@/lib/project-owner-admin.functions";
import { adminListClients } from "@/lib/admin.functions";
import { createMeeting } from "@/lib/meetings.functions";
import { ArrowRight, Building2, CalendarDays, Clock, Loader2, Mail, Search, UserCircle, Users, X } from "lucide-react";
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

function ClientsList({ owner, onBack }: { owner: Owner; onBack: () => void }) {
  const listClients = useServerFn(adminListClients);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: () => listClients(),
  });
  const clients: Client[] = (data ?? []) as Client[];
  const [selected, setSelected] = useState<Client | null>(null);

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

      <div className="flex items-center gap-2 text-sm font-semibold">
        <Users className="h-4 w-4" /> اختر عميلاً لجدولة اجتماع
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
          {clients.map((c) => (
            <li key={c.email}>
              <button
                type="button"
                onClick={() => setSelected(c)}
                className="flex w-full items-center gap-3 px-4 py-3 text-start transition hover:bg-secondary"
              >
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
          ))}
        </ul>
      )}

      {selected && (
        <ScheduleMeetingDialog
          owner={owner}
          client={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}

function ScheduleMeetingDialog({
  owner,
  client,
  onClose,
}: {
  owner: Owner;
  client: Client;
  onClose: () => void;
}) {
  const schedule = useServerFn(createMeeting);
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      schedule({
        data: {
          owner_email: owner.email,
          owner_name: owner.company_name ?? "",
          client_email: client.email,
          client_name: client.display_name ?? "",
          meeting_date: date,
          meeting_time: time,
        },
      }),
    onSuccess: () => {
      toast.success("تم حفظ الاجتماع");
      onClose();
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
            <p className="text-sm text-muted-foreground">{client.display_name || client.email}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="rounded-md p-1 hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
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
            حفظ الاجتماع
          </button>
        </div>
      </form>
    </div>
  );
}
