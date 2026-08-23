import { c as createServerRpc } from "./createServerRpc-DYLDSQ_Q.mjs";
import { c as createServerFn } from "./server-COznR7QB.mjs";
import { a as requireAdmin, r as requireAuth } from "./auth-middleware.server-B9hAjfqi.mjs";
import { listPending, countPending, getById, updateProject } from "./projects.repo-DX_seSWS.mjs";
import { h as findUserById } from "./users.repo-HvqqZq_-.mjs";
import { i as invalidateProjectsAll, b as invalidateQuotes } from "./cache-sw4uQcOM.mjs";
import { autoActivateByCity } from "./vip.repo-CycBrLVA.mjs";
import { n as notifyVipSubscribersOfNewProject } from "./vip-notify.server-CM9VcWi6.mjs";
import { d as db } from "./db-D5OYORU-.mjs";
import { setExclusiveWindow } from "./project-exclusive.repo-ZctflcbZ.mjs";

import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import "../_libs/bcryptjs.mjs";
import "../_libs/libsql__isomorphic-ws.mjs";
import "../_libs/libsql__hrana-client.mjs";
import "../_libs/promise-limit.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";

import "../_libs/h3-v2.mjs";
import "../_libs/unenv.mjs";


import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";





import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";

import "../_libs/tanstack__react-router.mjs";
import "../_libs/react-dom.mjs";
import "../_libs/isbot.mjs";
import "../_libs/libsql__client.mjs";
import "../_libs/libsql__core.mjs";
import "../_libs/js-base64.mjs";
import "../_libs/jose.mjs";

import "./saudi-cities-D2sGDQV3.mjs";
import "./resend-send.server-Cc6n_-h6.mjs";
const DEFAULT_HOURS = 6;
async function getExclusiveHours() {
  try {
    const r = await db.execute(
      `SELECT value FROM site_settings WHERE key = 'exclusive_hours' LIMIT 1`
    );
    const row = r.rows[0];
    if (row?.value) {
      const n = Number(JSON.parse(row.value));
      if (Number.isFinite(n) && n > 0) return Math.min(n, 720);
    }
  } catch {
    return DEFAULT_HOURS;
  }
  return DEFAULT_HOURS;
}
async function applyExclusiveWindow(projectId, location, city) {
  const { detectCity } = await import("./vip-notify.server-CM9VcWi6.mjs").then((n) => n.a);
  const detected = detectCity(location);
  if (!detected) return;
  const { listActiveByCity } = await import("./vip.repo-CycBrLVA.mjs");
  const subscribers = await listActiveByCity(detected).catch(() => []);
  if (subscribers.length === 0) return;
  const durationHours = await getExclusiveHours();
  const startedAt = /* @__PURE__ */ new Date();
  const expiresAt = new Date(startedAt.getTime() + durationHours * 36e5);
  await setExclusiveWindow({
    project_id: projectId,
    vip_start_at: startedAt.toISOString(),
    vip_end_at: expiresAt.toISOString(),
    duration_hours: durationHours
  });
}
const listPendingProjects_createServerFn_handler = createServerRpc({
  id: "4566ade9bb98508870423efaadce8b560262f2655fdd5b8ba7e23267e21d5668",
  name: "listPendingProjects",
  filename: "src/lib/project-approval.functions.ts"
}, (opts) => listPendingProjects.__executeServer(opts));
const listPendingProjects = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(listPendingProjects_createServerFn_handler, async () => {
  const rows = await listPending();
  return Promise.all(rows.map(async (p) => {
    const u = p.created_by ? await findUserById(p.created_by).catch(() => null) : null;
    return {
      ...p,
      creator_email: u?.email ?? ""
    };
  }));
});
const countPendingProjects_createServerFn_handler = createServerRpc({
  id: "fabf83d09b4f50e361d550bb061e43007736f2c7f192b3b91fc90bcd215b8247",
  name: "countPendingProjects",
  filename: "src/lib/project-approval.functions.ts"
}, (opts) => countPendingProjects.__executeServer(opts));
const countPendingProjects = createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(countPendingProjects_createServerFn_handler, async ({
  context
}) => {
  if (!context.roles.includes("admin")) return 0;
  return countPending();
});
const approveProject_createServerFn_handler = createServerRpc({
  id: "ce5211c91c96ea83d2bf1a2de856e6d5af5baf6508fb8401d3bc8e4a1a278a99",
  name: "approveProject",
  filename: "src/lib/project-approval.functions.ts"
}, (opts) => approveProject.__executeServer(opts));
const approveProject = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(approveProject_createServerFn_handler, async ({
  data
}) => {
  const row = await getById(data.id);
  if (!row) throw new Error("المشروع غير موجود");
  await updateProject(data.id, {
    admin_approval: "approved"
  });
  await invalidateProjectsAll();
  await invalidateQuotes(row.created_by);
  if (row.location) {
    try {
      await applyExclusiveWindow(data.id, row.location);
      await autoActivateByCity(row.location, 6);
    } catch (e) {
      console.error("auto vip activation error", e);
    }
  }
  notifyVipSubscribersOfNewProject({
    id: row.id,
    name: row.name,
    description: row.description,
    location: row.location,
    duration: row.duration
  }).catch((e) => console.error("[vip-notify]", e));
  if (row.created_by) {
    const {
      insertOne
    } = await import("./notifications.repo-vog42ua4.mjs");
    await insertOne({
      user_id: row.created_by,
      title: "تمت الموافقة على مشروعك",
      body: `تمت الموافقة على المشروع: ${row.name}`,
      link: `/projects/${row.id}`
    });
    try {
      const u = await findUserById(row.created_by);
      if (u?.email) {
        const {
          sendResendEmail
        } = await import("./resend-send.server-Cc6n_-h6.mjs");
        await sendResendEmail({
          to: u.email,
          subject: "تمت الموافقة على مشروعك ✅",
          html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:20px"><h2>مرحباً،</h2><p>يسعدنا إبلاغك بأنه تمت <strong>الموافقة</strong> على مشروعك "${row.name}".</p><p>أصبح مشروعك الآن منشوراً ومتاحاً للعموم.</p></div>`
        });
      }
    } catch (e) {
      console.error("project approval email error", e);
    }
  }
  return {
    ok: true
  };
});
const rejectProject_createServerFn_handler = createServerRpc({
  id: "c1b423a7dbe5ef78b5653345dc2eee2dfa32cc1c6bfedd947532453fe5d87606",
  name: "rejectProject",
  filename: "src/lib/project-approval.functions.ts"
}, (opts) => rejectProject.__executeServer(opts));
const rejectProject = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  id: stringType().uuid(),
  reason: stringType().max(500).optional()
}).parse(d)).handler(rejectProject_createServerFn_handler, async ({
  data
}) => {
  const row = await getById(data.id);
  if (!row) throw new Error("المشروع غير موجود");
  await updateProject(data.id, {
    admin_approval: "rejected"
  });
  await invalidateProjectsAll();
  await invalidateQuotes(row.created_by);
  if (row.created_by) {
    const {
      insertOne
    } = await import("./notifications.repo-vog42ua4.mjs");
    await insertOne({
      user_id: row.created_by,
      title: "تم رفض مشروعك",
      body: data.reason ? `${row.name}: ${data.reason}` : `تم رفض المشروع: ${row.name}`
    });
  }
  return {
    ok: true
  };
});
export {
  approveProject_createServerFn_handler,
  countPendingProjects_createServerFn_handler,
  listPendingProjects_createServerFn_handler,
  rejectProject_createServerFn_handler
};
