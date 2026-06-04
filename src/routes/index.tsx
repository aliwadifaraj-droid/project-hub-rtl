import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { resolveImage } from "@/data/projects";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ArrowLeft, MapPin, Clock } from "lucide-react";

type Project = {
  id: string;
  name: string;
  description: string;
  location: string;
  duration: string;
  cover_image: string;
};

const projectsQuery = queryOptions({
  queryKey: ["projects"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("id,name,description,location,duration,cover_image")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as Project[];
  },
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(projectsQuery),
  component: Index,
});

function Index() {
  const { data: projects } = useSuspenseQuery(projectsQuery);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-border/60 bg-[image:var(--gradient-hero)] text-primary-foreground">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <span className="inline-block rounded-full border border-white/20 bg-white/5 px-4 py-1 text-xs font-medium tracking-wide">
            منصة مشاريع المقاولات
          </span>
          <h1 className="mt-5 text-4xl md:text-6xl font-extrabold leading-tight">
            اختر مشروعك،<br />
            وقدّم عرض السعر بضغطة زر
          </h1>
          <p className="mt-5 max-w-2xl text-base md:text-lg text-white/80">
            استعرض أحدث المشاريع المطروحة، اطّلع على التفاصيل والمواقع والمدد المتوقعة،
            ثم أرسل عرض سعر شركتك مباشرةً من خلال المنصة.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">المشاريع المتاحة</h2>
            <p className="mt-1 text-muted-foreground">اضغط على المشروع لعرض التفاصيل وتقديم العرض</p>
          </div>
          <span className="text-sm text-muted-foreground">{projects.length} مشروع</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <Link
              key={p.id}
              to="/projects/$projectId"
              params={{ projectId: p.id }}
              className="group overflow-hidden rounded-xl bg-card shadow-[var(--shadow-card)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={resolveImage(p.cover_image)}
                  alt={p.name}
                  loading="lazy"
                  width={1024}
                  height={768}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <span className="absolute bottom-3 right-3 rounded-full bg-[image:var(--gradient-accent)] px-3 py-1 text-xs font-semibold text-accent-foreground">
                  متاح للعروض
                </span>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold group-hover:text-accent transition-colors">{p.name}</h3>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" /> {p.location}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4" /> {p.duration}
                  </span>
                </div>
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent">
                  عرض التفاصيل <ArrowLeft className="h-4 w-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
