import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { adminListProjectOwners } from "@/lib/project-owner-admin.functions";
import { adminListClients } from "@/lib/admin.functions";
import { ArrowRight, Building2, Loader2, Mail, Search, UserCircle, Users } from "lucide-react";

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
        <Users className="h-4 w-4" /> العملاء المسجلون
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
            <li key={c.email} className="flex items-center gap-3 px-4 py-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary">
                <UserCircle className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="truncate font-medium">{c.display_name || "بدون اسم"}</div>
                <div className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" /> {c.email}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
