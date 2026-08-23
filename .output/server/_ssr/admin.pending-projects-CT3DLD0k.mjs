import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useServerFn } from "./router-CtQuP2fc.mjs";
import { b as useQueryClient, u as useQuery, c as useMutation } from "../_libs/tanstack__react-query.mjs";
import { l as listPendingProjects, a as approveProject, r as rejectProject } from "./project-approval.functions-CkN3ZsAt.mjs";
import { t as toast } from "../_libs/sonner.mjs";

import "../_libs/seroval.mjs";
import "../_libs/bcryptjs.mjs";
import "../_libs/libsql__isomorphic-ws.mjs";
import "../_libs/libsql__hrana-client.mjs";
import "../_libs/promise-limit.mjs";
import "../_libs/aws4fetch.mjs";
import { L as LoaderCircle, w as ClipboardCheck, i as User, o as Check, X } from "../_libs/lucide-react.mjs";

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
function PendingProjectsPage() {
  const list = useServerFn(listPendingProjects);
  const approve = useServerFn(approveProject);
  const reject = useServerFn(rejectProject);
  const qc = useQueryClient();
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["pending-projects"],
    queryFn: () => list(),
    refetchInterval: 3e4
  });
  const approveMut = useMutation({
    mutationFn: (id) => approve({
      data: {
        id
      }
    }),
    onSuccess: () => {
      toast.success("تمت الموافقة وإرسال إشعار للمنشئ");
      qc.invalidateQueries({
        queryKey: ["pending-projects"]
      });
      qc.invalidateQueries({
        queryKey: ["pending-projects-count"]
      });
      qc.invalidateQueries({
        queryKey: ["admin-projects"]
      });
      qc.invalidateQueries({
        queryKey: ["projects"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const rejectMut = useMutation({
    mutationFn: (v) => reject({
      data: v
    }),
    onSuccess: () => {
      toast.success("تم الرفض");
      qc.invalidateQueries({
        queryKey: ["pending-projects"]
      });
      qc.invalidateQueries({
        queryKey: ["pending-projects-count"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  if (isLoading) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid place-items-center py-20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin" }) });
  const rows = data ?? [];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ClipboardCheck, { className: "h-5 w-5" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-2xl font-bold", children: [
        "مشاريع بانتظار الموافقة (",
        rows.length,
        ")"
      ] })
    ] }),
    rows.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground", children: "لا توجد مشاريع معلقة." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: rows.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-hidden rounded-xl border border-border bg-card p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-bold line-clamp-1", children: p.name }),
      p.description ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground line-clamp-3", children: p.description }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 text-xs text-muted-foreground", children: p.location ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        "📍 ",
        p.location
      ] }) : null }),
      p.creator_email ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-3 w-3" }),
        " ",
        p.creator_email
      ] }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => approveMut.mutate(p.id), disabled: approveMut.isPending, className: "inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:bg-foreground/90 disabled:opacity-60", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3.5 w-3.5" }),
          " موافقة"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => {
          const reason = prompt("سبب الرفض (اختياري):") ?? void 0;
          rejectMut.mutate({
            id: p.id,
            reason: reason || void 0
          });
        }, disabled: rejectMut.isPending, className: "inline-flex items-center justify-center gap-1 rounded-md border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-60", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3.5 w-3.5" }),
          " رفض"
        ] })
      ] })
    ] }, p.id)) })
  ] });
}
export {
  PendingProjectsPage as component
};
