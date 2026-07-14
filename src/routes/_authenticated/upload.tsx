import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { uploadFile, getFileUrl } from "@/lib/files.functions";
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

type Uploaded = { id: string; key: string; filename: string; url?: string };

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function UploadPage() {
  const upload = useServerFn(uploadFile);
  const signUrl = useServerFn(getFileUrl);

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
      const data = await fileToBase64(file);
      const res = await upload({
        data: { filename: file.name, mime: file.type || undefined, purpose, data },
      });
      const signed = await signUrl({ data: { id: res.id, expiresIn: 3600 } });
      setItems((prev) => [
        { id: res.id, key: res.key, filename: file.name, url: signed.url },
        ...prev,
      ]);
      setFile(null);
      (document.getElementById("file-input") as HTMLInputElement | null)?.value &&
        ((document.getElementById("file-input") as HTMLInputElement).value = "");
      toast.success("تم رفع الملف بنجاح");
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
          <Label htmlFor="file-input">الملف (حتى 20MB)</Label>
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
          {busy ? "جاري الرفع..." : "رفع"}
        </Button>
      </form>

      {items.length > 0 && (
        <div className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold">الملفات المرفوعة</h2>
          {items.map((it) => (
            <div key={it.id} className="p-4 border rounded-lg bg-card">
              <div className="font-medium">{it.filename}</div>
              <div className="text-xs text-muted-foreground mt-1 break-all">{it.key}</div>
              {it.url && (
                <a
                  href={it.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary text-sm mt-2 inline-block underline"
                >
                  فتح الرابط (صالح ساعة)
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
