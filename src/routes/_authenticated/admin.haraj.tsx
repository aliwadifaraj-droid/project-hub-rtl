import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  adminListTeachers, deleteTeacher, toggleBanTeacher,
  createHarajOffer, listActiveHarajOffers, assignHarajTeacher,
  adminListTeacherSubscriptions, approveTeacherSubscription, rejectTeacherSubscription,
} from "@/lib/haraj.functions";
import { uploadFile as uploadStoredFile } from "@/lib/files.functions";
import { SAUDI_CITIES } from "@/lib/saudi-cities";
import { Loader2, Hammer, Trash2, Ban, Unlock, Plus, List, Upload, X, CheckCircle2, UserCheck, Phone, MapPin, Star, Check, XCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/haraj")({
  component: AdminHarajPage,
});

type AdminTab = "teachers" | "add-offer" | "active-offers" | "subscriptions";

type AdminOffer = {
  id: string;
  work_name: string;
  description: string;
  city: string;
  owner_phone: string;
  status: string;
  created_at: string;
  images: string[];
  interests: AdminInterest[];
};

type AdminInterest = {
  id: string;
  teacher_id: string;
  teacher_name: string;
  teacher_phone: string;
  teacher_city: string;
  teacher_profession: string;
};

function AdminHarajPage() {
  const [tab, setTab] = useState<AdminTab>("teachers");
  const list = useServerFn(adminListTeachers);
  const remove = useServerFn(deleteTeacher);
  const toggleBan = useServerFn(toggleBanTeacher);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-haraj-teachers"],
    queryFn: () => list(),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("تم حذف المعلم");
      qc.invalidateQueries({ queryKey: ["admin-haraj-teachers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const banMut = useMutation({
    mutationFn: (id: string) => toggleBan({ data: { id } }),
    onSuccess: (res: { ok: boolean; status: string }) => {
      toast.success(res.status === "banned" ? "تم حظر المعلم" : "تم فك الحظر");
      qc.invalidateQueries({ queryKey: ["admin-haraj-teachers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = data?.rows ?? [];
  const isAdmin = data?.isAdmin ?? false;

  const tabs: { key: AdminTab; label: string; icon: typeof Hammer }[] = [
    { key: "teachers", label: "المعلمون", icon: Hammer },
    { key: "subscriptions", label: "طلبات الاشتراك", icon: Star },
    { key: "add-offer", label: "إضافة عرض للمعلمين", icon: Plus },
    { key: "active-offers", label: "العروض النشطة", icon: List },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Hammer className="h-5 w-5 text-amber-600" />
        <h1 className="text-2xl font-bold">حراج المعلمين</h1>
        <span className="rounded-full bg-amber-500/15 px-3 py-0.5 text-xs font-medium text-amber-600">
          {rows.length} معلم
        </span>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto border-b border-border pb-px">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative inline-flex items-center gap-1.5 whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-medium transition ${
              tab === t.key
                ? "border-b-2 border-amber-600 text-amber-600"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "teachers" && (
        <>
          {isLoading && (
            <div className="grid place-items-center py-20">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          {error && <p className="text-destructive">{(error as Error).message}</p>}
          {rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
              لا يوجد معلمون مسجلون حالياً.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-right">
                    <th className="px-4 py-3 font-semibold">الاسم</th>
                    <th className="px-4 py-3 font-semibold">الجوال</th>
                    <th className="px-4 py-3 font-semibold">المدينة</th>
                    <th className="px-4 py-3 font-semibold">المهنة</th>
                    <th className="px-4 py-3 font-semibold">البريد</th>
                    <th className="px-4 py-3 font-semibold">تاريخ التسجيل</th>
                    <th className="px-4 py-3 font-semibold">الحالة</th>
                    {isAdmin && <th className="px-4 py-3 font-semibold">إجراءات</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-border/60 last:border-0 hover:bg-secondary/20 transition"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">{t.full_name}</td>
                      <td className="px-4 py-3 text-muted-foreground" dir="ltr">{t.phone}</td>
                      <td className="px-4 py-3 text-muted-foreground">{t.city}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600">
                          {t.profession}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground" dir="ltr">{t.email}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(t.created_at).toLocaleDateString("ar")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            t.status === "banned"
                              ? "bg-destructive/15 text-destructive"
                              : "bg-green-500/15 text-green-600"
                          }`}
                        >
                          {t.status === "banned" ? "محظور" : "نشط"}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                if (confirm("حذف هذا المعلم نهائياً؟")) deleteMut.mutate(t.id);
                              }}
                              disabled={deleteMut.isPending || banMut.isPending}
                              className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-2.5 py-1.5 text-xs font-semibold text-destructive transition hover:bg-destructive/10 disabled:opacity-60"
                              title="حذف"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> حذف
                            </button>
                            <button
                              onClick={() => banMut.mutate(t.id)}
                              disabled={deleteMut.isPending || banMut.isPending}
                              className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
                                t.status === "banned"
                                  ? "border-green-500/40 text-green-600 hover:bg-green-500/10"
                                  : "border-orange-500/40 text-orange-600 hover:bg-orange-500/10"
                              }`}
                              title={t.status === "banned" ? "فك الحظر" : "حظر"}
                            >
                              {t.status === "banned" ? (
                                <>
                                  <Unlock className="h-3.5 w-3.5" /> فك الحظر
                                </>
                              ) : (
                                <>
                                  <Ban className="h-3.5 w-3.5" /> حظر
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === "add-offer" && <AddOfferForm />}
      {tab === "active-offers" && <ActiveOffersList />}
      {tab === "subscriptions" && <TeacherSubscriptionsTab />}
    </div>
  );
}

function TeacherSubscriptionsTab() {
  const listFn = useServerFn(adminListTeacherSubscriptions);
  const approveFn = useServerFn(approveTeacherSubscription);
  const rejectFn = useServerFn(rejectTeacherSubscription);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-teacher-subscriptions"],
    queryFn: () => listFn(),
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => approveFn({ data: { id } }),
    onSuccess: () => {
      toast.success("تم تفعيل الاشتراك");
      qc.invalidateQueries({ queryKey: ["admin-teacher-subscriptions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejectMut = useMutation({
    mutationFn: (id: string) => rejectFn({ data: { id } }),
    onSuccess: () => {
      toast.success("تم رفض الطلب");
      qc.invalidateQueries({ queryKey: ["admin-teacher-subscriptions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const subs = (data ?? []) as Array<{
    id: string;
    teacher_email: string;
    name: string;
    plan: string;
    city: string;
    status: string;
    expires_at: string | null;
    receipt_path: string;
    receipt_url: string | null;
    created_at: string;
  }>;

  if (isLoading)
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  if (error) return <p className="text-destructive">{(error as Error).message}</p>;

  if (subs.length === 0)
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
        لا توجد طلبات اشتراك حالياً.
      </div>
    );

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary/30 text-right">
            <th className="px-4 py-3 font-semibold">الاسم</th>
            <th className="px-4 py-3 font-semibold">البريد</th>
            <th className="px-4 py-3 font-semibold">الباقة</th>
            <th className="px-4 py-3 font-semibold">المدينة</th>
            <th className="px-4 py-3 font-semibold">التاريخ</th>
            <th className="px-4 py-3 font-semibold">الحالة</th>
            <th className="px-4 py-3 font-semibold">الإيصال</th>
            <th className="px-4 py-3 font-semibold">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {subs.map((s) => (
            <tr key={s.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/20 transition">
              <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
              <td className="px-4 py-3 text-muted-foreground" dir="ltr">{s.teacher_email}</td>
              <td className="px-4 py-3 text-muted-foreground">{s.plan}</td>
              <td className="px-4 py-3 text-muted-foreground">{s.city}</td>
              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                {new Date(s.created_at).toLocaleDateString("ar")}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    s.status === "active"
                      ? "bg-green-500/15 text-green-600"
                      : s.status === "pending"
                        ? "bg-amber-500/15 text-amber-600"
                        : s.status === "expired"
                          ? "bg-gray-500/15 text-gray-600"
                          : "bg-destructive/15 text-destructive"
                  }`}
                >
                  {s.status === "active"
                    ? "نشط"
                    : s.status === "pending"
                      ? "قيد المراجعة"
                      : s.status === "expired"
                        ? "منتهي"
                        : "مرفوض"}
                </span>
              </td>
              <td className="px-4 py-3">
                {s.receipt_url ? (
                  <a
                    href={s.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-amber-600 hover:underline"
                  >
                    عرض
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                {s.status === "pending" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => approveMut.mutate(s.id)}
                      disabled={approveMut.isPending || rejectMut.isPending}
                      className="inline-flex items-center gap-1 rounded-md border border-green-500/40 px-2.5 py-1.5 text-xs font-semibold text-green-600 transition hover:bg-green-500/10 disabled:opacity-60"
                      title="تفعيل"
                    >
                      <Check className="h-3.5 w-3.5" /> تفعيل
                    </button>
                    <button
                      onClick={() => rejectMut.mutate(s.id)}
                      disabled={approveMut.isPending || rejectMut.isPending}
                      className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-2.5 py-1.5 text-xs font-semibold text-destructive transition hover:bg-destructive/10 disabled:opacity-60"
                      title="رفض"
                    >
                      <XCircle className="h-3.5 w-3.5" /> رفض
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AddOfferForm() {
  const create = useServerFn(createHarajOffer);
  const upload = useServerFn(uploadStoredFile);
  const qc = useQueryClient();
  const [form, setForm] = useState({
    work_name: "",
    description: "",
    city: "",
    owner_phone: "",
  });
  const [imageKeys, setImageKeys] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function onImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      const keys = await Promise.all(
        files.map(async (file) => {
          const data = await fileToBase64(file);
          const res = await upload({ data: { filename: file.name, mime: file.type, purpose: "project-image", data } });
          return res.key;
        }),
      );
      setImageKeys((prev) => [...prev, ...keys]);
      toast.success("تم رفع الصور");
    } catch {
      toast.error("فشل رفع الصور");
    } finally {
      setUploading(false);
    }
  }

  function validate(): boolean {
    if (!form.work_name.trim()) { setError("اسم العمل مطلوب"); return false; }
    if (!form.description.trim()) { setError("النص مطلوب"); return false; }
    if (!form.city) { setError("المدينة مطلوبة"); return false; }
    if (!/^05\d{8}$/.test(form.owner_phone.trim())) { setError("رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام"); return false; }
    setError("");
    return true;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await create({
        data: {
          work_name: form.work_name.trim(),
          description: form.description.trim(),
          city: form.city,
          owner_phone: form.owner_phone.trim(),
          image_keys: imageKeys.join(","),
        },
      });
      toast.success("تم إرسال العرض للمعلمين بنجاح");
      setDone(true);
      qc.invalidateQueries({ queryKey: ["admin-haraj-offers"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-500/15 text-green-600">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h2 className="mt-4 text-xl font-bold">تم إرسال العرض بنجاح</h2>
        <p className="mt-2 text-sm text-muted-foreground">العرض الآن متاح للمعلمين في مدينة {form.city}</p>
        <button
          onClick={() => {
            setForm({ work_name: "", description: "", city: "", owner_phone: "" });
            setImageKeys([]);
            setDone(false);
          }}
          className="mt-6 inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          إضافة عرض آخر
        </button>
      </div>
    );
  }

  const inputCls = "w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary/20";

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div>
        <label className="mb-1.5 block text-sm font-semibold">اسم العمل <span className="text-destructive">*</span></label>
        <input
          className={inputCls}
          value={form.work_name}
          onChange={(e) => setForm({ ...form, work_name: e.target.value })}
          placeholder="مثال: تشطيب فيلا"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold">النص <span className="text-destructive">*</span></label>
        <textarea
          className={inputCls}
          rows={5}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="تفاصيل العمل المطلوب..."
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold">صور العمل</label>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-border bg-secondary/40 px-4 py-4 text-sm hover:bg-secondary transition">
          <Upload className="h-5 w-5 text-amber-600" />
          <span className="flex-1 text-muted-foreground">
            {uploading ? "جارٍ الرفع..." : "اختر صور العمل (يمكن أكثر من صورة)"}
          </span>
          <input type="file" accept="image/*" multiple className="hidden" onChange={onImages} disabled={uploading} />
        </label>
        {imageKeys.length > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">{imageKeys.length} صورة مرفوعة</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold">رقم جوال صاحب العمل <span className="text-destructive">*</span></label>
        <input
          className={inputCls}
          dir="ltr"
          value={form.owner_phone}
          onChange={(e) => setForm({ ...form, owner_phone: e.target.value })}
          placeholder="05xxxxxxxx"
        />
        <p className="mt-1 text-xs text-muted-foreground">يظهر للمعلم فقط بعد التثبيت</p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold">المدينة <span className="text-destructive">*</span></label>
        <select
          className={inputCls}
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
        >
          <option value="">اختر المدينة</option>
          {SAUDI_CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <p className="mt-1 text-xs text-muted-foreground">العرض يصل فقط للمعلمين المشتركين في هذه المدينة</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>
      )}

      <button
        type="submit"
        disabled={submitting || uploading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
      >
        {(submitting || uploading) && <Loader2 className="h-4 w-4 animate-spin" />}
        إرسال المشروع
      </button>
    </form>
  );
}

function ActiveOffersList() {
  const listOffers = useServerFn(listActiveHarajOffers);
  const assign = useServerFn(assignHarajTeacher);
  const qc = useQueryClient();
  const [expandedOffer, setExpandedOffer] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-haraj-offers"],
    queryFn: () => listOffers(),
    refetchInterval: 15000,
  });

  async function handleAssign(offerId: string, teacherId: string) {
    if (!confirm("تثبيت هذا المعلم على العرض؟ سيختفي العرض من باقي المعلمين.")) return;
    setAssigning(teacherId);
    try {
      await assign({ data: { offer_id: offerId, teacher_id: teacherId } });
      toast.success("تم تثبيت المعلم بنجاح");
      qc.invalidateQueries({ queryKey: ["admin-haraj-offers"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setAssigning(null);
    }
  }

  if (isLoading)
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  if (error) return <p className="text-destructive">{(error as Error).message}</p>;

  const offers = (data?.rows ?? []) as AdminOffer[];

  if (offers.length === 0)
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
        لا توجد عروض نشطة حالياً.
      </div>
    );

  return (
    <div className="space-y-4">
      {offers.map((offer) => (
        <div key={offer.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold">{offer.work_name}</h3>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {offer.city}
                </span>
                <span>{new Date(offer.created_at).toLocaleDateString("ar")}</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600">
              {offer.interests.length} مهتم
            </span>
          </div>

          <p className="mb-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{offer.description}</p>

          {offer.images.length > 0 && (
            <div className="mb-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
              {offer.images.map((src, i) => (
                <img key={i} src={src} alt={`صورة ${i + 1}`} className="aspect-square w-full rounded-lg object-cover" loading="lazy" />
              ))}
            </div>
          )}

          <div className="rounded-lg bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
            <span>جوال صاحب العمل: </span>
            <span dir="ltr" className="font-semibold text-foreground">{offer.owner_phone}</span>
          </div>

          <div className="mt-3 border-t border-border pt-3">
            {offer.interests.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-2">لا يوجد معلمون مهتمون بعد</p>
            ) : (
              <>
                <button
                  onClick={() => setExpandedOffer(expandedOffer === offer.id ? null : offer.id)}
                  className="flex w-full items-center justify-between text-sm font-semibold"
                >
                  <span>قائمة المهتمين ({offer.interests.length})</span>
                  <span className="text-xs text-muted-foreground">{expandedOffer === offer.id ? "إخفاء" : "عرض"}</span>
                </button>
                {expandedOffer === offer.id && (
                  <div className="mt-3 space-y-2">
                    {offer.interests.map((interest) => (
                      <div key={interest.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold">{interest.teacher_name}</p>
                          <p className="text-xs text-muted-foreground" dir="ltr">{interest.teacher_phone}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{interest.teacher_city}</span>
                            <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-600">{interest.teacher_profession}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAssign(offer.id, interest.teacher_id)}
                          disabled={assigning === interest.teacher_id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
                        >
                          {assigning === interest.teacher_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
                          تثبيت معلم
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
