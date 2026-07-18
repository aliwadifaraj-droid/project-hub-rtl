import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { registerUploadedFile } from "@/lib/files.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/upload")({
  component: UploadPage,
  head: () => ({
    meta: [{ title: "رفع الملفات" }],
  }),
});

type Uploaded = { id: string; key: string; filename: string; url: string };

function UploadPage() {
  const register = useServerFn(registerUploadedFile);

  const [file, setFile] = useState<File | null>(null);
  const [purpose, setPurpose] =
    useState<"project-image" | "bid-pdf" | "vip-receipt" | "other">("other");
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<Uploaded[]>([]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    try {
      // Upload via server route (runs on Vercel, no CORS issues, supports images + PDF)
      const fd = new FormData();
      fd.append("file", file);
      fd.append("purpose", purpose);
      const resp = await fetch("/api/public/upload", { method: "POST", body: fd });
      const up = await resp.json();
      if (!resp.ok || !up?.ok) throw new Error(up?.error || `فشل الرفع (${resp.status})`);

      // Save metadata + URL in Turso
      const res = await register({
        data: {
          key: up.key,
          filename: file.name,
          mime: file.type || undefined,
          size: file.size,
          purpose,
          publicUrl: up.url,
        },
      });

      setItems((prev) => [
        { id: res.id, key: up.key, filename: file.name, url: up.url },
        ...prev,
      ]);
      const input = document.getElementById("file-input") as HTMLInputElement | null;
      if (input) input.value = "";
      setFile(null);
      toast.success("تم الرفع وحفظ الرابط في القاعدة");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل الرفع");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container mx-auto max-w-2xl p-6" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">رفع ملف إلى R2</h1>

      <form onSubmit={onSubmit} className="space-y-4 bg-card p-6 rounded-lg border">
        <div>
          <Label htmlFor="file-input">الملف</Label>
          <Input
            id="file-input"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
          />
        </div>

        <div>
          <Label>الغرض</Label>
          <Select value={purpose} onValueChange={(v) => setPurpose(v as typeof purpose)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="project-image">صورة مشروع</SelectItem>
              <SelectItem value="bid-pdf">عرض PDF</SelectItem>
              <SelectItem value="vip-receipt">إيصال VIP</SelectItem>
              <SelectItem value="other">آخر</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" disabled={!file || busy} className="w-full">
          {busy ? "جاري الرفع..." : "رفع مباشرة إلى R2"}
        </Button>
      </form>

      {items.length > 0 && (
        <div className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold">الملفات المرفوعة</h2>
          {items.map((it) => (
            <div key={it.id} className="p-4 border rounded-lg bg-card">
              <div className="font-medium">{it.filename}</div>
              <div className="text-xs text-muted-foreground mt-1 break-all">{it.key}</div>
              <a
                href={it.url}
                target="_blank"
                rel="noreferrer"
                className="text-primary text-sm mt-2 inline-block underline break-all"
              >
                {it.url}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
