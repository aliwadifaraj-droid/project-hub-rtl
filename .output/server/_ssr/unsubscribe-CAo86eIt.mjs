import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";

function UnsubscribePage() {
  const [token, setToken] = reactExports.useState(null);
  const [state, setState] = reactExports.useState("loading");
  const [email, setEmail] = reactExports.useState(null);
  const [error, setError] = reactExports.useState(null);
  reactExports.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (!t) {
      setState("invalid");
      return;
    }
    setToken(t);
    fetch(`/email/unsubscribe?token=${encodeURIComponent(t)}`).then((r) => r.json()).then((d) => {
      if (d?.valid) {
        setEmail(d.email ?? null);
        setState("ready");
      } else {
        setState("invalid");
      }
    }).catch(() => setState("error"));
  }, []);
  async function confirm() {
    if (!token) return;
    try {
      const res = await fetch("/email/unsubscribe", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          token
        })
      });
      const d = await res.json();
      if (d?.success) setState("done");
      else {
        setError(d?.error ?? "فشل الإلغاء");
        setState("error");
      }
    } catch (e) {
      setError(e?.message ?? "خطأ");
      setState("error");
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { dir: "rtl", className: "min-h-screen flex items-center justify-center bg-background p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md w-full rounded-lg border bg-card p-6 text-center space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-semibold", children: "إلغاء الاشتراك من الرسائل" }),
    state === "loading" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "جارٍ التحقق…" }),
    state === "invalid" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-destructive", children: "الرابط غير صالح أو منتهي." }),
    state === "ready" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      email && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: email }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: confirm, className: "inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90", children: "تأكيد إلغاء الاشتراك" })
    ] }),
    state === "done" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-green-600", children: "تم إلغاء اشتراكك بنجاح." }),
    state === "error" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-destructive", children: error ?? "حدث خطأ." })
  ] }) });
}
export {
  UnsubscribePage as component
};
