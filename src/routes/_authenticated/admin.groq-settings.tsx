import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Bot, Save, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/groq-settings")({
  component: GeminiSettingsPage,
});

type GeminiCfg = {
  systemInstruction: string;
  dialect: string;
  botName: string;
  blockedReplies: string[];
  scope: string;
};

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchCfg(): Promise<GeminiCfg> {
  const res = await fetch("/api/admin/bot-settings", { headers: await authHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function saveCfg(cfg: GeminiCfg) {
  const res = await fetch("/api/admin/bot-settings", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(cfg),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function GeminiSettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["gemini-cfg"], queryFn: fetchCfg });

  const [systemInstruction, setSystem] = useState("");
  const [dialect, setDialect] = useState("");
  const [botName, setBotName] = useState("");
  const [blocked, setBlocked] = useState<string[]>([]);
  const [newBlocked, setNewBlocked] = useState("");
  const [scope, setScope] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setSystem(data.systemInstruction);
    setDialect(data.dialect);
    setBotName(data.botName);
    setBlocked(data.blockedReplies ?? []);
    setScope(data.scope);
  }, [data]);

  async function save() {
    setSaving(true);
    try {
      await saveCfg({ systemInstruction, dialect, botName, blockedReplies: blocked, scope });
      qc.invalidateQueries({ queryKey: ["gemini-cfg"] });
      toast.success("تم حفظ إعدادات Groq");
    } catch (e: any) {
      toast.error(e?.message ?? "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  }

  function addBlocked() {
    const v = newBlocked.trim();
    if (!v) return;
    if (blocked.includes(v)) { setNewBlocked(""); return; }
    setBlocked([...blocked, v]);
    setNewBlocked("");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-[image:var(--gradient-accent)] text-accent-foreground">
          <Bot className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold">إعدادات Groq</h1>
          <p className="text-xs text-muted-foreground">تحكم في شخصية البوت ونطاق ردوده</p>
        </div>
      </div>

      {isLoading ? (
        <p className="p-4 text-center text-sm text-muted-foreground">جاري التحميل…</p>
      ) : (
        <div className="space-y-4">
          <section className="rounded-xl border border-border bg-background p-4 shadow-sm">
            <label className="mb-1 block text-xs font-semibold">System Instruction</label>
            <textarea
              rows={5}
              value={systemInstruction}
              onChange={(e) => setSystem(e.target.value)}
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="مثال: أنت مساعد ودود..."
            />
          </section>

          <section className="rounded-xl border border-border bg-background p-4 shadow-sm">
            <label className="mb-1 block text-xs font-semibold">اللهجة</label>
            <input
              value={dialect}
              onChange={(e) => setDialect(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="سعودي، مصري، فصحى..."
            />
          </section>

          <section className="rounded-xl border border-border bg-background p-4 shadow-sm">
            <label className="mb-1 block text-xs font-semibold">اسم البوت</label>
            <input
              value={botName}
              onChange={(e) => setBotName(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="مساعد العمران"
            />
          </section>

          <section className="rounded-xl border border-border bg-background p-4 shadow-sm">
            <label className="mb-1 block text-xs font-semibold">الردود الممنوعة</label>
            <div className="mb-2 flex flex-wrap gap-2">
              {blocked.length === 0 && <span className="text-xs text-muted-foreground">لا يوجد</span>}
              {blocked.map((b, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs">
                  {b}
                  <button
                    type="button"
                    onClick={() => setBlocked(blocked.filter((_, j) => j !== i))}
                    className="grid h-4 w-4 place-items-center rounded-full hover:bg-background"
                    aria-label="حذف"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newBlocked}
                onChange={(e) => setNewBlocked(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addBlocked(); } }}
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="أضف كلمة أو عبارة ممنوعة..."
              />
              <button
                type="button"
                onClick={addBlocked}
                className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary"
              >
                <Plus className="h-4 w-4" /> إضافة
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">أي رد يحتوي على أحد هذه العبارات سيتم استبداله برسالة تحويل للموظف.</p>
          </section>

          <section className="rounded-xl border border-border bg-background p-4 shadow-sm">
            <label className="mb-1 block text-xs font-semibold">نطاق عمل البوت</label>
            <textarea
              rows={4}
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="مثال: الرد على أسئلة المشاريع والمنصة فقط."
            />
          </section>

          <div className="flex justify-end">
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
            >
              <Save className="h-4 w-4" /> {saving ? "جارٍ الحفظ…" : "حفظ"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
