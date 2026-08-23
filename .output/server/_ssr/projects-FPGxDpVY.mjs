import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useServerFn, d as listProjects, e as upsertProject, f as deleteProject, g as getMe, h as hasAdminRole } from "./router-CtQuP2fc.mjs";
import { b as useQueryClient, u as useQuery, c as useMutation } from "../_libs/tanstack__react-query.mjs";
import { u as uploadFile } from "./files.functions-BOtEkJh5.mjs";
import { b as buildR2Url } from "./projects-SbdB-UfH.mjs";
import { S as SiteHeader } from "./site-header-DfiCN8H8.mjs";
import { S as SiteFooter } from "./site-footer-ByXRtXvu.mjs";
import { T as Toaster } from "./sonner-DeNSN9-c.mjs";
import { t as toast } from "../_libs/sonner.mjs";

import "../_libs/seroval.mjs";
import "../_libs/bcryptjs.mjs";
import "../_libs/libsql__isomorphic-ws.mjs";
import "../_libs/libsql__hrana-client.mjs";
import "../_libs/promise-limit.mjs";
import "../_libs/aws4fetch.mjs";
import { m as Plus, L as LoaderCircle, n as Pencil, T as Trash2, o as Check, p as Share2, X, q as Upload, r as Copy } from "../_libs/lucide-react.mjs";

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
import "./notifications.functions-mf2-5xG4.mjs";
import "./chat.functions-DV_-1jmL.mjs";
function ProjectsPage() {
  const list = useServerFn(listProjects);
  const upsert = useServerFn(upsertProject);
  const del = useServerFn(deleteProject);
  const meFn = useServerFn(getMe);
  const qc = useQueryClient();
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["projects"],
    queryFn: () => list()
  });
  const [isAdmin, setIsAdmin] = reactExports.useState(false);
  const [signedIn, setSignedIn] = reactExports.useState(false);
  const [editing, setEditing] = reactExports.useState(null);
  const [sharedId, setSharedId] = reactExports.useState(null);
  reactExports.useEffect(() => {
    let cancelled = false;
    meFn().then((me) => {
      if (!me || cancelled) return;
      setSignedIn(true);
      setIsAdmin(hasAdminRole(me.roles));
    }).catch(() => void 0);
    return () => {
      cancelled = true;
    };
  }, [meFn]);
  const saveMut = useMutation({
    mutationFn: (v) => upsert({
      data: v
    }),
    onSuccess: (res, vars) => {
      if (res?.admin_approval === "pending") {
        toast.success("تم إرسال المشروع للمراجعة من الأدمن");
      } else {
        toast.success("تم الحفظ");
      }
      qc.invalidateQueries({
        queryKey: ["projects"]
      });
      qc.invalidateQueries({
        queryKey: ["admin-projects"]
      });
      setEditing(null);
      if (!vars.id && res?.id && res?.admin_approval !== "pending") {
        setSharedId(res.id);
      }
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
        queryKey: ["projects"]
      });
      qc.invalidateQueries({
        queryKey: ["admin-projects"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Toaster, { position: "top-center", dir: "rtl" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "container mx-auto px-4 py-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-2xl font-bold", children: [
          "المشاريع (",
          data?.length ?? 0,
          ")"
        ] }),
        signedIn ? /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setEditing({
          name: "",
          description: "",
          location: "",
          duration: "",
          cover_image: "",
          images: []
        }), className: "inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-sm font-semibold text-background hover:bg-foreground/90", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
          " مشروع جديد"
        ] }) : null
      ] }),
      isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid place-items-center py-20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: (data ?? []).map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-hidden rounded-xl border border-border bg-card", children: [
        (() => {
          const fallback = buildR2Url(p.cover_image);
          const src = p.cover_url || fallback || "";
          return src ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src, alt: p.name, className: "aspect-video w-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "aspect-video w-full bg-secondary" });
        })(),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-bold", children: p.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs text-muted-foreground", children: [
            p.location,
            " • ",
            p.duration
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex flex-wrap gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ShareLinkButton, { id: p.id }),
            isAdmin ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
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
            ] }) : null
          ] })
        ] })
      ] }, p.id)) }),
      editing ? /* @__PURE__ */ jsxRuntimeExports.jsx(ProjectModal, { value: editing, onClose: () => setEditing(null), onSave: (v) => saveMut.mutate(v), saving: saveMut.isPending }) : null,
      sharedId ? /* @__PURE__ */ jsxRuntimeExports.jsx(SharedLinkModal, { id: sharedId, onClose: () => setSharedId(null) }) : null
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SiteFooter, {})
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
  async function uploadProjectFile(file) {
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
      const path = await uploadProjectFile(f);
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
      const paths = await Promise.all(files.map(uploadProjectFile));
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
      const path = await uploadProjectFile(f);
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
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "الموقع", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "inp", value: form.location ?? "", onChange: (e) => setForm({
          ...form,
          location: e.target.value
        }) }) }),
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
  ProjectsPage as component
};
