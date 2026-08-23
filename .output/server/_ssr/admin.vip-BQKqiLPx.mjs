import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useServerFn, au as listVipSubscribers, av as approveVipByProject, aw as cancelVipByProject, ax as approveVipSubscriber, ay as rejectVipSubscriber, az as testVipExpiry, aA as createTrialVipSubscription, aB as createPackageTrialSubscription } from "./router-CtQuP2fc.mjs";
import { b as useQueryClient, u as useQuery, c as useMutation } from "../_libs/tanstack__react-query.mjs";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-D_KwyCuk.mjs";
import { B as Button } from "./button-DjOZMqFS.mjs";
import { L as Label, I as Input } from "./label-BJaHSwYl.mjs";
import { t as toast } from "../_libs/sonner.mjs";

import "../_libs/seroval.mjs";
import "../_libs/bcryptjs.mjs";
import "../_libs/libsql__isomorphic-ws.mjs";
import "../_libs/libsql__hrana-client.mjs";
import "../_libs/promise-limit.mjs";
import "../_libs/aws4fetch.mjs";
import { a as Star, L as LoaderCircle, o as Check, X } from "../_libs/lucide-react.mjs";

import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";


import "../_libs/react-dom.mjs";
import "../_libs/isbot.mjs";
import "./createSsrRpc-DY9HpWEz.mjs";
import "./server-COznR7QB.mjs";
import "../_libs/h3-v2.mjs";
import "../_libs/unenv.mjs";


import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";




import "./auth-middleware.server-B9hAjfqi.mjs";
import "./db-D5OYORU-.mjs";
import "../_libs/libsql__client.mjs";
import "../_libs/libsql__core.mjs";
import "../_libs/js-base64.mjs";
import "../_libs/jose.mjs";

import "./vip.repo-CycBrLVA.mjs";
import "./saudi-cities-D2sGDQV3.mjs";
import "./r2-CJ2zxhhj.mjs";
import "../_libs/lovable.dev__webhooks-js.mjs";
import "../_libs/lovable.dev__email-js.mjs";
import "../_libs/react-email__render.mjs";
import "../_libs/prettier.mjs";
import "../_libs/html-to-text.mjs";
import "../_libs/selderee__plugin-htmlparser2.mjs";
import "../_libs/selderee.mjs";
import "../_libs/parseley.mjs";
import "../_libs/leac.mjs";
import "../_libs/peberminta.mjs";
import "../_libs/domhandler.mjs";
import "../_libs/domelementtype.mjs";
import "../_libs/htmlparser2.mjs";
import "../_libs/entities.mjs";
import "../_libs/deepmerge.mjs";
import "../_libs/dom-serializer.mjs";
import "../_libs/aws-sdk__client-s3.mjs";
import "../_libs/smithy__core.mjs";
import "../_libs/smithy__types.mjs";





