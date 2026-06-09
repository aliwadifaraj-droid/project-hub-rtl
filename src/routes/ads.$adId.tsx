import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getApprovedAd } from "@/lib/ads.functions";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ArrowRight, Megaphone } from "lucide-react";

export const Route = createFileRoute("/ads/$adId")({
  loader: async ({ params }) => {
    const ad = await getApprovedAd({ data: { id: params.adId } });
    if (!ad) throw notFound();
    return ad;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.title} — إعلان` : "إعلان" },
      { name: "description", content: loaderData?.description?.slice(0, 160) ?? "" },
      { property: "og:title", content: loaderData?.title ?? "إعلان" },
      { property: "og:description", content: loaderData?.description?.slice(0, 160) ?? "" },
      ...(loaderData?.image_signed_url ? [{ property: "og:image", content: loaderData.image_signed_url }] : []),
    ],
  }),
  errorComponent: ({ error }) => (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <p className="text-destructive">{error.message}</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <p className="text-muted-foreground">الإعلان غير متوفر.</p>
    </div>
  ),
  component: AdDetailPage,
});

function AdDetailPage() {
  const ad = Route.useLoaderData();
  return (
    <div className="flex min-h-screen flex-col bg-background" dir="rtl">
      <SiteHeader />
      <main className="container mx-auto flex-1 px-4 py-10">
        <Link to="/ads" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowRight className="h-4 w-4" /> كل الإعلانات
        </Link>
        <article className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
          {ad.image_signed_url ? (
            <img src={ad.image_signed_url} alt={ad.title} className="max-h-[500px] w-full object-cover" />
          ) : (
            <div className="grid h-60 w-full place-items-center bg-secondary/50 text-muted-foreground">
              <Megaphone className="h-10 w-10" />
            </div>
          )}
          <div className="p-6 md:p-8">
            <h1 className="text-2xl font-extrabold md:text-3xl">{ad.title}</h1>
            {ad.description ? (
              <p className="mt-4 whitespace-pre-line text-muted-foreground">{ad.description}</p>
            ) : null}
            <p className="mt-6 text-xs text-muted-foreground">
              نُشر في {new Date(ad.created_at).toLocaleDateString("ar")}
            </p>
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
