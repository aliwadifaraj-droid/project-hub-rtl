import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { u as useServerFn, b as getMaintenance } from "./router-CtQuP2fc.mjs";

import "../_libs/seroval.mjs";
import "../_libs/bcryptjs.mjs";
import "../_libs/libsql__isomorphic-ws.mjs";
import "../_libs/libsql__hrana-client.mjs";
import "../_libs/promise-limit.mjs";
import "../_libs/aws4fetch.mjs";
import { W as Wrench } from "../_libs/lucide-react.mjs";

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
function useCountdown(target) {
  const [now, setNow] = reactExports.useState(() => Date.now());
  reactExports.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1e3);
    return () => clearInterval(t);
  }, []);
  if (!target) return null;
  const end = new Date(target).getTime();
  if (Number.isNaN(end)) return null;
  const diff = Math.max(0, end - now);
  const s = Math.floor(diff / 1e3);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor(s % 86400 / 3600),
    minutes: Math.floor(s % 3600 / 60),
    seconds: s % 60,
    done: diff === 0
  };
}
function MaintenancePage() {
  const fetchMaintenance = useServerFn(getMaintenance);
  const {
    data
  } = useQuery({
    queryKey: ["maintenance-public"],
    queryFn: () => fetchMaintenance(),
    refetchInterval: 3e4
  });
  const cd = useCountdown(data?.endAt ?? null);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-secondary/40 flex items-center justify-center px-4", dir: "rtl", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-lg w-full rounded-2xl border border-border bg-card p-8 text-center shadow-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Wrench, { className: "h-8 w-8" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-4 text-2xl font-bold", children: "الموقع تحت الصيانة" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-muted-foreground text-sm", children: "نعمل حاليًا على تحسين الخدمة. نعتذر عن الإزعاج وسنعود قريبًا بإذن الله." }),
    data?.endAt && cd && !cd.done && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mb-2", children: "الوقت المتبقي" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-4 gap-2", children: [{
        l: "يوم",
        v: cd.days
      }, {
        l: "ساعة",
        v: cd.hours
      }, {
        l: "دقيقة",
        v: cd.minutes
      }, {
        l: "ثانية",
        v: cd.seconds
      }].map((x) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-secondary p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold tabular-nums", children: String(x.v).padStart(2, "0") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-muted-foreground mt-1", children: x.l })
      ] }, x.l)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 text-xs text-muted-foreground", children: [
        "العودة المتوقعة: ",
        new Date(data.endAt).toLocaleString("ar")
      ] })
    ] }),
    data?.endAt && cd?.done && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 text-sm text-primary", children: "انتهى وقت الصيانة، يمكنك تحديث الصفحة الآن." })
  ] }) });
}
export {
  MaintenancePage as component
};
