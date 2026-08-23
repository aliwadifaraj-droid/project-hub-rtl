import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useServerFn, V as listEmployees, W as createEmployee, X as deleteEmployee, Y as listRoles, v as getRoleLabel } from "./router-CtQuP2fc.mjs";
import { b as useQueryClient, u as useQuery, c as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";

import "../_libs/seroval.mjs";
import "../_libs/bcryptjs.mjs";
import "../_libs/libsql__isomorphic-ws.mjs";
import "../_libs/libsql__hrana-client.mjs";
import "../_libs/promise-limit.mjs";
import "../_libs/aws4fetch.mjs";
import { L as LoaderCircle, m as Plus, T as Trash2, X } from "../_libs/lucide-react.mjs";

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
function EmployeesPage() {
  const list = useServerFn(listEmployees);
  const create = useServerFn(createEmployee);
  const del = useServerFn(deleteEmployee);
  const rolesFn = useServerFn(listRoles);
  const qc = useQueryClient();
  const {
    data,
    isLoading,
    error
  } = useQuery({
    queryKey: ["employees"],
    queryFn: () => list()
  });
  const {
    data: roles
  } = useQuery({
    queryKey: ["roles"],
    queryFn: () => rolesFn()
  });
  const [open, setOpen] = reactExports.useState(false);
  const createMut = useMutation({
    mutationFn: (v) => create({
      data: v
    }),
    onSuccess: () => {
      toast.success("تم الإنشاء");
      qc.invalidateQueries({
        queryKey: ["employees"]
      });
      setOpen(false);
    },
    onError: (e) => toast.error(e.message)
  });
  const delMut = useMutation({
    mutationFn: (user_id) => del({
      data: {
        user_id
      }
    }),
    onSuccess: () => {
      toast.success("تم الحذف");
      qc.invalidateQueries({
        queryKey: ["employees"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  if (isLoading) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid place-items-center py-20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin" }) });
  if (error) return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-destructive", children: error.message });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-2xl font-bold", children: [
        "المستخدمون (",
        data?.length ?? 0,
        ")"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setOpen(true), className: "inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-sm font-semibold text-background hover:bg-foreground/90", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
        " إضافة مستخدم"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-hidden rounded-xl border border-border bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-secondary/60 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3", children: "البريد" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3", children: "الدور" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3", children: "تاريخ الإنشاء" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: (data ?? []).map((u) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-border", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 font-medium", children: u.email }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-secondary px-2 py-0.5 text-xs", children: getRoleLabel(u.role) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-muted-foreground", children: new Date(u.created_at).toLocaleDateString("ar") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-left", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => {
          if (confirm(`حذف ${u.email}؟`)) delMut.mutate(u.user_id);
        }, className: "inline-flex items-center gap-1 rounded-md border border-destructive/30 px-2 py-1 text-xs text-destructive hover:bg-destructive/10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }),
          " حذف"
        ] }) })
      ] }, u.user_id + u.role)) })
    ] }) }),
    open ? /* @__PURE__ */ jsxRuntimeExports.jsx(NewEmployeeModal, { roles: roles ?? [], onClose: () => setOpen(false), onSave: (v) => createMut.mutate(v), saving: createMut.isPending }) : null
  ] });
}
function NewEmployeeModal({
  onClose,
  onSave,
  saving,
  roles
}) {
  const [email, setEmail] = reactExports.useState("");
  const [password, setPassword] = reactExports.useState("");
  const [roleId, setRoleId] = reactExports.useState("");
  reactExports.useEffect(() => {
    if (!roleId && roles.length > 0) {
      const employeeRole = roles.find((r) => r.name === "employee") ?? roles[0];
      setRoleId(employeeRole.id);
    }
  }, [roles, roleId]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 grid place-items-center bg-black/50 p-4", onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-md rounded-2xl bg-card p-6 shadow-xl", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold", children: "مستخدم جديد" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-5 w-5" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1.5 block text-sm font-semibold", children: "البريد" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "email", className: "inp", value: email, onChange: (e) => setEmail(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1.5 block text-sm font-semibold", children: "كلمة المرور" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "password", autoComplete: "new-password", className: "inp", value: password, onChange: (e) => setPassword(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1.5 block text-sm font-semibold", children: "الدور" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("select", { className: "inp", value: roleId, onChange: (e) => setRoleId(e.target.value), children: roles.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: r.id, children: r.label }, r.id)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 flex gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { disabled: saving || !email || password.length < 6 || !roleId, onClick: () => onSave({
        email,
        password,
        role_id: roleId
      }), className: "flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-sm font-semibold text-background hover:bg-foreground/90 disabled:opacity-60", children: [
        saving ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : null,
        " إنشاء"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, className: "rounded-md border border-border px-4 py-2.5 text-sm", children: "إلغاء" })
    ] })
  ] }) });
}
export {
  EmployeesPage as component
};
