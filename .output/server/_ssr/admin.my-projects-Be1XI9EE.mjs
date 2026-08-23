import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useServerFn, a7 as deleteMyAd, k as getMyRoles, h as hasAdminRole } from "./router-pxcAI1C5.mjs";
import { b as useQueryClient, u as useQuery, c as useMutation } from "../_libs/tanstack__react-query.mjs";
import { c as createSsrRpc } from "./createSsrRpc-C50NoQin.mjs";
import { c as createServerFn } from "./server-BNqJEEJz.mjs";
import { r as requireAuth } from "./auth-middleware.server-CWyFWbOs.mjs";
import { b as buildR2Url } from "./projects-SbdB-UfH.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import "../_libs/bcryptjs.mjs";
import "../_libs/libsql__isomorphic-ws.mjs";
import "../_libs/libsql__hrana-client.mjs";
import "../_libs/promise-limit.mjs";

import "../_libs/seroval.mjs";
import "../_libs/aws4fetch.mjs";
import { L as LoaderCircle, t as FolderKanban, Z as Globe, T as Trash2, d as Megaphone } from "../_libs/lucide-react.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";

import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";


import "../_libs/react-dom.mjs";
import "../_libs/isbot.mjs";
import "./vip.repo-BoiBu0-3.mjs";
import "./db-BSVZwhof.mjs";
import "../_libs/libsql__client.mjs";
import "../_libs/libsql__core.mjs";
import "../_libs/js-base64.mjs";
import "../_libs/jose.mjs";


import "../_libs/h3-v2.mjs";
import "../_libs/unenv.mjs";

import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";




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
const listMyProjects = createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(createSsrRpc("8e8c85a8060f36e05865e9044f5c5cc1619143659e6d9409c338fffb7140812c"));
const deleteMyProject = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(createSsrRpc("0df183e363dc40446c9c4b902973b68f87defba6eec25be42d5d57651ff2ddba"));
function MyProjectsPage() {
  const list = useServerFn(listMyProjects);
  const delProject = useServerFn(deleteMyProject);
  const delAd = useServerFn(deleteMyAd);
  const getRoles = useServerFn(getMyRoles);
  const qc = useQueryClient();
  const {
    data: roles
  } = useQuery({
    queryKey: ["my-roles"],
    queryFn: () => getRoles()
  });
  const isAdmin = hasAdminRole(roles);
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["my-projects"],
    queryFn: () => list()
  });
  const delProjectMut = useMutation({
    mutationFn: (id) => delProject({
      data: {
        id
      }
    }),
    onSuccess: () => {
      toast.success("تم حذف المشروع");
      qc.invalidateQueries({
        queryKey: ["my-projects"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const delAdMut = useMutation({
    mutationFn: (id) => delAd({
      data: {
        id
      }
    }),
    onSuccess: () => {
      toast.success("تم حذف الإعلان المرتبط");
      qc.invalidateQueries({
        queryKey: ["my-projects"]
      });
      qc.invalidateQueries({
        queryKey: ["pending-ads"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  if (isLoading) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid place-items-center py-20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin" }) });
  const rows = data ?? [];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(FolderKanban, { className: "h-5 w-5" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-2xl font-bold", children: [
        "مشاريعي (",
        rows.length,
        ")"
      ] })
    ] }),
    rows.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground", children: "لا توجد مشاريع بعد. سيتم إنشاء المشروع تلقائياً عند موافقة الأدمن على إعلانك." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: rows.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-hidden rounded-xl border border-border bg-card", children: [
      (() => {
        const fallback = buildR2Url(p.cover_image ?? null);
        const src = p.cover_url || fallback || "";
        return src ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src, alt: p.name, className: "aspect-video w-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "aspect-video w-full bg-secondary" });
      })(),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-bold line-clamp-1", children: p.name }),
        p.description ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground line-clamp-2", children: p.description }) : null,
        p.domain ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 inline-flex items-center gap-1 text-xs text-primary", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Globe, { className: "h-3 w-3" }),
          " ",
          p.domain
        ] }) : null,
        isAdmin ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => {
            if (confirm("حذف هذا المشروع؟")) delProjectMut.mutate(p.id);
          }, disabled: delProjectMut.isPending, className: "inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-60", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }),
            " حذف المشروع"
          ] }),
          p.ad_id ? /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => {
            if (confirm("حذف الإعلان المرتبط؟")) delAdMut.mutate(p.ad_id);
          }, disabled: delAdMut.isPending, className: "inline-flex items-center justify-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary disabled:opacity-60", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Megaphone, { className: "h-3.5 w-3.5" }),
            " حذف الإعلان"
          ] }) : null
        ] }) : null
      ] })
    ] }, p.id)) })
  ] });
}
export {
  MyProjectsPage as component
};
