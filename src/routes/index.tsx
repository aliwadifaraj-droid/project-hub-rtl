import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { listProjects } from "@/lib/admin.functions";
import { resolveImage } from "@/data/projects";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MapPin, Clock, ArrowLeft, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const projectsQuery = queryOptions({
  queryKey: ["projects"],
  queryFn: () => listProjects(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "إنشاء — منصة مشاريع المقاولات" },
      { name: "description", content: "تصفح أحدث مشاريع المقاولات وقدّم عرض السعر الخاص بك مباشرة." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(projectsQuery),
  component: HomePage,
});

function pickImage(p: { cover_url?: string; cover_image: string | null }) {
  if (p.cover_url && (p.cover_url.startsWith("http") || p.cover_url.startsWith("/"))) return p.cover_url;
  return resolveImage(p.cover_image ?? "");
}

function HomePage() {
  const { data: projects } = useSuspenseQuery(projectsQuery);
  const [vipName, setVipName] = useState("");
  const [vipEmail, setVipEmail] = useState("");
  const [vipLoading, setVipLoading] = useState(false);

  async function handleVipSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vipName.trim() || !vipEmail.trim()) return;
    setVipLoading(true);
    const { error } = await supabase
      .from("vip_subscribers")
      .insert({ name: vipName.trim(), email: vipEmail.trim() });
    setVipLoading(false);
    if (error) {
      toast.error("حصل خطأ: " + error.message);
      return;
    }
    toast.success("تم استلام طلبك، بانتظار موافقة الادمن");
    setVipName("");
    setVipEmail("");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-border/60 bg-[image:var(--gradient-hero,none)]">
          <div className="container mx-auto px-4 py-12 sm:py-16">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              مشاريع المقاولات المتاحة
            </h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              تصفح أحدث الفرص وقدّم عرضك مباشرة من خلال المنصة.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/submit-project"
                className="inline-flex items-center gap-2 rounded-lg bg-[image:var(--gradient-accent)] px-6 py-3 text-base font-bold text-accent-foreground shadow hover:opacity-90 transition"
              >
                أضف مشروعك
              </Link>
              <a
                href="#vip"
                className="inline-flex items-center gap-2 rounded-lg border border-foreground/20 bg-background px-6 py-3 text-base font-bold text-foreground shadow-sm hover:bg-secondary transition"
              >
                <Star className="h-4 w-4" /> العملاء المميزون
              </a>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-10">
          {projects.length === 0 ? (
            <p className="text-center text-muted-foreground py-20">لا توجد مشاريع متاحة حالياً.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <Link
                  key={p.id}
                  to="/project/$id"
                  params={{ id: p.id }}
                  className="group overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition hover:shadow-lg"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    <img
                      src={pickImage(p)}
                      alt={p.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4 space-y-2">
                    <h2 className="font-bold text-lg text-foreground line-clamp-1">{p.name}</h2>
                    <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                    <div className="flex flex-wrap gap-3 pt-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{p.location}</span>
                      <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{p.duration}</span>
                    </div>
                    <div className="pt-3 inline-flex items-center gap-1 text-sm font-semibold text-foreground">
                      عرض التفاصيل <ArrowLeft className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section id="vip" className="border-t border-border/60 bg-secondary/30">
          <div className="container mx-auto px-4 py-12 sm:py-16">
            <div className="mx-auto max-w-xl text-center">
              <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[image:var(--gradient-accent)] text-accent-foreground">
                <Star className="h-6 w-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">العملاء المميزون</h2>
              <p className="mt-2 text-muted-foreground">اشترك لتصلك عروض وفرص حصرية قبل غيرك.</p>
              <form onSubmit={handleVipSubmit} className="mt-6 grid gap-3 text-start">
                <input
                  type="text"
                  required
                  value={vipName}
                  onChange={(e) => setVipName(e.target.value)}
                  placeholder="الاسم"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="email"
                  required
                  value={vipEmail}
                  onChange={(e) => setVipEmail(e.target.value)}
                  placeholder="البريد الإلكتروني"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={vipLoading}
                  className="w-full rounded-lg bg-foreground px-6 py-3 text-base font-bold text-background transition hover:bg-foreground/90 disabled:opacity-60"
                >
                  {vipLoading ? "جارٍ الإرسال..." : "اشتراك"}
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