import "../_libs/aws-sdk__core.mjs";
import "../_libs/aws__lambda-invoke-store.mjs";
import "../_libs/aws-sdk__xml-builder.mjs";
import "../_libs/smithy__signature-v4.mjs";
import "../_libs/@aws-sdk/signature-v4-multi-region+[...].mjs";
import "../_libs/aws-sdk__checksums.mjs";
import "../_libs/aws-sdk__middleware-sdk-s3.mjs";
import "../_libs/@aws-sdk/credential-provider-node+[...].mjs";
import "../_libs/@aws-sdk/credential-provider-env+[...].mjs";
import "../_libs/smithy__node-http-handler.mjs";
import "../_libs/react-email__html.mjs";
import "../_libs/react-email__head.mjs";
import "../_libs/react-email__preview.mjs";
import "../_libs/react-email__body.mjs";
import "../_libs/react-email__container.mjs";
import "../_libs/react-email__heading.mjs";
import "../_libs/react-email__text.mjs";
import "../_libs/zod.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
function statusBadge(s) {
  const map = {
    pending: "bg-yellow-100 text-yellow-800",
    active: "bg-green-100 text-green-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800"
  };
  const labels = {
    pending: "قيد المراجعة",
    active: "مفعّل",
    approved: "مفعّل",
    rejected: "مرفوض"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded-full px-2.5 py-0.5 text-xs font-medium ${map[s] ?? "bg-secondary"}`, children: labels[s] ?? s });
}
function hoursRemaining(expiresAt) {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / 36e5);
}
function AdminVipPage() {
  const fn = useServerFn(listVipSubscribers);
  const approveProjectFn = useServerFn(approveVipByProject);
  const cancelProjectFn = useServerFn(cancelVipByProject);
  const approveFn = useServerFn(approveVipSubscriber);
  const rejectFn = useServerFn(rejectVipSubscriber);
  const qc = useQueryClient();
  const {
    data,
    isLoading,
    error
  } = useQuery({
    queryKey: ["vip-subscribers"],
    queryFn: () => fn()
  });
  const approveProject = useMutation({
    mutationFn: (projectId) => approveProjectFn({
      data: {
        project_id: projectId
      }
    }),
    onSuccess: () => {
      toast.success("تم تفعيل الحصرية لمدة 6 ساعات");
      qc.invalidateQueries({
        queryKey: ["vip-subscribers"]
      });
      qc.invalidateQueries({
        queryKey: ["admin-projects"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const cancelProject = useMutation({
    mutationFn: (projectId) => cancelProjectFn({
      data: {
        project_id: projectId
      }
    }),
    onSuccess: () => {
      toast.success("تم إلغاء الحصرية");
      qc.invalidateQueries({
        queryKey: ["vip-subscribers"]
      });
      qc.invalidateQueries({
        queryKey: ["admin-projects"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const approve = useMutation({
    mutationFn: (id) => approveFn({
      data: {
        id
      }
    }),
    onSuccess: () => {
      toast.success("تم التفعيل");
      qc.invalidateQueries({
        queryKey: ["vip-subscribers"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const reject = useMutation({
    mutationFn: (id) => rejectFn({
      data: {
        id
      }
    }),
    onSuccess: () => {
      toast.success("تم الرفض");
      qc.invalidateQueries({
        queryKey: ["vip-subscribers"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const testFn = useServerFn(testVipExpiry);
  const testExpiry = useMutation({
    mutationFn: () => testFn(),
    onSuccess: (res) => {
      const parts = [`معالجة ${res.processed}`, `انتهاء ${res.expired}`, `إيصالات نجحت ${res.expiredEmailed + res.emailed}`];
      const failed = res.expiredEmailFailed + res.reminderEmailFailed;
      if (failed > 0) parts.push(`إيصالات فشلت ${failed}`);
      toast.success(`فحص اشعارات VIP — ${parts.join("، ")}`);
      qc.invalidateQueries({
        queryKey: ["vip-subscribers"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const trialFn = useServerFn(createTrialVipSubscription);
  const [trialEmail, setTrialEmail] = reactExports.useState("");
  const [trialMinutes, setTrialMinutes] = reactExports.useState("5");
  const createTrial = useMutation({
    mutationFn: () => trialFn({
      data: {
        email: trialEmail,
        duration_minutes: Number(trialMinutes)
      }
    }),
    onSuccess: (res) => {
      toast.success(`تم انشاء اشتراك تجربة. بيوصل ايميل بعد ${trialMinutes} دقايق على ${res.email}`);
      setTrialEmail("");
      setTrialMinutes("5");
      qc.invalidateQueries({
        queryKey: ["vip-subscribers"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const packageTrialFn = useServerFn(createPackageTrialSubscription);
  const [pkgEmail, setPkgEmail] = reactExports.useState("");
  const [pkgAmount, setPkgAmount] = reactExports.useState("100");
  const [pkgMinutes, setPkgMinutes] = reactExports.useState("30");
  const [pkgReceiptUrl, setPkgReceiptUrl] = reactExports.useState("");
  const [pkgUploading, setPkgUploading] = reactExports.useState(false);
  const createPackageTrial = useMutation({
    mutationFn: () => packageTrialFn({
      data: {
        email: pkgEmail,
        receiptFile: pkgReceiptUrl,
        packageAmount: Number(pkgAmount),
        durationMinutes: Number(pkgMinutes)
      }
    }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(`تم انشاء اشتراك الباقة بنجاح لـ ${res.email}`);
        setPkgEmail("");
        setPkgReceiptUrl("");
      } else {
        toast.error(`تم رفض الإيصال: ${res.reason}`);
      }
      qc.invalidateQueries({
        queryKey: ["vip-subscribers"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  async function handlePkgReceiptUpload(file) {
    setPkgUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("purpose", "vip-receipt");
      const res = await fetch("/api/public/upload", {
        method: "POST",
        body: fd
      });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error || "تعذر رفع الملف");
      setPkgReceiptUrl(json.signedUrl ?? json.url ?? "");
      toast.success("تم رفع الإيصال");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setPkgUploading(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-6 w-6 text-amber-500" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "العملاء المميزون — إدارة الحصرية" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-card p-4 flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-3 text-lg font-semibold", children: "انشاء اشتراك تجربة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { className: "flex flex-wrap items-end gap-3", onSubmit: (e) => {
          e.preventDefault();
          if (trialEmail.trim() && Number(trialMinutes) > 0) createTrial.mutate();
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "test_email", children: "الايميل" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "test_email", type: "email", value: trialEmail, onChange: (e) => setTrialEmail(e.target.value), placeholder: "test@example.com", className: "w-64" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "trial_minutes", children: "مدة التجربة (دقائق)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "trial_minutes", type: "number", min: "1", value: trialMinutes, onChange: (e) => setTrialMinutes(e.target.value), className: "w-32" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: createTrial.isPending, children: createTrial.isPending ? "جارٍ الانشاء..." : "انشاء اشتراك تجربة" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => testExpiry.mutate(), disabled: testExpiry.isPending, children: testExpiry.isPending ? "جارٍ الفحص..." : "اختبار اشعارات VIP" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-card p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-3 text-lg font-semibold", children: "تجربة اشتراك الباقات (مع فحص الإيصال)" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { className: "flex flex-wrap items-end gap-3", onSubmit: (e) => {
        e.preventDefault();
        if (pkgEmail.trim() && pkgReceiptUrl && Number(pkgAmount) > 0 && Number(pkgMinutes) > 0) {
          createPackageTrial.mutate();
        }
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "pkg_email", children: "الايميل" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "pkg_email", type: "email", value: pkgEmail, onChange: (e) => setPkgEmail(e.target.value), placeholder: "user@example.com", className: "w-56" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "pkg_amount", children: "قيمة الباقة (ريال)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "pkg_amount", type: "number", min: "1", value: pkgAmount, onChange: (e) => setPkgAmount(e.target.value), className: "w-32" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "pkg_minutes", children: "مدة الاشتراك (دقائق)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "pkg_minutes", type: "number", min: "1", value: pkgMinutes, onChange: (e) => setPkgMinutes(e.target.value), className: "w-32" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "pkg_receipt", children: "صورة الإيصال" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "pkg_receipt", type: "file", accept: "image/*,application/pdf", onChange: (e) => {
            const f = e.target.files?.[0];
            if (f) handlePkgReceiptUpload(f);
          }, className: "w-56" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: createPackageTrial.isPending || pkgUploading || !pkgReceiptUrl, children: createPackageTrial.isPending ? "جارٍ الفحص..." : pkgUploading ? "جارٍ رفع الإيصال..." : "تجربة اشتراك الباقات" })
      ] })
    ] }),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid place-items-center py-20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-muted-foreground" }) }) : error ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-destructive", children: [
      "حصل خطأ: ",
      error.message
    ] }) : (data ?? []).length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-card p-8 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "mx-auto h-10 w-10 text-muted-foreground/40" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-muted-foreground", children: "لا يوجد مشتركون مميزون حتى الآن." })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-border bg-card overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "الاسم" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "البريد" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "المشروع" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "الحالة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "ينتهي خلال" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "الإيصال" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "إجراءات" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: (data ?? []).map((s) => {
        const hours = hoursRemaining(s.expires_at ?? null);
        const isApproved = s.status === "approved" || s.status === "active";
        const hasProject = !!s.project_id;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-medium", children: s.name ?? "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-xs", children: s.email ?? "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-xs", children: s.project_name ?? "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: statusBadge(s.status) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: isApproved && hours !== null ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${hours > 24 ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}`, children: hours === 0 ? "منتهٍ الآن" : `${hours} ساعة` }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "—" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: s.receipt_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: s.receipt_url, target: "_blank", rel: "noreferrer", className: "text-primary text-xs underline", children: "عرض" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "لا يوجد" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1.5", children: [
            hasProject && !isApproved && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", className: "h-7 gap-1 px-2 text-xs", disabled: approveProject.isPending, onClick: () => approveProject.mutate(s.project_id), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3 w-3" }),
              " تفعيل"
            ] }),
            hasProject && isApproved && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", className: "h-7 gap-1 px-2 text-xs", disabled: cancelProject.isPending, onClick: () => cancelProject.mutate(s.project_id), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" }),
              " إلغاء"
            ] }),
            !hasProject && s.status !== "active" && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", className: "h-7 gap-1 px-2 text-xs", disabled: approve.isPending, onClick: () => approve.mutate(s.id), children: "موافقة" }),
            !hasProject && s.status !== "rejected" && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", className: "h-7 gap-1 px-2 text-xs", disabled: reject.isPending, onClick: () => reject.mutate(s.id), children: "رفض" })
          ] }) })
        ] }, s.id);
      }) })
    ] }) })
  ] });
}
export {
  AdminVipPage as component
};
