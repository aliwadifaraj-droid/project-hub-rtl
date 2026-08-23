import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useServerFn, a8 as adminListOffers, a9 as adminUpdateOfferStatus, aa as adminGetOfferPdfUrl } from "./router-CtQuP2fc.mjs";
import { b as useQueryClient, u as useQuery, c as useMutation } from "../_libs/tanstack__react-query.mjs";
import { a as adminBlockCompany } from "./blocked.functions-pr1NkNVd.mjs";
import { t as toast } from "../_libs/sonner.mjs";

import "../_libs/seroval.mjs";
import "../_libs/bcryptjs.mjs";
import "../_libs/libsql__isomorphic-ws.mjs";
import "../_libs/libsql__hrana-client.mjs";
import "../_libs/promise-limit.mjs";
import "../_libs/aws4fetch.mjs";
import { _ as FileText, L as LoaderCircle, $ as Ban } from "../_libs/lucide-react.mjs";

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
const STATUS_LABEL = {
  pending: "قيد الانتظار",
  new: "جديد",
  reviewing: "قيد المراجعة",
  accepted: "مقبول",
  rejected: "مرفوض"
};
function AdminOffersPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListOffers);
  const updateFn = useServerFn(adminUpdateOfferStatus);
  const pdfFn = useServerFn(adminGetOfferPdfUrl);
  const blockFn = useServerFn(adminBlockCompany);
  const {
    data: offers = [],
    isLoading
  } = useQuery({
    queryKey: ["admin-offers"],
    queryFn: () => listFn()
  });
  async function openPdf(key) {
    const {
      url
    } = await pdfFn({
      data: {
        key
      }
    });
    window.open(url, "_blank", "noopener");
  }
  async function setStatus(id, status) {
    await updateFn({
      data: {
        id,
        status
      }
    });
    qc.invalidateQueries({
      queryKey: ["admin-offers"]
    });
  }
  const blockMut = useMutation({
    mutationFn: (v) => blockFn({
      data: v
    }),
    onSuccess: () => {
      toast.success("تم حظر الشركة");
      qc.invalidateQueries({
        queryKey: ["admin-offers"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  function renderOfferCard(o) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-4 text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold", children: o.company_name }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-secondary px-2 py-0.5 text-[11px]", children: STATUS_LABEL[o.status] ?? o.status })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 grid gap-0.5 text-muted-foreground", children: [
        o.project_name && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "المشروع: ",
          o.project_name
        ] }),
        o.amount && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "القيمة: ",
          o.amount
        ] }),
        o.duration && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "مدة المشروع: ",
          o.duration
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "البريد: ",
          o.email
        ] }),
        o.facility_location && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "موقع المنشأة: ",
          o.facility_location
        ] }),
        o.submitter_type && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center gap-1 text-xs font-semibold", children: o.submitter_type === "customer" ? "👤 عميل" : "🔔 زائر" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex flex-wrap gap-2", children: [
        o.pdf_key && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => openPdf(o.pdf_key), className: "inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-3.5 w-3.5" }),
          o.pdf_filename ?? "عرض الملف"
        ] }),
        ["reviewing", "accepted", "rejected"].map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setStatus(o.id, s), className: "rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary", children: STATUS_LABEL[s] }, s)),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { disabled: blockMut.isPending, onClick: () => blockMut.mutate({
          company_name: o.company_name,
          email: o.email
        }), className: "inline-flex items-center gap-1.5 rounded-md bg-red-600/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-60", children: [
          blockMut.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Ban, { className: "h-3.5 w-3.5" }),
          "حظر"
        ] })
      ] })
    ] }, o.id);
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold", children: "عروض الأسعار" }),
    isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "جارٍ التحميل…" }),
    !isLoading && offers.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "لا توجد عروض حتى الآن." }),
    offers.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3", children: offers.map(renderOfferCard) })
  ] });
}
export {
  AdminOffersPage as component
};
