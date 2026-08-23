import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { z as Route$r, A as projectQuery, u as useServerFn, D as submitBidRequest, k as getMyRoles, C as getMyVipStatus, h as hasAdminRole, B as getExclusiveStatus } from "./router-CtQuP2fc.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useSuspenseQuery, u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { b as buildR2Url, r as resolveImage } from "./projects-SbdB-UfH.mjs";
import { S as SiteHeader } from "./site-header-DfiCN8H8.mjs";
import { S as SiteFooter } from "./site-footer-ByXRtXvu.mjs";
import { P as ProjectStatusBadge, A as AdminProjectStatus } from "./admin-project-status-W416iGbR.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { T as Toaster } from "./sonner-DeNSN9-c.mjs";
import { S as SAUDI_CITIES } from "./saudi-cities-D2sGDQV3.mjs";

import "../_libs/seroval.mjs";
import "../_libs/bcryptjs.mjs";
import "../_libs/libsql__isomorphic-ws.mjs";
import "../_libs/libsql__hrana-client.mjs";
import "../_libs/promise-limit.mjs";
import "../_libs/aws4fetch.mjs";
import { E as ArrowRight, b as MapPin, c as Clock, G as FileDown, q as Upload, L as LoaderCircle } from "../_libs/lucide-react.mjs";

import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";


import "./createSsrRpc-DY9HpWEz.mjs";
import "./server-COznR7QB.mjs";
import "../_libs/h3-v2.mjs";
import "../_libs/unenv.mjs";


import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";




import "../_libs/react-dom.mjs";
import "../_libs/isbot.mjs";
import "./auth-middleware.server-B9hAjfqi.mjs";
import "./db-D5OYORU-.mjs";
import "../_libs/libsql__client.mjs";
import "../_libs/libsql__core.mjs";
import "../_libs/js-base64.mjs";
import "../_libs/jose.mjs";

