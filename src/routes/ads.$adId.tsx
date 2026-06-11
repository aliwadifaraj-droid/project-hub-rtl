import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getApprovedAd, listAdComments, submitAdComment } from "@/lib/ads.functions";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ArrowRight, Megaphone, MessageSquare, Send, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

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
      <Toaster position="top-center" dir="rtl" />
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

        <CommentsSection adId={ad.id} />
      </main>
      <SiteFooter />
    </div>
  );
}

function CommentsSection({ adId }: { adId: string }) {
  const qc = useQueryClient();
  const list = useServerFn(listAdComments);
  const submit = useServerFn(submitAdComment);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [body, setBody] = useState("");

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["ad-comments", adId],
    queryFn: () => list({ data: { adId } }),
  });

  const mut = useMutation({
    mutationFn: () => submit({ data: { adId, author_name: name, contact, body } }),
    onSuccess: () => {
      toast.success("تم إرسال طلبك");
      setName(""); setContact(""); setBody("");
      qc.invalidateQueries({ queryKey: ["ad-comments", adId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="mx-auto mt-8 max-w-3xl">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-bold">تعليق أو طلب مباشر</h2>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || !body.trim()) return;
            mut.mutate();
          }}
          className="grid gap-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required maxLength={80} value={name} onChange={(e) => setName(e.target.value)}
              placeholder="اسمك *"
              className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              maxLength={120} value={contact} onChange={(e) => setContact(e.target.value)}
              placeholder="رقم الجوال أو البريد (اختياري)"
              className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <textarea
            required maxLength={1000} rows={4} value={body} onChange={(e) => setBody(e.target.value)}
            placeholder="اكتب تعليقك أو طلبك..."
            className="resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={mut.isPending || !name.trim() || !body.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-sm font-semibold text-background hover:bg-foreground/90 disabled:opacity-60"
          >
            {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            إرسال
          </button>
        </form>
      </div>

      <div className="mt-6">
        <h3 className="mb-3 text-sm font-bold text-muted-foreground">
          التعليقات ({comments.length})
        </h3>
        {isLoading ? (
          <div className="grid place-items-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : comments.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            لا توجد تعليقات بعد. كن أول من يعلق.
          </p>
        ) : (
          <ul className="space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="rounded-lg border border-border bg-card p-4">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    {c.author_name}
                  </span>
                  <time className="text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString("ar")}
                  </time>
                </div>
                <p className="whitespace-pre-line text-sm text-foreground/90">{c.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
