import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useServerFn } from "./router-CtQuP2fc.mjs";
import { c as createSsrRpc } from "./createSsrRpc-DY9HpWEz.mjs";
import { c as createServerFn } from "./server-COznR7QB.mjs";
import { S as SiteHeader } from "./site-header-DfiCN8H8.mjs";
import { S as SiteFooter } from "./site-footer-ByXRtXvu.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { T as Toaster } from "./sonner-DeNSN9-c.mjs";
import "../_libs/bcryptjs.mjs";
import "../_libs/libsql__isomorphic-ws.mjs";
import "../_libs/libsql__hrana-client.mjs";
import "../_libs/promise-limit.mjs";
import "../_libs/aws4fetch.mjs";

import "../_libs/seroval.mjs";
import { C as CircleCheck, i as User, j as Mail, k as MessageSquare, L as LoaderCircle } from "../_libs/lucide-react.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";

import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";


import "../_libs/react-dom.mjs";
import "../_libs/isbot.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
import "./auth-middleware.server-B9hAjfqi.mjs";
import "./db-D5OYORU-.mjs";
import "../_libs/libsql__client.mjs";
import "../_libs/libsql__core.mjs";
import "../_libs/js-base64.mjs";
import "../_libs/jose.mjs";


import "../_libs/h3-v2.mjs";
import "../_libs/unenv.mjs";

import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";




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
import "./notifications.functions-mf2-5xG4.mjs";
import "./chat.functions-DV_-1jmL.mjs";
const submitContactMessage = createServerFn({
  method: "POST"
}).inputValidator((d) => objectType({
  name: stringType().trim().min(1).max(100),
  email: stringType().trim().email().max(200),
  message: stringType().trim().min(1).max(2e3)
}).parse(d)).handler(createSsrRpc("cbbecc3eeba7f0f9946f0d511c1b0036cea0dbc5cf53b42135834da4bae44479"));
const schema = objectType({
  name: stringType().trim().min(1, "الاسم مطلوب").max(100),
  email: stringType().trim().email("بريد إلكتروني غير صحيح").max(200),
  message: stringType().trim().min(1, "الرسالة مطلوبة").max(2e3)
});
function ContactPage() {
  const submitContact = useServerFn(submitContactMessage);
  const [name, setName] = reactExports.useState("");
  const [email, setEmail] = reactExports.useState("");
  const [message, setMessage] = reactExports.useState("");
  const [submitting, setSubmitting] = reactExports.useState(false);
  const [done, setDone] = reactExports.useState(false);
  async function handleSubmit(e) {
    e.preventDefault();
    const parsed = schema.safeParse({
      name,
      email,
      message
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");
      return;
    }
    setSubmitting(true);
    try {
      await submitContact({
        data: parsed.data
      });
      setDone(true);
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ، حاول مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Toaster, { position: "top-center", dir: "rtl" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "container mx-auto px-4 py-16 max-w-2xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-4xl font-extrabold text-center", children: "تواصل بنا" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-center text-muted-foreground", children: "نرحب باستفساراتكم ومقترحاتكم، سنرد عليكم في أقرب وقت." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-10 rounded-2xl border border-border bg-card p-6 md:p-10 shadow-[var(--shadow-card)]", children: done ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto grid h-16 w-16 place-items-center rounded-full bg-accent/15 text-accent", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-9 w-9" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-4 text-2xl font-bold", children: "تم استلام رسالتكم بنجاح" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "mt-6 inline-flex rounded-md bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:bg-foreground/90", children: "العودة للرئيسية" })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "الاسم", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-4 w-4" }), children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "text", required: true, maxLength: 100, value: name, onChange: (e) => setName(e.target.value), className: "w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "البريد الإلكتروني", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "h-4 w-4" }), children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "email", required: true, maxLength: 200, value: email, onChange: (e) => setEmail(e.target.value), className: "w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "الرسالة", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "h-4 w-4" }), children: /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { required: true, maxLength: 2e3, rows: 5, value: message, onChange: (e) => setMessage(e.target.value), className: "w-full resize-none rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "submit", disabled: submitting, className: "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[image:var(--gradient-accent)] px-6 py-3 text-base font-bold text-accent-foreground transition hover:opacity-90 disabled:opacity-60", children: [
          submitting ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-5 w-5 animate-spin" }) : null,
          "إرسال"
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SiteFooter, {})
  ] });
}
function Field({
  label,
  icon,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "mb-1.5 flex items-center gap-2 text-sm font-semibold", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-accent", children: icon }),
      label,
      " ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-destructive", children: "*" })
    ] }),
    children
  ] });
}
export {
  ContactPage as component
};