import "./vip.repo-CycBrLVA.mjs";
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
import "./notifications.functions-mf2-5xG4.mjs";
import "./chat.functions-DV_-1jmL.mjs";
function pickImage(p) {
  if (p.cover_url && (p.cover_url.startsWith("http") || p.cover_url.startsWith("/"))) return p.cover_url;
  const r2 = buildR2Url(p.cover_image ?? "");
  if (r2) return r2;
  return resolveImage(p.cover_image ?? "");
}
function ProjectDetail() {
  const {
    id
  } = Route$r.useParams();
  const search = Route$r.useSearch();
  const vipToken = search.vip_token ?? null;
  const {
    data: project
  } = useSuspenseQuery(projectQuery(id));
  const submit = useServerFn(submitBidRequest);
  const getRoles = useServerFn(getMyRoles);
  const getVipStatus = useServerFn(getMyVipStatus);
  const navigate = Route$r.useNavigate();
  const {
    data: roles
  } = useQuery({
    queryKey: ["my-roles"],
    queryFn: () => getRoles(),
    retry: false
  });
  const isAdmin = hasAdminRole(roles);
  const projectExclusiveUntil = project.exclusive_until ?? null;
  const isExclusive = !!project.is_exclusive && projectExclusiveUntil ? new Date(projectExclusiveUntil).getTime() > Date.now() : false;
  const projectCity = (project.location ?? "").split("-")[0].trim();
  const {
    data: exclusiveStatus
  } = useQuery({
    queryKey: ["exclusive-status", id, vipToken],
    queryFn: () => getExclusiveStatus({
      data: {
        projectId: id,
        vip_token: vipToken
      }
    }),
    enabled: isExclusive,
    retry: false
  });
  const {
    data: vipStatus
  } = useQuery({
    queryKey: ["my-vip-status", id],
    queryFn: () => getVipStatus({
      data: {
        project_id: id
      }
    }),
    enabled: isExclusive,
    retry: false
  });
  const isVipInCity = isExclusive ? !!vipStatus?.isVip && (vipStatus?.city ?? "").trim() === projectCity : false;
  const showExclusiveGate = isExclusive && !isVipInCity && !exclusiveStatus?.showForm;
  const [remainingMs, setRemainingMs] = reactExports.useState(0);
  reactExports.useEffect(() => {
    if (!projectExclusiveUntil) return;
    const end = new Date(projectExclusiveUntil).getTime();
    const tick = () => setRemainingMs(Math.max(0, end - Date.now()));
    tick();
    const iv = setInterval(tick, 1e3);
    return () => clearInterval(iv);
  }, [projectExclusiveUntil]);
  const hoursLeft = Math.floor(remainingMs / 36e5);
  const minutesLeft = Math.floor(remainingMs % 36e5 / 6e4);
  const secondsLeft = Math.floor(remainingMs % 6e4 / 1e3);
  const countdownLabel = `${String(hoursLeft).padStart(2, "0")}:${String(minutesLeft).padStart(2, "0")}:${String(secondsLeft).padStart(2, "0")}`;
  const [companyName, setCompanyName] = reactExports.useState("");
  const [facilityLocation, setFacilityLocation] = reactExports.useState("");
  const [email, setEmail] = reactExports.useState("");
  const [pdfFile, setPdfFile] = reactExports.useState(null);
  const [submitting, setSubmitting] = reactExports.useState(false);
  async function handleSubmit(e) {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!companyName.trim() || !facilityLocation.trim() || !email.trim() || !pdfFile) {
      toast.error("جميع الحقول إجبارية");
      return;
    }
    if (!emailRegex.test(email.trim())) {
      toast.error("يرجى إدخال بريد إلكتروني صحيح");
      return;
    }
    if (pdfFile.size > 10 * 1024 * 1024) {
      toast.error("حجم الملف يجب أن يكون أقل من 10 ميغابايت");
      return;
    }
    setSubmitting(true);
    try {
      const buf = await pdfFile.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(buf);
      const chunk = 32768;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
      }
      const file_base64 = btoa(binary);
      await submit({
        data: {
          project_id: project.id,
          company_name: companyName.trim().slice(0, 200),
          facility_location: facilityLocation.trim().slice(0, 300),
          email: email.trim().slice(0, 255),
          file_name: pdfFile.name,
          file_base64,
          vip_token: vipToken
        }
      });
      navigate({
        to: "/thank-you"
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "حدث خطأ أثناء إرسال الطلب";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Toaster, { position: "top-center", dir: "rtl" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "container mx-auto px-4 py-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition mb-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4" }),
        " العودة للمشاريع"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-hidden rounded-2xl shadow-[var(--shadow-elegant)]", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: pickImage(project), alt: project.name, width: 1600, height: 900, className: "aspect-[16/9] w-full object-cover" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 grid lg:grid-cols-3 gap-10", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl md:text-4xl font-extrabold", children: project.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex flex-wrap gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-4 w-4 text-accent" }),
              " ",
              project.location
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-4 w-4 text-accent" }),
              " المدة المتوقعة: ",
              project.duration
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-6 text-lg leading-loose text-foreground/85", children: project.description }),
          project.pdf_url ? /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: project.pdf_url, target: "_blank", rel: "noopener noreferrer", className: "mt-6 inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-sm font-semibold text-background hover:bg-foreground/90", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(FileDown, { className: "h-4 w-4" }),
            " تحميل ملف PDF"
          ] }) : null
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("aside", { className: "lg:col-span-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold", children: "معلومات المشروع" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("dl", { className: "mt-4 space-y-3 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between border-b border-border/60 pb-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-muted-foreground", children: "الموقع" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "font-medium", children: project.location })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between border-b border-border/60 pb-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-muted-foreground", children: "المدة المتوقعة" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "font-medium", children: project.duration })
            ] }),
            isAdmin ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-muted-foreground", children: "الحالة" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(ProjectStatusBadge, { status: project.status }) })
            ] }) : null
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(AdminProjectStatus, { projectId: project.id, currentStatus: project.status, queryKey: ["project", id] })
        ] }) })
      ] }),
      showExclusiveGate ? /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "mt-16 max-w-3xl mx-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-base font-bold text-amber-900", children: [
          "🔒 حصري لمشتركي ",
          projectCity
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-3xl font-mono font-bold text-amber-900 tabular-nums tracking-wider", children: countdownLabel }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-amber-700/80", children: "الوقت المتبقي لانتهاء الحصرية" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-sm text-amber-800/80", children: [
          "هذا المشروع متاح حالياً حصرياً لمشتركي VIP في ",
          projectCity,
          "."
        ] })
      ] }) }) : project.offers_enabled === false ? /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "mt-16 max-w-3xl mx-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-orange-200 bg-orange-50 p-6 text-center shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-orange-900", children: "تقديم عروض الاسعار عبر النموذج متوقف حاليا" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-orange-800/80", children: "يمكنك تقديم عرضك بسرعة عبر المساعد الآلي." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("open-support-chat"));
          }
        }, className: "mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-700", children: "قدم الآن" })
      ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("section", { id: "apply", className: "mt-16 max-w-3xl mx-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-6 md:p-10 shadow-[var(--shadow-card)]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold", children: "تقديم عرض سعر للمشروع" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "املأ النموذج التالي وأرفق ملف PDF لعرض السعر الخاص بك." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "mt-6 space-y-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "اسم الشركة / المؤسسة", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "text", required: true, maxLength: 200, value: companyName, onChange: (e) => setCompanyName(e.target.value), className: "w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring", placeholder: "مثال: شركة البناء الحديث للمقاولات" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "موقع المنشأة", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { required: true, value: facilityLocation, onChange: (e) => setFacilityLocation(e.target.value), className: "w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", disabled: true, children: "اختر المدينة" }),
            SAUDI_CITIES.map((city) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: city, children: city }, city))
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "البريد الإلكتروني", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "email", required: true, maxLength: 255, value: email, onChange: (e) => setEmail(e.target.value), className: "w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring", placeholder: "example@company.com" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "ملف PDF لعرض السعر", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-border bg-secondary/40 px-4 py-5 text-sm hover:bg-secondary transition", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-5 w-5 text-accent" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 text-muted-foreground", children: pdfFile ? pdfFile.name : "اضغط لاختيار ملف PDF (الحد الأقصى 10 ميغابايت)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "file", accept: "application/pdf", required: true, onChange: (e) => setPdfFile(e.target.files?.[0] ?? null), className: "hidden" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "submit", disabled: submitting, className: "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[image:var(--gradient-accent)] px-6 py-3 text-base font-bold text-accent-foreground transition hover:opacity-90 disabled:opacity-60", children: [
            submitting ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-5 w-5 animate-spin" }) : null,
            "تقديم الطلب"
          ] })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SiteFooter, {})
  ] });
}
function Field({
  label,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "mb-1.5 block text-sm font-semibold", children: [
      label,
      " ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-destructive", children: "*" })
    ] }),
    children
  ] });
}
export {
  ProjectDetail as component
};
