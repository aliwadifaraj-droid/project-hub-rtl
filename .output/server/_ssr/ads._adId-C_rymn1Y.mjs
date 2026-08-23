import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { w as Route$t, u as useServerFn, x as listAdComments, y as submitAdComment } from "./router-pxcAI1C5.mjs";
import { b as useQueryClient, u as useQuery, c as useMutation } from "../_libs/tanstack__react-query.mjs";
import { S as SiteHeader } from "./site-header-qsAjdZpU.mjs";
import { S as SiteFooter } from "./site-footer-ByXRtXvu.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { T as Toaster } from "./sonner-DeNSN9-c.mjs";

import "../_libs/seroval.mjs";
import "../_libs/bcryptjs.mjs";
import "../_libs/libsql__isomorphic-ws.mjs";
import "../_libs/libsql__hrana-client.mjs";
import "../_libs/promise-limit.mjs";
import "../_libs/aws4fetch.mjs";
import { E as ArrowRight, d as Megaphone, k as MessageSquare, L as LoaderCircle, S as Send, i as User } from "../_libs/lucide-react.mjs";

import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";


import "../_libs/react-dom.mjs";
import "../_libs/isbot.mjs";
import "../_libs/tanstack__query-core.mjs";
import "./createSsrRpc-C50NoQin.mjs";
import "./server-BNqJEEJz.mjs";
import "../_libs/h3-v2.mjs";
import "../_libs/unenv.mjs";


import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";




import "./auth-middleware.server-CWyFWbOs.mjs";
import "./db-BSVZwhof.mjs";
import "../_libs/libsql__client.mjs";
import "../_libs/libsql__core.mjs";
import "../_libs/js-base64.mjs";
import "../_libs/jose.mjs";

import "./vip.repo-BoiBu0-3.mjs";
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
import "./notifications.functions-DOWRu_2x.mjs";
import "./chat.functions-DMnGOKTk.mjs";
function AdDetailPage() {
  const ad = Route$t.useLoaderData();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-h-screen flex-col bg-background", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Toaster, { position: "top-center", dir: "rtl" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "container mx-auto flex-1 px-4 py-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/ads", className: "mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4" }),
        " كل الإعلانات"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]", children: [
        ad.image_signed_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: ad.image_signed_url, alt: ad.title, className: "max-h-[500px] w-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-60 w-full place-items-center bg-secondary/50 text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Megaphone, { className: "h-10 w-10" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 md:p-8", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-extrabold md:text-3xl", children: ad.title }),
          ad.description ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 whitespace-pre-line text-muted-foreground", children: ad.description }) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-6 text-xs text-muted-foreground", children: [
            "نُشر في ",
            new Date(ad.created_at).toLocaleDateString("ar")
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CommentsSection, { adId: ad.id })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SiteFooter, {})
  ] });
}
function CommentsSection({
  adId
}) {
  const qc = useQueryClient();
  const list = useServerFn(listAdComments);
  const submit = useServerFn(submitAdComment);
  const [name, setName] = reactExports.useState("");
  const [contact, setContact] = reactExports.useState("");
  const [body, setBody] = reactExports.useState("");
  const {
    data: comments = [],
    isLoading
  } = useQuery({
    queryKey: ["ad-comments", adId],
    queryFn: () => list({
      data: {
        adId
      }
    })
  });
  const mut = useMutation({
    mutationFn: () => submit({
      data: {
        adId,
        author_name: name,
        contact,
        body
      }
    }),
    onSuccess: () => {
      toast.success("تم إرسال طلبك");
      setName("");
      setContact("");
      setBody("");
      qc.invalidateQueries({
        queryKey: ["ad-comments", adId]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mx-auto mt-8 max-w-3xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "h-5 w-5 text-accent" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-bold", children: "تعليق أو طلب مباشر" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: (e) => {
        e.preventDefault();
        if (!name.trim() || !body.trim()) return;
        mut.mutate();
      }, className: "grid gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { required: true, maxLength: 80, value: name, onChange: (e) => setName(e.target.value), placeholder: "اسمك *", className: "rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { maxLength: 120, value: contact, onChange: (e) => setContact(e.target.value), placeholder: "رقم الجوال أو البريد (اختياري)", className: "rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { required: true, maxLength: 1e3, rows: 4, value: body, onChange: (e) => setBody(e.target.value), placeholder: "اكتب تعليقك أو طلبك...", className: "resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "submit", disabled: mut.isPending || !name.trim() || !body.trim(), className: "inline-flex items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-sm font-semibold text-background hover:bg-foreground/90 disabled:opacity-60", children: [
          mut.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-4 w-4" }),
          "إرسال"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "mb-3 text-sm font-bold text-muted-foreground", children: [
        "التعليقات (",
        comments.length,
        ")"
      ] }),
      isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid place-items-center py-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-5 w-5 animate-spin" }) }) : comments.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "rounded-lg border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground", children: "لا توجد تعليقات بعد. كن أول من يعلق." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-3", children: comments.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "rounded-lg border border-border bg-card p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-1 flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 text-sm font-semibold", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-3.5 w-3.5 text-muted-foreground" }),
            c.author_name
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("time", { className: "text-xs text-muted-foreground", children: new Date(c.created_at).toLocaleDateString("ar") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "whitespace-pre-line text-sm text-foreground/90", children: c.body })
      ] }, c.id)) })
    ] })
  ] });
}
export {
  AdDetailPage as component
};
