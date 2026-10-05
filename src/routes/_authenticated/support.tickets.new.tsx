import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTicket } from "@/lib/tickets.functions";
import { Loader2, Send, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { SupportWidget } from "@/components/support-widget";

export const Route = createFileRoute("/_authenticated/support/tickets/new")({
  ssr: false,
  head: () => ({
    meta: [{ title: "تذكرة جديدة | العمران" }],
  }),
  component: NewTicketPage,
});

const CATEGORIES = [
  { value: "order", label: "طلب" },
  { value: "payment", label: "دفع" },
  { value: "technical", label: "فني" },
  { value: "general", label: "استفسار عام" },
];

const PRIORITIES = [
  { value: "low", label: "منخفضة" },
  { value: "medium", label: "متوسطة" },
  { value: "high", label: "عالية" },
];

function NewTicketPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const createFn = useServerFn(createTicket);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [orderId, setOrderId] = useState("");
  const [priority, setPriority] = useState("medium");
  const [message, setMessage] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");

  const mut = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          subject: subject.trim(),
          category,
          order_id: orderId.trim() || null,
          priority,
          message: message.trim(),
          attachment_url: attachmentUrl.trim() || null,
        },
      }),
    onSuccess: (res) => {
      toast.success("تم إنشاء التذكرة بنجاح");
      qc.invalidateQueries({ queryKey: ["my-tickets"] });
      navigate({ to: "/support/tickets/$id", params: { id: res.id } });
    },
    onError: (e: Error) => toast.error(e.message || "تعذر إنشاء التذكرة"),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("يرجى ملء العنوان والوصف");
      return;
    }
    mut.mutate();
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="border-b border-border bg-secondary/30">
        <div className="container mx-auto flex items-center px-4 py-4">
          <Link to="/support/tickets" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
            <ArrowRight className="h-4 w-4" />
            رجوع لتذاكري
          </Link>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold">تذكرة دعم جديدة</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          املأ النموذج وسيتواصل معك فريق الدعم في أقرب وقت.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium">التصنيف</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">رقم الطلب (اختياري)</label>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="مثال: ORD-1234"
              maxLength={100}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">العنوان</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="موضوع المشكلة"
              maxLength={200}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">الأولوية</label>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={`rounded-lg border px-4 py-2 text-sm transition ${
                    priority === p.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-secondary"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">الوصف</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="اشرح مشكلتك بالتفصيل..."
              maxLength={5000}
              className="w-full resize-none rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">رابط مرفق (اختياري)</label>
            <input
              type="url"
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            disabled={mut.isPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            إرسال التذكرة
          </button>
        </form>
      </div>
      <SupportWidget />
    </div>
  );
}
