import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { createAd } from "@/lib/ads.functions";
import { Loader2, Megaphone, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/_authenticated/ads/new")({
  component: NewAdPage,
});

function NewAdPage() {
  const navigate = useNavigate();
  const submit = useServerFn(createAd);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const mut = useMutation({
    mutationFn: () => submit({ data: { title, description, image_url: imageUrl, link_url: linkUrl } }),
    onSuccess: () => {
      toast.success("تم إرسال الإعلان للمراجعة");
      setTimeout(() => navigate({ to: "/admin" }), 800);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-secondary/30 py-10">
      <Toaster position="top-center" dir="rtl" />
      <div className="container mx-auto max-w-2xl px-4">
        <Link to="/admin" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowRight className="h-4 w-4" /> رجوع
        </Link>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[image:var(--gradient-accent)] text-accent-foreground">
              <Megaphone className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold">إضافة إعلان</h1>
              <p className="text-sm text-muted-foreground">سيُراجع الإعلان قبل النشر.</p>
            </div>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}
            className="space-y-4"
          >
            <div>
              <label className="mb-1.5 block text-sm font-semibold">العنوان *</label>
              <input
                required
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="inp"
                placeholder="عنوان الإعلان"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">الوصف</label>
              <textarea
                maxLength={2000}
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="inp resize-y"
                placeholder="تفاصيل الإعلان"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">رابط الصورة</label>
              <input
                type="url"
                maxLength={1000}
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="inp"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">الرابط</label>
              <input
                type="url"
                maxLength={1000}
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="inp"
                placeholder="https://..."
              />
            </div>
            <button
              type="submit"
              disabled={mut.isPending || !title.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-sm font-semibold text-background hover:bg-foreground/90 disabled:opacity-60"
            >
              {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              إرسال الإعلان
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
