import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { upsertProject, deleteProject, listProjects } from "@/lib/admin.functions";
import { hasAdminRole } from "@/lib/role-label";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/ui/sonner";
import { Loader2, Pencil, Trash2, Plus, Upload, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/projects")({
  component: ProjectsPage,
});

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  duration: string | null;
  cover_image: string | null;
  cover_url: string;
  images: string[];
};

function ProjectsPage() {
  const list = useServerFn(listProjects);
  const upsert = useServerFn(upsertProject);
  const del = useServerFn(deleteProject);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["projects"], queryFn: () => list() });
  const [isAdmin, setIsAdmin] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [editing, setEditing] = useState<Partial<ProjectRow> | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(async ({ data: authData }) => {
      if (!authData.user || cancelled) return;
      setSignedIn(true);
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", authData.user.id);
      if (!cancelled) setIsAdmin(hasAdminRole((roles ?? []).map((r) => r.role)));
    });
    return () => { cancelled = true; };
  }, []);

  const saveMut = useMutation({
    mutationFn: (v: Partial<ProjectRow>) => upsert({ data: v as never }),
    onSuccess: (res: any) => {
      if (res?.admin_approval === "pending") {
        toast.success("تم إرسال المشروع للمراجعة من الأدمن");
      } else {
        toast.success("تم الحفظ");
      }
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["admin-projects"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["admin-projects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Toaster position="top-center" dir="rtl" />
      <main className="container mx-auto px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">المشاريع ({data?.length ?? 0})</h1>
          {isAdmin ? (
            <button
              onClick={() => setEditing({ name: "", description: "", location: "", duration: "", cover_image: "", images: [] })}
              className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-sm font-semibold text-background hover:bg-foreground/90"
            >
              <Plus className="h-4 w-4" /> مشروع جديد
            </button>
          ) : null}
        </div>

        {isLoading ? (
          <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(data ?? []).map((p) => (
              <div key={p.id} className="overflow-hidden rounded-xl border border-border bg-card">
                {p.cover_url ? (
                  <img src={p.cover_url} alt={p.name} className="aspect-video w-full object-cover" />
                ) : <div className="aspect-video w-full bg-secondary" />}
                <div className="p-4">
                  <h3 className="font-bold">{p.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{p.location} • {p.duration}</p>
                  {isAdmin ? (
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => setEditing(p)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary">
                        <Pencil className="h-3.5 w-3.5" /> تعديل
                      </button>
                      <button
                        onClick={() => { if (confirm("تأكيد الحذف؟")) delMut.mutate(p.id); }}
                        className="inline-flex items-center justify-center gap-1 rounded-md border border-destructive/30 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> حذف
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}

        {editing ? <ProjectModal value={editing} onClose={() => setEditing(null)} onSave={(v) => saveMut.mutate(v)} saving={saveMut.isPending} /> : null}
      </main>
      <SiteFooter />
    </div>
  );
}

function ProjectModal({
  value, onClose, onSave, saving,
}: { value: Partial<ProjectRow>; onClose: () => void; onSave: (v: Partial<ProjectRow>) => void; saving: boolean }) {
  const [form, setForm] = useState<Partial<ProjectRow>>(value);
  const [uploading, setUploading] = useState(false);

  async function uploadFile(file: File): Promise<string> {
    const path = `projects/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
    const { error } = await supabase.storage.from("project-images").upload(path, file, {
      contentType: file.type,
    });
    if (error) throw error;
    return path;
  }

  async function onCover(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    setUploading(true);
    try {
      const path = await uploadFile(f);
      setForm((s) => ({ ...s, cover_image: path }));
      toast.success("تم رفع صورة الغلاف");
    } catch (err) { toast.error("فشل الرفع"); console.error(err); }
    finally { setUploading(false); }
  }
  async function onGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []); if (files.length === 0) return;
    setUploading(true);
    try {
      const paths = await Promise.all(files.map(uploadFile));
      setForm((s) => ({ ...s, images: [...(s.images ?? []), ...paths] }));
    } catch { toast.error("فشل رفع الصور"); }
    finally { setUploading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-card p-6 shadow-xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{form.id ? "تعديل مشروع" : "مشروع جديد"}</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-secondary"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4">
          <Field label="اسم المشروع">
            <input className="inp" value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="الوصف">
            <textarea rows={4} className="inp" value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="الموقع">
              <input className="inp" value={form.location ?? ""} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </Field>
            <Field label="المدة المتوقعة">
              <input className="inp" value={form.duration ?? ""} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
            </Field>
          </div>
          <Field label="صورة الغلاف">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-border bg-secondary/40 px-3 py-3 text-sm hover:bg-secondary">
              <Upload className="h-4 w-4" />
              <span className="flex-1 text-muted-foreground truncate">{form.cover_image || "اختر صورة"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={onCover} />
            </label>
          </Field>
          <Field label={`معرض الصور (${form.images?.length ?? 0})`}>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-border bg-secondary/40 px-3 py-3 text-sm hover:bg-secondary">
              <Upload className="h-4 w-4" />
              <span className="flex-1 text-muted-foreground">إضافة صور</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={onGallery} />
            </label>
          </Field>
        </div>
        <div className="mt-6 flex gap-2">
          <button
            disabled={saving || uploading || !form.name || !form.cover_image}
            onClick={() => onSave(form)}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-sm font-semibold text-background hover:bg-foreground/90 disabled:opacity-60"
          >
            {(saving || uploading) ? <Loader2 className="h-4 w-4 animate-spin" /> : null} حفظ
          </button>
          <button onClick={onClose} className="rounded-md border border-border px-4 py-2.5 text-sm hover:bg-secondary">إلغاء</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-sm font-semibold">{label}</label>{children}</div>;
}
