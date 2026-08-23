import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { e as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { u as useServerFn, F as submitVipSubscription, G as getVipMaintenance, k as getMyRoles, h as hasAdminRole } from "./router-CtQuP2fc.mjs";
import { u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { S as SiteHeader } from "./site-header-DfiCN8H8.mjs";
import { S as SiteFooter } from "./site-footer-ByXRtXvu.mjs";
import { T as Toaster } from "./sonner-DeNSN9-c.mjs";
import { a as uploadPublicFile } from "./files.functions-BOtEkJh5.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { S as SAUDI_CITIES } from "./saudi-cities-D2sGDQV3.mjs";

import "../_libs/seroval.mjs";
import "../_libs/bcryptjs.mjs";
import "../_libs/libsql__isomorphic-ws.mjs";
import "../_libs/libsql__hrana-client.mjs";
import "../_libs/promise-limit.mjs";
import "../_libs/aws4fetch.mjs";
import { a as Star, W as Wrench, o as Check, z as ChevronDown, I as ChevronLeft, r as Copy, q as Upload } from "../_libs/lucide-react.mjs";

import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";


import "../_libs/react-dom.mjs";
import "../_libs/isbot.mjs";
import "../_libs/tanstack__query-core.mjs";
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
const BANK_INFO = {
  name: "البنك الأهلي",
  holder: "AHMED SALMI",
  iban: "SA35 1000 0065 5000 4711 0807"
};
const PLANS = [{
  id: "شهر",
  label: "اشتراك شهر",
  price: 100,
  duration: "30 يوم"
}, {
  id: "شهرين",
  label: "اشتراك شهرين",
  price: 200,
  duration: "60 يوم"
}, {
  id: "3 شهور",
  label: "اشتراك 3 شهور",
  price: 300,
  duration: "90 يوم"
}];
function VipPage() {
  const navigate = useNavigate();
  const subscribe = useServerFn(submitVipSubscription);
  const upload = useServerFn(uploadPublicFile);
  const [step, setStep] = reactExports.useState(1);
  const [selectedPlan, setSelectedPlan] = reactExports.useState(PLANS[0].id);
  const [name, setName] = reactExports.useState("");
  const [email, setEmail] = reactExports.useState("");
  const [city, setCity] = reactExports.useState("");
  const [file, setFile] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(false);
  const [submitted, setSubmitted] = reactExports.useState(false);
  const [showOtherPlans, setShowOtherPlans] = reactExports.useState(false);
  const getMx = useServerFn(getVipMaintenance);
  const getRoles = useServerFn(getMyRoles);
  const {
    data: mx
  } = useQuery({
    queryKey: ["vip-maintenance"],
    queryFn: () => getMx(),
    refetchInterval: 15e3
  });
  const {
    data: roles
  } = useQuery({
    queryKey: ["my-roles"],
    queryFn: () => getRoles()
  });
  const isAdmin = hasAdminRole(roles);
  const maintenance = !!mx?.enabled;
  const selectedPlanObj = PLANS.find((p) => p.id === selectedPlan) ?? PLANS[0];
  function goToStep2() {
    if (!selectedPlan) return toast.error("اختر الباقة");
    setStep(2);
  }
  function goToStep3() {
    if (!name.trim()) return toast.error("أدخل الاسم");
    if (!email.trim()) return toast.error("أدخل البريد الإلكتروني");
    if (!city) return toast.error("اختر المدينة");
    setStep(3);
  }
  async function handleFileChange(file2) {
    setFile(file2);
  }
  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return toast.error("ارفع صورة الإيصال");
    if (!name.trim()) return toast.error("أدخل الاسم");
    if (!email.trim()) return toast.error("أدخل البريد الإلكتروني");
    if (!city) return toast.error("اختر المدينة");
    if (!selectedPlan) return toast.error("اختر الباقة");
    setLoading(true);
    try {
      const data = await fileToBase64(file);
      const res = await upload({
        data: {
          filename: file.name,
          mime: file.type,
          purpose: "vip-receipt",
          data
        }
      });
      await subscribe({
        data: {
          name: name.trim(),
          email: email.trim(),
          receipt_path: res.key,
          plan: selectedPlan,
          city
        }
      });
      setSubmitted(true);
    } catch (err) {
      toast.error("حصل خطأ: " + err.message);
    } finally {
      setLoading(false);
    }
  }
  function copyIban() {
    navigator.clipboard.writeText(BANK_INFO.iban.replace(/\s/g, ""));
    toast.success("تم نسخ الآيبان");
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen flex flex-col bg-background", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Toaster, { position: "top-center", dir: "rtl" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "border-b border-border/60 bg-secondary/30", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto px-4 py-12 sm:py-16", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-4xl text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[image:var(--gradient-accent)] text-accent-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-6 w-6" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl sm:text-3xl font-extrabold text-foreground", children: "العملاء المميزون" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-muted-foreground", children: "اختر الباقة المناسبة وحول المبلغ بنكي، ثم ارفع إيصال الدفع." })
      ] }),
      maintenance && !isAdmin ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto mt-10 max-w-xl rounded-xl border border-border bg-card p-10 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Wrench, { className: "mx-auto h-10 w-10 text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-4 text-xl font-bold", children: "الصفحة تحت الصيانة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "نعتذر عن الإزعاج، سنعود قريباً." })
      ] }) : submitted ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto mt-10 max-w-xl rounded-xl border border-border bg-card p-10 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-7 w-7" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold text-foreground", children: "طلبكم قيد المراجعة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: "طلبكم قيد المراجعة سيتم إشعاركم عند التفعيل" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => navigate({
          to: "/"
        }), className: "mt-6 rounded-lg bg-foreground px-6 py-2.5 text-sm font-bold text-background transition hover:bg-foreground/90", children: "العودة للرئيسية" })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto mt-8 flex max-w-md items-center justify-center gap-2", children: [1, 2, 3].map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `grid h-8 w-8 place-items-center rounded-full text-xs font-bold transition ${step >= s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`, children: step > s ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4" }) : s }),
          s < 3 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-0.5 w-12 ${step > s ? "bg-primary" : "bg-border"}` })
        ] }, s)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto mt-2 flex max-w-md justify-center gap-2 text-[11px] text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-8 text-center", children: "الباقة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-12" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-8 text-center", children: "البيانات" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-12" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-8 text-center", children: "الدفع" })
        ] }),
        step === 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto mt-8 max-w-xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border-2 border-primary bg-card p-8 text-center shadow-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-3 w-3" }),
              " الأكثر طلباً"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-bold text-foreground", children: PLANS[0].label }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: PLANS[0].duration }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-5 text-4xl font-extrabold text-foreground", children: [
              PLANS[0].price,
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-base font-medium text-muted-foreground", children: " ر.س" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "mt-5 space-y-2 text-sm text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center justify-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4 text-green-600" }),
                " أولوية في استلام المشاريع الجديدة"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center justify-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4 text-green-600" }),
                " إشعار فوري بالمشاريع الحصرية"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center justify-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4 text-green-600" }),
                " دعم مخصص"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => {
              setSelectedPlan(PLANS[0].id);
              goToStep2();
            }, className: "mt-6 w-full rounded-lg bg-primary px-6 py-3 text-base font-bold text-primary-foreground transition hover:bg-primary/90", children: "اختر هذه الباقة" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => setShowOtherPlans((v) => !v), className: "mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-bold text-white transition hover:opacity-90", style: {
            backgroundColor: "#F97316"
          }, children: [
            "باقات أخرى متاحة",
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: `h-5 w-5 transition-transform duration-200 ${showOtherPlans ? "rotate-180" : ""}` })
          ] }),
          showOtherPlans && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 rounded-xl border border-border bg-card p-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: PLANS.slice(1).map((p) => {
              const active = selectedPlan === p.id;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => setSelectedPlan(p.id), className: `rounded-lg border p-4 text-center transition ${active ? "border-primary ring-2 ring-primary" : "border-border hover:bg-secondary"}`, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-bold", children: p.label }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: p.duration }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-3 text-2xl font-extrabold text-foreground", children: [
                  p.price,
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-muted-foreground", children: " ر.س" })
                ] }),
                active && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3 w-3" }),
                  " محددة"
                ] })
              ] }, p.id);
            }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: goToStep2, className: "mt-4 w-full rounded-lg border border-primary bg-primary/5 px-4 py-2.5 text-sm font-bold text-primary transition hover:bg-primary/10", children: "متابعة بالباقة المختارة" })
          ] })
        ] }),
        step === 2 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto mt-8 max-w-xl rounded-xl border border-border bg-card p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-bold text-center", children: "بيانات المشترك" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-center text-xs text-muted-foreground", children: [
            "الباقة المختارة: ",
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-foreground", children: [
              selectedPlanObj.label,
              " — ",
              selectedPlanObj.price,
              " ر.س"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium", children: "الاسم" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "text", value: name, onChange: (e) => setName(e.target.value), placeholder: "الاسم الكامل", className: "mt-1 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium", children: "البريد الإلكتروني" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "example@email.com", className: "mt-1 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium", children: "المدينة" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: city, onChange: (e) => setCity(e.target.value), className: "mt-1 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "اختر المدينة" }),
                SAUDI_CITIES.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: c, children: c }, c))
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => setStep(1), className: "inline-flex items-center gap-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-4 w-4" }),
              " السابق"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: goToStep3, className: "flex-1 rounded-lg bg-foreground px-6 py-2.5 text-sm font-bold text-background transition hover:bg-foreground/90", children: "التالي للدفع" })
          ] })
        ] }),
        step === 3 && /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "mx-auto mt-8 max-w-xl rounded-xl border border-border bg-card p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-bold text-center", children: "الدفع ورفع الإيصال" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-center text-xs text-muted-foreground", children: [
            "الباقة: ",
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-foreground", children: [
              selectedPlanObj.label,
              " — ",
              selectedPlanObj.price,
              " ر.س"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 rounded-lg border border-border bg-secondary/30 p-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-bold text-center mb-3", children: "تفاصيل التحويل البنكي" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between border-b border-border/60 py-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "اسم البنك" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: BANK_INFO.name })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between border-b border-border/60 py-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "صاحب الحساب" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: BANK_INFO.holder })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 py-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "IBAN" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono font-bold", dir: "ltr", children: BANK_INFO.iban }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: copyIban, className: "inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-secondary", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-3 w-3" }),
                    " نسخ"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-3 text-xs text-muted-foreground text-center", children: [
              "حوّل مبلغ ",
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-foreground", children: [
                selectedPlanObj.price,
                " ر.س"
              ] }),
              " ثم ارفع صورة الإيصال بالأسفل."
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium", children: "رفع صورة الإيصال (صورة أو PDF)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium transition hover:bg-secondary", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-4 w-4" }),
                file ? file.name : "اختر ملف",
                /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "file", accept: "image/*,application/pdf", onChange: (e) => handleFileChange(e.target.files?.[0] ?? null), className: "hidden" })
              ] }),
              file && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-green-600 inline-flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3.5 w-3.5" }),
                " تم اختيار الملف"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => setStep(2), className: "inline-flex items-center gap-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-4 w-4" }),
              " السابق"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "submit", disabled: loading, className: "flex-1 rounded-lg bg-primary px-6 py-3 text-base font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60", children: loading ? "جارٍ الإرسال..." : "إرسال للمراجعة" })
          ] })
        ] })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SiteFooter, {})
  ] });
}
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
export {
  VipPage as component
};
