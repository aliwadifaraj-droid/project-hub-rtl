import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useServerFn, d as listProjects, e as upsertProject, f as deleteProject, k as getMyRoles, U as getMyUserId, ab as listAllProjectVipStatus, h as hasAdminRole } from "./router-CtQuP2fc.mjs";
import { b as useQueryClient, u as useQuery, c as useMutation } from "../_libs/tanstack__react-query.mjs";
import { u as uploadFile } from "./files.functions-BOtEkJh5.mjs";
import { P as ProjectStatusBadge, A as AdminProjectStatus } from "./admin-project-status-W416iGbR.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { S as SAUDI_CITIES } from "./saudi-cities-D2sGDQV3.mjs";

import "../_libs/seroval.mjs";
import "../_libs/bcryptjs.mjs";
import "../_libs/libsql__isomorphic-ws.mjs";
import "../_libs/libsql__hrana-client.mjs";
import "../_libs/promise-limit.mjs";
import "../_libs/aws4fetch.mjs";
import { L as LoaderCircle, m as Plus, a0 as Eye, n as Pencil, T as Trash2, a1 as Crown, o as Check, p as Share2, X, q as Upload, r as Copy } from "../_libs/lucide-react.mjs";

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
function ProjectsAdminPage() {
  const list = useServerFn(listProjects);
  const upsert = useServerFn(upsertProject);
  const del = useServerFn(deleteProject);
  const getRoles = useServerFn(getMyRoles);
  const whoami = useServerFn(getMyUserId);
  const fetchVipStatus = useServerFn(listAllProjectVipStatus);
  const qc = useQueryClient();
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: () => list()
  });
  const {
    data: roles
  } = useQuery({
    queryKey: ["my-roles"],
    queryFn: () => getRoles()
  });
  const {
    data: me
  } = useQuery({
    queryKey: ["my-user-id"],
    queryFn: () => whoami()
  });
  const {
    data: vipStatuses
  } = useQuery({
    queryKey: ["admin-project-vip"],
    queryFn: () => fetchVipStatus()
  });
  const isAdmin = hasAdminRole(roles);
  const myId = me?.userId ?? null;
  const vipByProject = new Map((vipStatuses ?? []).map((v) => [v.project_id, v]));
  const [editing, setEditing] = reactExports.useState(null);
  const [sharedId, setSharedId] = reactExports.useState(null);
  const saveMut = useMutation({
    mutationFn: (v) => upsert({
      data: v
    }),
    onSuccess: (res, vars) => {
      toast.success("تم الحفظ");
      qc.invalidateQueries({
        queryKey: ["admin-projects"]
      });
      qc.invalidateQueries({
        queryKey: ["projects"]
      });
      setEditing(null);
      if (!vars.id && res?.id) setSharedId(res.id);
    },
    onError: (e) => toast.error(e.message)
  });
  const delMut = useMutation({
    mutationFn: (id) => del({
      data: {
        id
      }
    }),
    onSuccess: () => {
      toast.success("تم الحذف");
      qc.invalidateQueries({
        queryKey: ["admin-projects"]
      });
      qc.invalidateQueries({
        queryKey: ["projects"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  if (isLoading) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid place-items-center py-20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin" }) });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-2xl font-bold", children: [
        "إدارة المشاريع (",
        data?.length ?? 0,
        ")"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setEditing({
        name: "",
        description: "",
        location: "",
        duration: "",
        cover_image: "",
        images: []
      }), className: "inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-sm font-semibold text-background hover:bg-foreground/90", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
        " مشروع جديد"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: (data ?? []).map((p) => {
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-hidden rounded-xl border border-border bg-card", children: [
        p.cover_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: p.cover_url, alt: p.name, loading: "lazy", className: "aspect-video w-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "aspect-video w-full bg-secondary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-bold", children: p.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ProjectStatusBadge, { status: p.status })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(VipBadge, { expires_at: vipByProject.get(p.id)?.expires_at ?? null, projectId: p.id }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs text-muted-foreground", children: [
            p.location,
            " • ",
            p.duration
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex flex-wrap gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/project/$id", params: {
              id: p.id
            }, className: "inline-flex items-center justify-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-3.5 w-3.5" }),
              " تفاصيل"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ShareLinkButton, { id: p.id }),
            (isAdmin || myId && p.created_by === myId) && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setEditing(p), className: "inline-flex items-center justify-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-3.5 w-3.5" }),
                " تعديل"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => {
                if (confirm("تأكيد الحذف؟")) delMut.mutate(p.id);
              }, className: "inline-flex items-center justify-center gap-1 rounded-md border border-destructive/30 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }),
                " حذف"
              ] })
            ] })
          ] }),
          isAdmin ? /* @__PURE__ */ jsxRuntimeExports.jsx(AdminProjectStatus, { projectId: p.id, currentStatus: p.status, queryKey: ["admin-projects"] }) : null
        ] })
      ] }, p.id);
    }) }),
    editing ? /* @__PURE__ */ jsxRuntimeExports.jsx(ProjectModal, { value: editing, onClose: () => setEditing(null), onSave: (v) => saveMut.mutate(v), saving: saveMut.isPending }) : null,
    sharedId ? /* @__PURE__ */ jsxRuntimeExports.jsx(SharedLinkModal, { id: sharedId, onClose: () => setSharedId(null) }) : null
  ] });
}
function VipBadge({
  expires_at,
  projectId
}) {
  if (!expires_at) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/admin/vip", className: "inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-400", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { className: "h-3 w-3" }),
      " تفعيل الحصرية"
    ] });
  }
  const days = Math.ceil((new Date(expires_at).getTime() - Date.now()) / 864e5);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { className: "h-3 w-3" }),
    " مميز - متبقي ",
    days,
    " يوم"
  ] });
}
function ProjectModal({
  value,
  onClose,
  onSave,
  saving
}) {
  const [form, setForm] = reactExports.useState(value);
  const [uploading, setUploading] = reactExports.useState(false);
  const upload = useServerFn(uploadFile);
  async function uploadFile$1(file) {
    const data = await fileToBase64(file);
    const purpose = file.type === "application/pdf" ? "bid-pdf" : "project-image";
    const res = await upload({
      data: {
        filename: file.name,
        mime: file.type,
        purpose,
        data
      }
    });
    return res.key;
  }
  async function onCover(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const path = await uploadFile$1(f);
      setForm((s) => ({
        ...s,
        cover_image: path
      }));
      toast.success("تم رفع صورة الغلاف");
    } catch (err) {
      toast.error("فشل الرفع");
      console.error(err);
    } finally {
      setUploading(false);
    }
  }
  async function onGallery(e) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const paths = await Promise.all(files.map(uploadFile$1));
      setForm((s) => ({
        ...s,
        images: [...s.images ?? [], ...paths]
      }));
    } catch {
      toast.error("فشل رفع الصور");
    } finally {
      setUploading(false);
    }
  }
  async function onPdf(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf") {
      toast.error("الملف يجب أن يكون PDF");
      return;
    }
    setUploading(true);
    try {
      const path = await uploadFile$1(f);
      setForm((s) => ({
        ...s,
        pdf_file: path
      }));
      toast.success("تم رفع ملف PDF");
    } catch (err) {
      toast.error("فشل رفع PDF");
      console.error(err);
    } finally {
      setUploading(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 grid place-items-center bg-black/50 p-4", onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-2xl rounded-2xl bg-card p-6 shadow-xl max-h-[90vh] overflow-auto", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold", children: form.id ? "تعديل مشروع" : "مشروع جديد" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, className: "rounded-md p-1 hover:bg-secondary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-5 w-5" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "اسم المشروع", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "inp", value: form.name ?? "", onChange: (e) => setForm({
        ...form,
        name: e.target.value
      }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "الوصف", children: /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { rows: 4, className: "inp", value: form.description ?? "", onChange: (e) => setForm({
        ...form,
        description: e.target.value
      }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "الموقع", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "inp", required: true, value: form.location ?? "", onChange: (e) => setForm({
          ...form,
          location: e.target.value
        }), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", disabled: true, children: "اختر المدينة" }),
          SAUDI_CITIES.map((city) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: city, children: city }, city))
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "المدة المتوقعة", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "inp", value: form.duration ?? "", onChange: (e) => setForm({
          ...form,
          duration: e.target.value
        }) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "صورة الغلاف", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-border bg-secondary/40 px-3 py-3 text-sm hover:bg-secondary", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-4 w-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 text-muted-foreground truncate", children: form.cover_image || "اختر صورة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "file", accept: "image/*", className: "hidden", onChange: onCover })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: `معرض الصور (${form.images?.length ?? 0})`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-border bg-secondary/40 px-3 py-3 text-sm hover:bg-secondary", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-4 w-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "إضافة صور" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "file", accept: "image/*", multiple: true, className: "hidden", onChange: onGallery })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Field, { label: "ملف PDF (اختياري)", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-border bg-secondary/40 px-3 py-3 text-sm hover:bg-secondary", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground truncate", children: form.pdf_file || "اختر ملف PDF" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "file", accept: "application/pdf", className: "hidden", onChange: onPdf })
        ] }),
        form.pdf_file ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setForm((s) => ({
          ...s,
          pdf_file: null
        })), className: "mt-1 text-xs text-destructive hover:underline", children: "إزالة الملف" }) : null
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { disabled: saving || uploading || !form.name || !form.cover_image, onClick: () => onSave(form), className: "flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-sm font-semibold text-background hover:bg-foreground/90 disabled:opacity-60", children: [
        saving || uploading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : null,
        " حفظ"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, className: "rounded-md border border-border px-4 py-2.5 text-sm hover:bg-secondary", children: "إلغاء" })
    ] })
  ] }) });
}
function Field({
  label,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1.5 block text-sm font-semibold", children: label }),
    children
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
function buildProjectUrl(id) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/project/${id}`;
}
async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return true;
  } catch {
    return false;
  }
}
function ShareLinkButton({
  id
}) {
  const [copied, setCopied] = reactExports.useState(false);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: async () => {
    const ok = await copyText(buildProjectUrl(id));
    if (ok) {
      setCopied(true);
      toast.success("تم نسخ الرابط");
      setTimeout(() => setCopied(false), 2e3);
    } else toast.error("تعذر النسخ");
  }, className: "inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary", children: [
    copied ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3.5 w-3.5 text-accent" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Share2, { className: "h-3.5 w-3.5" }),
    copied ? "تم النسخ" : "نسخ الرابط"
  ] });
}
function SharedLinkModal({
  id,
  onClose
}) {
  const url = buildProjectUrl(id);
  const [copied, setCopied] = reactExports.useState(false);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 grid place-items-center bg-black/50 p-4", onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-md rounded-2xl bg-card p-6 shadow-xl", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-bold", children: "تم نشر المشروع 🎉" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, className: "rounded-md p-1 hover:bg-secondary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-5 w-5" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-3 text-sm text-muted-foreground", children: "شارك هذا الرابط مع عملائك:" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 rounded-lg border border-border bg-secondary/40 p-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { readOnly: true, value: url, className: "flex-1 bg-transparent px-2 py-1 text-sm outline-none", dir: "ltr" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: async () => {
        const ok = await copyText(url);
        if (ok) {
          setCopied(true);
          toast.success("تم نسخ الرابط");
          setTimeout(() => setCopied(false), 2e3);
        } else toast.error("تعذر النسخ");
      }, className: "inline-flex items-center gap-1 rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:bg-foreground/90", children: [
        copied ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-3.5 w-3.5" }),
        copied ? "تم" : "نسخ"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, className: "mt-5 w-full rounded-md border border-border px-4 py-2 text-sm hover:bg-secondary", children: "إغلاق" })
  ] }) });
}
export {
  ProjectsAdminPage as component
};
