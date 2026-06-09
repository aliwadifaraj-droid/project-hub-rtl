import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listApprovedAds } from "@/lib/ads.functions";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Loader2, Megaphone } from "lucide-react";

export const Route = createFileRoute("/ads")({
  head: () => ({
    meta: [
      { title: "الإعلانات — منصة المقاولات" },
      { name: "description", content: "تصفح آخر الإعلانات المعتمدة على المنصة." },
    ],
  }),
  component: AdsListPage,
});

function AdsListPage() {
  const list = useServerFn(listApprovedAds);
  const { data, isLoading, error } = useQuery({
    queryKey: ["approved-ads"],
    queryFn: () => list(),
  });

  return (
    <div className="flex min-h-screen flex-col bg-background" dir="rtl">
      <SiteHeader />
      <main className="container mx-auto flex-1 px-4 py-10">
        <div className="mb-6 flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          <h1 className="text-2xl font-bold">الإعلانات</h1>
        </div>

        {isLoading ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : error ? (
          <p className="text-destructive">{(error as Error).message}</p>
        ) : !data || data.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
            لا توجد إعلانات حالياً.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((ad) => (
              <Link
                key={ad.id}
                to="/ads/$adId"
                params={{ adId: ad.id }}
                className="group overflow-hidden rounded-xl border border-border bg-card transition hover:shadow-[var(--shadow-card)]"
              >
                {ad.image_signed_url ? (
                  <img
                    src={ad.image_signed_url}
                    alt={ad.title}
                    className="h-44 w-full object-cover transition group-hover:scale-105"
                  />
                ) : (
                  <div className="grid h-44 w-full place-items-center bg-secondary/50 text-muted-foreground">
                    <Megaphone className="h-8 w-8" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="mb-1 font-bold">{ad.title}</h3>
                  {ad.description ? (
                    <p className="text-sm text-muted-foreground line-clamp-2">{ad.description}</p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
