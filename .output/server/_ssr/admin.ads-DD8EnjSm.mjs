import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useServerFn, H as listPendingAds, I as approveAd, J as rejectAd } from "./router-CtQuP2fc.mjs";
import { b as useQueryClient, u as useQuery, c as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";

import "../_libs/seroval.mjs";
import "../_libs/bcryptjs.mjs";
import "../_libs/libsql__isomorphic-ws.mjs";
import "../_libs/libsql__hrana-client.mjs";
import "../_libs/promise-limit.mjs";
import "../_libs/aws4fetch.mjs";
import { L as LoaderCircle, d as Megaphone, J as ExternalLink, i as User, X, o as Check } from "../_libs/lucide-react.mjs";

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
function AdminAdsPage() {
  const list = useServerFn(listPendingAds);
  const approve = useServerFn(approveAd);
  const reject = useServerFn(rejectAd);
  const qc = useQueryClient();
  const {
    data,
    isLoading,
    error
  } = useQuery({
    queryKey: ["pending-ads"],
    queryFn: () => list()
  });
  const approveMut = useMutation({
    mutationFn: (id) => approve({
      data: {
        id
      }
    }),
    onSuccess: () => {
      toast.success("تمت الموافقة");
      qc.invalidateQueries({
        queryKey: ["pending-ads"]
      });
      qc.invalidateQueries({
        queryKey: ["pending-ads-count"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const cancelMut = useMutation({
    mutationFn: (id) => reject({
      data: {
        id,
        reason: "تم الإلغاء من قبل الأدمن"
      }
    }),
    onSuccess: () => {
      toast.success("تم إلغاء الإعلان");
      qc.invalidateQueries({
        queryKey: ["pending-ads"]
      });
      qc.invalidateQueries({
        queryKey: ["pending-ads-count"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  if (isLoading) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid place-items-center py-20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin" }) });
  if (error) return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-destructive", children: error.message });
  const rows = data?.rows ?? [];
  const isAdmin = data?.isAdmin ?? false;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Megaphone, { className: "h-5 w-5" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-2xl font-bold", children: [
        "الإعلانات المعلقة (",
        rows.length,
        ")"
      ] }),
      !isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ms-2 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground", children: "عرض فقط" })
    ] }),
    rows.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground", children: "لا توجد إعلانات بانتظار الموافقة." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 sm:grid-cols-2", children: rows.map((ad) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-hidden rounded-xl border border-border bg-card", children: [
      ad.image_signed_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: ad.image_signed_url, alt: ad.title, className: "h-44 w-full object-cover" }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mb-1 font-bold", children: ad.title }),
        ad.description ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-3 text-sm text-muted-foreground line-clamp-3", children: ad.description }) : null,
        ad.link_url ? /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: ad.link_url, target: "_blank", rel: "noreferrer", className: "mb-3 inline-flex items-center gap-1 text-xs text-primary hover:underline", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-3 w-3" }),
          " ",
          ad.link_url
        ] }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-center gap-1.5 text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-3 w-3 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "المُرسِل:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `font-semibold ${ad.created_by ? "text-foreground" : "text-amber-600"}`, children: ad.submitter_label ?? (ad.created_by ? "موظف" : "زائر") })
        ] }),
        ad.contact_email ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 text-xs text-muted-foreground", children: [
          "بريد الزائر: ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-foreground", children: ad.contact_email })
        ] }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 border-t border-border pt-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: new Date(ad.created_at).toLocaleDateString("ar") }),
          isAdmin ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => {
              if (confirm("إلغاء هذا الإعلان؟")) cancelMut.mutate(ad.id);
            }, disabled: approveMut.isPending || cancelMut.isPending, className: "inline-flex items-center gap-1 rounded-md border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-60", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3.5 w-3.5" }),
              " إلغاء"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => approveMut.mutate(ad.id), disabled: approveMut.isPending || cancelMut.isPending, className: "inline-flex items-center gap-1 rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:bg-foreground/90 disabled:opacity-60", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3.5 w-3.5" }),
              " موافقة"
            ] })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "بانتظار الأدمن" })
        ] })
      ] })
    ] }, ad.id)) })
  ] });
}
export {
  AdminAdsPage as component
};
