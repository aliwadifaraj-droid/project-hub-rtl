import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { listVipSubscribers, approveVipByProject, cancelVipByProject, approveVipSubscriber, rejectVipSubscriber, testVipExpiry, createTrialVipSubscription, createPackageTrialSubscription } from "@/lib/vip.functions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/vip")({
  component: AdminVipPage,
});

function statusBadge(s: string) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    active: "bg-green-100 text-green-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };
  const labels: Record<string, string> = {
    pending: "قيد المراجعة",
    active: "مفعّل",
    approved: "مفعّل",
    rejected: "مرفوض",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${map[s] ?? "bg-secondary"}`}>
      {labels[s] ?? s}
    </span>
  );
}

function remainingTime(expiresAt: string | null, now: number): { hours: number; minutes: number } | null {
  if (!expiresAt) return null;
  const expires = new Date(expiresAt).getTime();
  if (!Number.isFinite(expires)) return null;
  const diff = Math.max(0, expires - now);
  return {
    hours: Math.floor(diff / 3600_000),
    minutes: Math.floor((diff % 3600_000) / 60_000),
  };
}

function formatExpiry(expiresAt: string | null): string {
  if (!expiresAt) return "—";
  const date = new Date(expiresAt);
  if (!Number.isFinite(date.getTime())) return "—";
  return date.toLocaleString("ar-SA", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function AdminVipPage() {
  const fn = useServerFn(listVipSubscribers);
  const approveProjectFn = useServerFn(approveVipByProject);
  const cancelProjectFn = useServerFn(cancelVipByProject);
  const approveFn = useServerFn(approveVipSubscriber);
  const rejectFn = useServerFn(rejectVipSubscriber);
  const qc = useQueryClient();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ["vip-subscribers"],
    queryFn: () => fn(),
  });

  const approveProject = useMutation({
    mutationFn: (projectId: string) => approveProjectFn({ data: { project_id: projectId } }),
    onSuccess: () => {
      toast.success("تم تفعيل الحصرية لمدة 6 ساعات");
      qc.invalidateQueries({ queryKey: ["vip-subscribers"] });
      qc.invalidateQueries({ queryKey: ["admin-projects"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const cancelProject = useMutation({
    mutationFn: (projectId: string) => cancelProjectFn({ data: { project_id: projectId } }),
    onSuccess: () => {
      toast.success("تم إلغاء الحصرية");
      qc.invalidateQueries({ queryKey: ["vip-subscribers"] });
      qc.invalidateQueries({ queryKey: ["admin-projects"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const approve = useMutation({
    mutationFn: (id: string) => approveFn({ data: { id } }),
    onSuccess: () => {
      toast.success("تم التفعيل");
      qc.invalidateQueries({ queryKey: ["vip-subscribers"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const reject = useMutation({
    mutationFn: (id: string) => rejectFn({ data: { id } }),
    onSuccess: () => {
      toast.success("تم الرفض");
      qc.invalidateQueries({ queryKey: ["vip-subscribers"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const testFn = useServerFn(testVipExpiry);
  const testExpiry = useMutation({
    mutationFn: () => testFn(),
    onSuccess: (res) => {
      const parts = [
        `معالجة ${res.processed}`,
        `انتهاء ${res.expired}`,
        `إيصالات نجحت ${res.expiredEmailed + res.emailed}`,
      ];
      const failed = res.expiredEmailFailed + res.reminderEmailFailed;
      if (failed > 0) parts.push(`إيصالات فشلت ${failed}`);
      toast.success(`فحص اشعارات VIP — ${parts.join("، ")}`);
      qc.invalidateQueries({ queryKey: ["vip-subscribers"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const trialFn = useServerFn(createTrialVipSubscription);
  const [trialEmail, setTrialEmail] = useState("");
  const [trialMinutes, setTrialMinutes] = useState("5");
  const createTrial = useMutation({
    mutationFn: () => trialFn({ data: { email: trialEmail, duration_minutes: Number(trialMinutes) } }),
    onSuccess: (res) => {
      toast.success(`تم انشاء اشتراك تجربة. بيوصل ايميل بعد ${trialMinutes} دقايق على ${res.email}`);
      setTrialEmail("");
      setTrialMinutes("5");
      qc.invalidateQueries({ queryKey: ["vip-subscribers"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const packageTrialFn = useServerFn(createPackageTrialSubscription);
  const [pkgEmail, setPkgEmail] = useState("");
  const [pkgAmount, setPkgAmount] = useState("100");
  const [pkgMinutes, setPkgMinutes] = useState("30");
  const [pkgReceiptUrl, setPkgReceiptUrl] = useState("");
  const [pkgUploading, setPkgUploading] = useState(false);
  const createPackageTrial = useMutation({
    mutationFn: () =>
      packageTrialFn({
        data: {
          email: pkgEmail,
          receiptFile: pkgReceiptUrl,
          packageAmount: Number(pkgAmount),
          durationMinutes: Number(pkgMinutes),
        },
      }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(`تم انشاء اشتراك الباقة بنجاح لـ ${res.email}`);
        setPkgEmail("");
        setPkgReceiptUrl("");
      } else {
        toast.error(`تم رفض الإيصال: ${res.reason}`);
      }
      qc.invalidateQueries({ queryKey: ["vip-subscribers"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  async function handlePkgReceiptUpload(file: File) {
    setPkgUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("purpose", "vip-receipt");
      const res = await fetch("/api/public/upload", { method: "POST", body: fd });
      const json = (await res.json()) as { url?: string; signedUrl?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error || "تعذر رفع الملف");
      setPkgReceiptUrl(json.signedUrl ?? json.url ?? "");
      toast.success("تم رفع الإيصال");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPkgUploading(false);
    }
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        <Star className="h-6 w-6 text-amber-500" />
        <h1 className="text-2xl font-bold">العملاء المميزون — إدارة الحصرية</h1>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="rounded-lg border border-border bg-card p-4 flex-1">
          <h2 className="mb-3 text-lg font-semibold">انشاء اشتراك تجربة</h2>
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (trialEmail.trim() && Number(trialMinutes) > 0) createTrial.mutate();
            }}
          >
            <div className="flex flex-col gap-1">
              <Label htmlFor="test_email">الايميل</Label>
              <Input
                id="test_email"
                type="email"
                value={trialEmail}
                onChange={(e) => setTrialEmail(e.target.value)}
                placeholder="test@example.com"
                className="w-64"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="trial_minutes">مدة التجربة (دقائق)</Label>
              <Input
                id="trial_minutes"
                type="number"
                min="1"
                value={trialMinutes}
                onChange={(e) => setTrialMinutes(e.target.value)}
                className="w-32"
              />
            </div>
            <Button type="submit" disabled={createTrial.isPending}>
              {createTrial.isPending ? "جارٍ الانشاء..." : "انشاء اشتراك تجربة"}
            </Button>
          </form>
        </div>
        <Button onClick={() => testExpiry.mutate()} disabled={testExpiry.isPending}>
          {testExpiry.isPending ? "جارٍ الفحص..." : "اختبار اشعارات VIP"}
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-lg font-semibold">تجربة اشتراك الباقات (مع فحص الإيصال)</h2>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (pkgEmail.trim() && pkgReceiptUrl && Number(pkgAmount) > 0 && Number(pkgMinutes) > 0) {
              createPackageTrial.mutate();
            }
          }}
        >
          <div className="flex flex-col gap-1">
            <Label htmlFor="pkg_email">الايميل</Label>
            <Input id="pkg_email" type="email" value={pkgEmail} onChange={(e) => setPkgEmail(e.target.value)} placeholder="user@example.com" className="w-56" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="pkg_amount">قيمة الباقة (ريال)</Label>
            <Input id="pkg_amount" type="number" min="1" value={pkgAmount} onChange={(e) => setPkgAmount(e.target.value)} className="w-32" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="pkg_minutes">مدة الاشتراك (دقائق)</Label>
            <Input id="pkg_minutes" type="number" min="1" value={pkgMinutes} onChange={(e) => setPkgMinutes(e.target.value)} className="w-32" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="pkg_receipt">صورة الإيصال</Label>
            <Input
              id="pkg_receipt"
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handlePkgReceiptUpload(f);
              }}
              className="w-56"
            />
          </div>
          <Button type="submit" disabled={createPackageTrial.isPending || pkgUploading || !pkgReceiptUrl}>
            {createPackageTrial.isPending ? "جارٍ الفحص..." : pkgUploading ? "جارٍ رفع الإيصال..." : "تجربة اشتراك الباقات"}
          </Button>
        </form>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="text-destructive">حصل خطأ: {(error as Error).message}</p>
      ) : (data ?? []).length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <Star className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-muted-foreground">لا يوجد مشتركون مميزون حتى الآن.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>البريد</TableHead>
                <TableHead>الباقة</TableHead>
                <TableHead>المدينة</TableHead>
                <TableHead>المشروع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>تاريخ الانتهاء</TableHead>
                <TableHead>العداد</TableHead>
                <TableHead>الإيصال</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((s) => {
                const expiresAt = (s as { expires_at?: string | null }).expires_at ?? null;
                const remaining = remainingTime(expiresAt, now);
                const isApproved = s.status === "approved" || s.status === "active";
                const hasProject = !!(s as { project_id?: string | null }).project_id;
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name ?? "—"}</TableCell>
                    <TableCell className="text-xs">{s.email ?? "—"}</TableCell>
                    <TableCell className="text-xs font-medium">{s.plan ?? "—"}</TableCell>
                    <TableCell className="text-xs">{s.city ?? "—"}</TableCell>
                    <TableCell className="text-xs">
                      {(s as { project_name?: string | null }).project_name ?? "—"}
                    </TableCell>
                    <TableCell>{statusBadge(s.status)}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs">{formatExpiry(expiresAt)}</TableCell>
                    <TableCell>
                      {isApproved && remaining !== null ? (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          remaining.hours > 24 ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
                        }`}>
                          {remaining.hours === 0 && remaining.minutes === 0
                            ? "منتهٍ الآن"
                            : `${remaining.hours}س ${remaining.minutes}د`}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {s.receipt_url ? (
                        <a
                          href={s.receipt_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary text-xs underline"
                        >
                          عرض
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">لا يوجد</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        {hasProject && !isApproved && (
                          <Button
                            size="sm"
                            className="h-7 gap-1 px-2 text-xs"
                            disabled={approveProject.isPending}
                            onClick={() => approveProject.mutate((s as { project_id: string }).project_id!)}
                          >
                            <Check className="h-3 w-3" /> تفعيل
                          </Button>
                        )}
                        {hasProject && isApproved && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 px-2 text-xs"
                            disabled={cancelProject.isPending}
                            onClick={() => cancelProject.mutate((s as { project_id: string }).project_id!)}
                          >
                            <X className="h-3 w-3" /> إلغاء
                          </Button>
                        )}
                        {!hasProject && s.status !== "active" && (
                          <Button
                            size="sm"
                            className="h-7 gap-1 px-2 text-xs"
                            disabled={approve.isPending}
                            onClick={() => approve.mutate(s.id)}
                          >
                            موافقة
                          </Button>
                        )}
                        {!hasProject && s.status !== "rejected" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 px-2 text-xs"
                            disabled={reject.isPending}
                            onClick={() => reject.mutate(s.id)}
                          >
                            رفض
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
