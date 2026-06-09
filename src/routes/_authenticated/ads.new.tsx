import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { createAd } from "@/lib/ads.functions";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Megaphone, ArrowRight, Upload, X } from "lucide-react";
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
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function pickFile(f: File | null) {
    if (!f) {
      setFile(null);
      setPreviewUrl("");
      return;
    }
    if (!f.type.startsWith("image/")) {
      toast.error("اختر صورة فقط");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error("الحد الأقصى 5 ميغابايت");
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }

  const mut = useMutation({
    mutationFn: async () => {
      let imagePath = "";
      if (file) {
        setUploading(true);
        const { data: u } = await supabase.auth.getUser();
        const uid = u.user?.id ?? "anon";
        const safe = file.name.replace(/[^\w.\-]/g, "_").slice(-80);
        const path = `ads/${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
        const { error: upErr } = await supabase.storage
          .from("project-images")
          .upload(path, file, { contentType: file.type, upsert: false });
        setUploading(false);
        if (upErr) throw new Error(upErr.message);
        imagePath = path;
      }
      return submit({ data: { title, description, image_url: imagePath } });
    },
    onSuccess: (res) => {
      toast.success("تم إرسال الإعلان للمراجعة");
      const link = res?.link_url ? `${window.location.origin}${res.link_url}` : "";
      if (link) {
        navigator.clipboard?.writeText(link).catch(() => {});
        toast.message("الرابط التلقائي للإعلان", { description: link });
      }
      setTimeout(() => navigate({ to: "/admin" }), 1200);
    },
    onError: (e: Error) => {
      setUploading(false);
      toast.error(e.message);
    },
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
              <p className="text-sm text-muted-foreground">سيُراجع الإعلان قبل النشر. يُولَّد رابط الإعلان تلقائياً.</p>
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
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
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
                className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="تفاصيل الإعلان"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold">صورة الإعلان</label>
              {!previewUrl ? (
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-border bg-secondary/40 px-4 py-5 text-sm hover:bg-secondary transition">
                  <Upload className="h-5 w-5 text-accent" />
                  <span className="flex-1 text-muted-foreground">
                    اضغط لرفع صورة من جهازك (PNG/JPG/WEBP — حتى 5 ميغابايت)
                  </span>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative overflow-hidden rounded-lg border border-border">
                  <img src={previewUrl} alt="معاينة" className="h-56 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => pickFile(null)}
                    className="absolute top-2 left-2 grid h-7 w-7 place-items-center rounded-full bg-background/90 text-foreground hover:bg-background"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={mut.isPending || uploading || !title.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-sm font-semibold text-background hover:bg-foreground/90 disabled:opacity-60"
            >
              {(mut.isPending || uploading) ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {uploading ? "جاري رفع الصورة..." : "إرسال الإعلان"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
