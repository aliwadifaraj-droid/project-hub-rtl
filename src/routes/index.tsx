import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listProjects } from "@/lib/admin.functions";
import { resolveImage } from "@/data/projects";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MapPin, Clock, ArrowLeft, Star } from "lucide-react";

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
              <Link
                to="/vip"
                className="inline-flex items-center gap-2 rounded-lg border border-foreground/20 bg-background px-6 py-3 text-base font-bold text-foreground shadow-sm hover:bg-secondary transition"
              >
                <Star className="h-4 w-4" /> العملاء المميزون
              </Link>
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
      </main>
      <SiteFooter />
    </div>
  );
}
