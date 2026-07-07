import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { adminListBotQa, adminUpsertBotQa, adminDeleteBotQa } from "@/lib/support.functions";
import { Bot, Plus, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/bot-training")({
  component: BotTrainingPage,
});

type QaAction = "none" | "escalate";
type QaRow = {
  id: string; question: string; answer: string;
  keywords: string[]; is_active: boolean; sort_order: number; action: QaAction;
};
const ACTION_LABEL: Record<QaAction, string> = { none: "بدون", escalate: "تحويل لموظف" };

function BotTrainingPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListBotQa);
  const upsertFn = useServerFn(adminUpsertBotQa);
  const delFn = useServerFn(adminDeleteBotQa);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-bot-qa"],
    queryFn: () => listFn(),
  });

  const [editing, setEditing] = useState<Partial<QaRow> | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editing && editorRef.current) {
      editorRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      const first = editorRef.current.querySelector<HTMLInputElement>("input,textarea");
      first?.focus();
    }
  }, [editing?.id, editing && !editing.id]);

  function startNew() {
    setEditing({ question: "", answer: "", keywords: [], is_active: true, sort_order: (rows.length + 1) * 10, action: "none" });
  }

  async function save() {
    if (!editing) return;

    // Check for duplicate keywords across other questions
    const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "");
    const newKeywords = (editing.keywords ?? []).map(normalize).filter(Boolean);

    for (const row of rows) {
      if (editing.id && row.id === editing.id) continue;
      const existing = (Array.isArray(row.keywords) ? row.keywords : []).map(normalize);
      for (let i = 0; i < newKeywords.length; i++) {
        if (existing.includes(newKeywords[i])) {
          toast.error(`خطأ: كلمة [${(editing.keywords ?? [])[i]}] موجودة في سؤال [${row.question}]. غيرها`);
          return;
        }
      }
    }

    try {
      await upsertFn({
        data: {
          id: editing.id ?? null,
          question: editing.question ?? "",
          answer: editing.answer ?? "",
          keywords: editing.keywords ?? [],
          is_active: editing.is_active ?? true,
          sort_order: editing.sort_order ?? 0,
        },
      });
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-bot-qa"] });
      toast.success("تم الحفظ");
    } catch (err: any) {
      toast.error(err?.message ?? "تعذر الحفظ");
    }
  }


  async function remove(id: string) {
    if (!confirm("حذف هذا السؤال؟")) return;
    await delFn({ data: { id } });
    qc.invalidateQueries({ queryKey: ["admin-bot-qa"] });
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[image:var(--gradient-accent)] text-accent-foreground">
            <Bot className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold">تدريب البوت</h1>
            <p className="text-xs text-muted-foreground">أضف أسئلة وأجوبة يستخدمها البوت مع العملاء</p>
          </div>
        </div>
        <button onClick={startNew} className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background">
          <Plus className="h-4 w-4" /> إضافة سؤال
        </button>
      </div>

      {editing && (
        <div ref={editorRef} className="mb-4 rounded-xl border border-border bg-background p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold">{editing.id ? "تعديل سؤال" : "سؤال جديد"}</h2>
            <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold">السؤال</label>
              <input value={editing.question ?? ""} onChange={(e) => setEditing({ ...editing, question: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">الإجابة</label>
              <textarea rows={4} value={editing.answer ?? ""} onChange={(e) => setEditing({ ...editing, answer: e.target.value })} className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">كلمات مفتاحية (مفصولة بفاصلة)</label>
              <input
                value={(editing.keywords ?? []).join(", ")}
                onChange={(e) => setEditing({ ...editing, keywords: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={editing.is_active ?? true} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
                مفعل
              </label>
              <label className="flex items-center gap-2 text-xs">
                الترتيب:
                <input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: parseInt(e.target.value || "0") })} className="w-20 rounded-md border border-input bg-background px-2 py-1 text-sm" />
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="rounded-md border border-border px-3 py-1.5 text-sm">إلغاء</button>
              <button onClick={save} className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background">
                <Save className="h-4 w-4" /> حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-background">
        {isLoading ? (
          <p className="p-4 text-center text-sm text-muted-foreground">جاري التحميل…</p>
        ) : rows.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">لا توجد أسئلة بعد</p>
        ) : (
          <table className="w-full text-right text-sm">
            <thead className="bg-secondary/50 text-xs">
              <tr>
                <th className="p-3">السؤال</th>
                <th className="p-3">الإجابة</th>
                <th className="p-3">الحالة</th>
                <th className="p-3">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3 font-medium">{r.question}</td>
                  <td className="p-3 text-muted-foreground line-clamp-2 max-w-md">{r.answer}</td>
                  <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-[10px] ${r.is_active ? "bg-accent/20 text-accent-foreground" : "bg-muted text-muted-foreground"}`}>{r.is_active ? "مفعل" : "معطل"}</span></td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={() => setEditing({ id: r.id, question: r.question, answer: r.answer, keywords: Array.isArray(r.keywords) ? [...r.keywords] : [], is_active: r.is_active, sort_order: r.sort_order })} className="rounded-md border border-border px-2 py-1 text-xs hover:bg-secondary">تعديل</button>
                      <button onClick={() => remove(r.id)} className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-3 w-3" /> حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
