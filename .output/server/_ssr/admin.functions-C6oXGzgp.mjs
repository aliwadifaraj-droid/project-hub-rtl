import process from "node:process";
import { Buffer } from "node:buffer";
import { c as createServerRpc } from "./createServerRpc-Dx-ThoJh.mjs";
import { c as createServerFn } from "./server-BNqJEEJz.mjs";
import { r as requireAuth, a as requireAdmin } from "./auth-middleware.server-CWyFWbOs.mjs";
import { h as hashPassword, d as db, r as rowsToObjects } from "./db-BSVZwhof.mjs";
import { l as listUsersWithRoles, g as getRoleNameById, f as findUserByEmail, c as createUser, a as grantRole, d as deleteUser, b as getRolesForUser } from "./users.repo-JS4Zo3xr.mjs";
import { l as listAllProjects, b as getById, a as getProjectExclusive, f as findByOwnerAndName, u as updateProject, i as insertProject, s as setProjectExclusive, d as deleteProject$1, c as setBotOffersEnabled, e as setAllBotOffersEnabled, h as setOffersEnabled, j as setAllOffersEnabled, k as updateProjectExclusivity, m as searchByName } from "./projects.repo-GgbtJXPt.mjs";
import { searchRequestsByCompany, getRequestByPdfPath, listAllRequests, listPlatformRequests, getRequestById, insertRequest, updateRequestStatus as updateRequestStatus$1 } from "./project-requests.repo-tu1FwgzE.mjs";
import { listOfferNotificationsBySource, getOfferNotificationById, deleteOfferNotification, updateOfferNotificationStatus, insertOfferNotificationMany } from "./notifications.repo-CpR-n2ns.mjs";
import { l as listContactMessages, c as countContactMessagesSince, d as deleteContactMessage, g as getContactMessageById, s as setContactReply } from "./contact-messages.repo-CA70kHjz.mjs";
import { i as isBlocked } from "./blocked.repo-C-JF9Ik-.mjs";
import { B as BLOCKED_MESSAGE } from "./blocked.functions-B0hy_Vq2.mjs";
import { r as resolveStoredFileUrl } from "./storage-url-BOHLt4ef.mjs";
import { c as cached, a as cacheKeys, T as TTL_PROJECTS, i as invalidateProjectsAll, b as invalidateQuotes } from "./cache-sw4uQcOM.mjs";
import { d as detectCity, n as notifyVipSubscribersOfNewProject } from "./vip-notify.server-PhbhwAkL.mjs";
import { listActiveByCity } from "./vip.repo-BoiBu0-3.mjs";

import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import "../_libs/bcryptjs.mjs";
import "../_libs/libsql__isomorphic-ws.mjs";
import "../_libs/libsql__hrana-client.mjs";
import "../_libs/promise-limit.mjs";
import { o as objectType, s as stringType, e as enumType, a as arrayType, b as booleanType, n as numberType } from "../_libs/zod.mjs";
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

import "./createSsrRpc-C50NoQin.mjs";
import "./saudi-cities-D2sGDQV3.mjs";
import "./resend-send.server-Cc6n_-h6.mjs";
function decode(r) {
  let images = [];
  try {
    images = r.images ? JSON.parse(r.images) : [];
  } catch {
    images = [];
  }
  return {
    id: String(r.id),
    submitter_id: r.submitter_id ?? null,
    name: r.name ?? null,
    description: r.description ?? null,
    location: r.location ?? null,
    duration: r.duration ?? null,
    cover_image: r.cover_image ?? null,
    images,
    contact_phone: r.contact_phone ?? null,
    status: String(r.status ?? "pending"),
    approved_project_id: r.approved_project_id ?? null,
    created_at: String(r.created_at ?? "")
  };
}
const COLS = "id,submitter_id,name,description,location,duration,cover_image,images,contact_phone,status,approved_project_id,created_at";
let _contactPhoneColReady = null;
function ensureContactPhoneColumn() {
  if (!_contactPhoneColReady) {
    _contactPhoneColReady = db.execute(`ALTER TABLE project_submissions ADD COLUMN contact_phone TEXT`).then(() => void 0).catch(() => void 0);
  }
  return _contactPhoneColReady;
}
let _approvedProjectIdColReady = null;
function ensureApprovedProjectIdColumn() {
  if (!_approvedProjectIdColReady) {
    _approvedProjectIdColReady = db.execute(`ALTER TABLE project_submissions ADD COLUMN approved_project_id TEXT`).then(() => void 0).catch(() => void 0);
  }
  return _approvedProjectIdColReady;
}
async function ensureColumns() {
  await ensureContactPhoneColumn();
  await ensureApprovedProjectIdColumn();
}
async function listAllSubmissions() {
  await ensureColumns();
  const r = await db.execute(`SELECT ${COLS} FROM project_submissions ORDER BY created_at DESC`);
  return rowsToObjects(r).map(decode);
}
async function getSubmissionById(id) {
  await ensureColumns();
  const r = await db.execute(`SELECT ${COLS} FROM project_submissions WHERE id = ? LIMIT 1`, [id]);
  const rows = rowsToObjects(r);
  return rows[0] ? decode(rows[0]) : null;
}
async function insertSubmission(input) {
  await ensureColumns();
  const id = crypto.randomUUID();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await db.execute(
    `INSERT INTO project_submissions (id,submitter_id,name,description,location,duration,cover_image,images,contact_phone,status,created_at)
     VALUES (?,?,?,?,?,?,?,?,?, 'pending', ?)`,
    [
      id,
      input.submitter_id ?? null,
      input.name,
      input.description,
      input.location,
      input.duration ?? null,
      input.cover_image ?? null,
      JSON.stringify(input.images ?? []),
      input.contact_phone,
      now
    ]
  );
  return id;
}
async function markSubmissionApproved(id, approvedProjectId) {
  await ensureColumns();
  await db.execute(
    `UPDATE project_submissions SET status = 'approved', approved_project_id = ? WHERE id = ?`,
    [approvedProjectId, id]
  );
}
async function deleteSubmission$1(id) {
  await db.execute(`DELETE FROM project_submissions WHERE id = ?`, [id]);
}
async function resolveStoragePath(path) {
  return resolveStoredFileUrl(path, 60 * 60 * 24 * 7).catch(() => "");
}
const listProjects_createServerFn_handler = createServerRpc({
  id: "108da303932a7a7d02c5b9ed633a3d44fdfcbb2191a7f3c4a577cefacb50c97a",
  name: "listProjects",
  filename: "src/lib/admin.functions.ts"
}, (opts) => listProjects.__executeServer(opts));
const listProjects = createServerFn({
  method: "GET"
}).handler(listProjects_createServerFn_handler, async () => {
  try {
    return await cached(cacheKeys.projectsAll(), TTL_PROJECTS, async () => {
      const rows = await listAllProjects();
      return Promise.all(rows.map(async (p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        location: p.location,
        duration: p.duration,
        cover_image: p.cover_image,
        images: p.images,
        pdf_file: p.pdf_file,
        created_by: p.created_by,
        status: p.status,
        admin_approval: p.admin_approval,
        cover_url: await resolveStoragePath(p.cover_image).catch(() => ""),
        pdf_url: p.pdf_file ? await resolveStoragePath(p.pdf_file).catch(() => "") : ""
      })));
    });
  } catch (e) {
    console.error("[listProjects] unexpected error:", e);
    return [];
  }
});
const getProject_createServerFn_handler = createServerRpc({
  id: "733fbcb8fb28a6c5b7cf31b3247744ba1b32162789273385c0ee4a6f1e7c8013",
  name: "getProject",
  filename: "src/lib/admin.functions.ts"
}, (opts) => getProject.__executeServer(opts));
const getProject = createServerFn({
  method: "GET"
}).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(getProject_createServerFn_handler, async ({
  data
}) => {
  try {
    const p = await getById(data.id);
    if (!p) return null;
    const cover_url = await resolveStoragePath(p.cover_image).catch(() => "");
    const image_urls = await Promise.all((p.images ?? []).map((path) => resolveStoragePath(path).catch(() => "")));
    const pdf_url = p.pdf_file ? await resolveStoragePath(p.pdf_file).catch(() => "") : "";
    const exclusive = await getProjectExclusive(data.id);
    const vip_end_at = exclusive?.vip_end_at ?? null;
    const is_exclusive = vip_end_at ? Date.now() < new Date(vip_end_at).getTime() : false;
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      location: p.location,
      duration: p.duration,
      cover_image: p.cover_image,
      images: p.images,
      pdf_file: p.pdf_file,
      status: p.status,
      offers_enabled: p.offers_enabled,
      is_exclusive,
      exclusive_until: p.exclusive_until,
      vip_end_at,
      cover_url,
      image_urls,
      pdf_url
    };
  } catch (e) {
    console.error("[getProject] unexpected error:", e);
    return null;
  }
});
const searchRequests_createServerFn_handler = createServerRpc({
  id: "b86f98e7f0fcb133545a93fadb38ee922e3837fea4287a16fa6b77327ac96ffd",
  name: "searchRequests",
  filename: "src/lib/admin.functions.ts"
}, (opts) => searchRequests.__executeServer(opts));
const searchRequests = createServerFn({
  method: "GET"
}).inputValidator((d) => objectType({
  q: stringType().trim().min(1).max(200)
}).parse(d)).handler(searchRequests_createServerFn_handler, async ({
  data
}) => {
  const rows = await searchRequestsByCompany(data.q);
  const withProj = await Promise.all(rows.map(async (r) => {
    const proj = r.project_id ? await getById(r.project_id).catch(() => null) : null;
    return {
      ...r,
      projects: proj ? {
        name: proj.name
      } : null
    };
  }));
  return withProj;
});
const getBidPdfUrl_createServerFn_handler = createServerRpc({
  id: "d9f867b576065bd30138998985d6a0306998465cdb7b77e80817a06cfae1c4a6",
  name: "getBidPdfUrl",
  filename: "src/lib/admin.functions.ts"
}, (opts) => getBidPdfUrl.__executeServer(opts));
const getBidPdfUrl = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  path: stringType().min(1).max(500)
}).parse(d)).handler(getBidPdfUrl_createServerFn_handler, async ({
  data,
  context
}) => {
  const isAdmin = context.roles.includes("admin");
  if (!isAdmin) {
    const req = await getRequestByPdfPath(data.path);
    const proj = req?.project_id ? await getById(req.project_id) : null;
    if (!proj || proj.created_by !== context.userId) throw new Error("غير مصرح بفتح هذا الملف");
  }
  const {
    signGetUrl
  } = await import("./r2-CJ2zxhhj.mjs");
  return signGetUrl(data.path, 60 * 10);
});
const adminListRequests_createServerFn_handler = createServerRpc({
  id: "eda19de27b2c907e246e2bdb835df6d9a12148d41da92c8ef3c5bdfc5b014cd1",
  name: "adminListRequests",
  filename: "src/lib/admin.functions.ts"
}, (opts) => adminListRequests.__executeServer(opts));
const adminListRequests = createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(adminListRequests_createServerFn_handler, async ({
  context
}) => {
  const isAdmin = context.roles.includes("admin");
  const rows = await listAllRequests();
  return Promise.all(rows.map(async (r) => {
    const proj = r.project_id ? await getById(r.project_id).catch(() => null) : null;
    const canManage = !!proj && proj.created_by === context.userId;
    return {
      ...r,
      email: isAdmin || canManage ? r.email : null,
      note: isAdmin || canManage ? r.note : null,
      projects: proj ? {
        name: proj.name
      } : null,
      can_manage: canManage
    };
  }));
});
const getPlatformRequests_createServerFn_handler = createServerRpc({
  id: "8f652ff9fa3632dea93a9983aed261705bcabde86949f17d879eb4b6425a6e4d",
  name: "getPlatformRequests",
  filename: "src/lib/admin.functions.ts"
}, (opts) => getPlatformRequests.__executeServer(opts));
const getPlatformRequests = createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(getPlatformRequests_createServerFn_handler, async ({
  context
}) => {
  const isAdmin = context.roles.includes("admin");
  const requests = await listPlatformRequests();
  const offerNotifs = await listOfferNotificationsBySource("platform");
  const fromRequests = await Promise.all(requests.map(async (r) => {
    const proj = r.project_id ? await getById(r.project_id).catch(() => null) : null;
    const canManage = !!proj && proj.created_by === context.userId;
    return {
      id: r.id,
      project_id: r.project_id,
      company_name: r.company_name,
      facility_location: r.facility_location,
      email: isAdmin || canManage ? r.email : null,
      pdf_url: r.pdf_url,
      status: r.status,
      submitter_type: r.submitter_type ?? "visitor",
      project_type: r.project_type ?? "platform",
      note: r.note,
      created_at: r.created_at,
      projects: proj ? {
        name: proj.name
      } : null,
      can_manage: canManage
    };
  }));
  const fromNotifications = offerNotifs.map((n) => ({
    id: n.id,
    project_id: n.project_id,
    company_name: n.company_name ?? "",
    facility_location: n.facility_location,
    email: isAdmin ? n.email : null,
    pdf_url: n.pdf_key,
    status: n.offer_status ?? "new",
    submitter_type: n.submitter_type ?? "visitor",
    project_type: "platform",
    note: null,
    created_at: n.created_at,
    projects: n.project_name ? {
      name: n.project_name
    } : null,
    can_manage: false
  }));
  const seen = new Set(fromRequests.map((r) => r.id));
  return [...fromRequests, ...fromNotifications.filter((n) => !seen.has(n.id))].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
});
const getAddProjectRequests_createServerFn_handler = createServerRpc({
  id: "3add45dd2017b4ee770445d6ef39bfbb1c8e55446695d0a84cf782b68e7e3c4b",
  name: "getAddProjectRequests",
  filename: "src/lib/admin.functions.ts"
}, (opts) => getAddProjectRequests.__executeServer(opts));
const getAddProjectRequests = createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(getAddProjectRequests_createServerFn_handler, async ({
  context
}) => {
  const isAdmin = context.roles.includes("admin");
  const offers = await listOfferNotificationsBySource("add_project");
  return offers.map((o) => ({
    id: o.id,
    project_id: o.project_id,
    company_name: o.company_name ?? "",
    facility_location: o.facility_location,
    email: isAdmin ? o.email : null,
    pdf_url: o.pdf_key,
    status: o.offer_status ?? "new",
    submitter_type: o.submitter_type ?? "visitor",
    project_type: "add_project",
    note: null,
    created_at: o.created_at,
    projects: o.project_name ? {
      name: o.project_name
    } : null,
    can_manage: false
  }));
});
const updateRequestStatus_createServerFn_handler = createServerRpc({
  id: "e5c0d6ea7dc3bc9867e1856a96d83ab10b1626673d3cabae446f712b148916ab",
  name: "updateRequestStatus",
  filename: "src/lib/admin.functions.ts"
}, (opts) => updateRequestStatus.__executeServer(opts));
const updateRequestStatus = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  id: stringType().uuid(),
  status: enumType(["pending", "new", "reviewing", "accepted", "rejected"]),
  note: stringType().trim().max(2e3).optional()
}).parse(d)).handler(updateRequestStatus_createServerFn_handler, async ({
  data,
  context
}) => {
  const isAdmin = context.roles.includes("admin");
  let req = await getRequestById(data.id);
  let isOfferNotif = false;
  if (!req) {
    const notif = await getOfferNotificationById(data.id);
    if (notif) {
      isOfferNotif = true;
      req = {
        id: notif.id,
        project_id: notif.project_id,
        company_name: notif.company_name,
        facility_location: notif.facility_location,
        email: notif.email,
        pdf_url: notif.pdf_key,
        status: notif.offer_status ?? "new",
        submitter_type: notif.submitter_type,
        project_type: notif.source,
        note: null,
        created_at: notif.created_at
      };
    }
  }
  if (!req) throw new Error("الطلب غير موجود");
  if (!isAdmin) {
    const proj = req.project_id ? await getById(req.project_id) : null;
    if (!proj || proj.created_by !== context.userId) throw new Error("غير مصرح بتغيير حالة هذا الطلب");
  }
  const note = (data.note ?? "").trim();
  if (!isAdmin && !note) throw new Error("الملاحظة إجبارية للموظف عند تغيير الحالة");
  if (isOfferNotif) {
    if (data.status === "accepted") {
      const notif = await getOfferNotificationById(data.id);
      if (notif) {
        const requestId = await insertRequest({
          project_id: notif.project_id ?? "",
          company_name: notif.company_name ?? "",
          facility_location: notif.facility_location ?? notif.project_name ?? "",
          email: notif.email ?? "",
          pdf_url: notif.pdf_key ?? "",
          submitter_type: notif.submitter_type ?? "offer",
          project_type: notif.source ?? "platform"
        });
        await updateRequestStatus$1(requestId, "new");
        await deleteOfferNotification(notif.id);
      }
    } else {
      await updateOfferNotificationStatus(data.id, data.status);
    }
  } else {
    await updateRequestStatus$1(data.id, data.status, note ? note : void 0);
  }
  if (req.email) {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const proj = req.project_id ? await getById(req.project_id).catch(() => null) : null;
      const projectName = proj?.name || req.company_name || "طلبك";
      const statusLabels = {
        pending: "قيد الانتظار",
        new: "جديد",
        reviewing: "قيد المراجعة",
        accepted: "مقبول",
        rejected: "مرفوض"
      };
      const statusColors = {
        pending: "#6b7280",
        new: "#2563eb",
        reviewing: "#d97706",
        accepted: "#16a34a",
        rejected: "#dc2626"
      };
      const label = statusLabels[data.status] ?? data.status;
      const color = statusColors[data.status] ?? "#111";
      const html = `<div dir="rtl" style="font-family:Arial,sans-serif;padding:24px;background:#f9fafb"><div style="max-width:560px;margin:auto;background:#fff;border-radius:8px;padding:24px;border:1px solid #e5e7eb"><h2 style="margin:0 0 12px">تحديث حالة طلبك</h2><p>مرحباً،</p><p>نودّ إعلامك بأن حالة طلبك المتعلق بمشروع <strong>"${projectName}"</strong> قد تم تحديثها إلى:</p><p style="font-size:18px;font-weight:bold;color:${color};padding:12px;background:#f3f4f6;border-radius:6px;text-align:center">${label}</p><p>شكراً لاستخدامك <strong>منصة العمران</strong>.</p></div></div>`;
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            from: "Alamran <send@ali-alhaddad.com>",
            to: [req.email],
            subject: "تحديث حالة طلبك في منصة العمران",
            html
          })
        });
      } catch (e) {
        console.error("Resend send exception", e);
      }
    }
  }
  return {
    ok: true
  };
});
const sendTestEmail_createServerFn_handler = createServerRpc({
  id: "cf361682af2d298d02de7c0ec6763b8ac233c3c2cada447d7edee0ac2ab23e41",
  name: "sendTestEmail",
  filename: "src/lib/admin.functions.ts"
}, (opts) => sendTestEmail.__executeServer(opts));
const sendTestEmail = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  to: stringType().email()
}).parse(d)).handler(sendTestEmail_createServerFn_handler, async ({
  data
}) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY غير مضبوط في المتغيرات");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      from: "Alamran <send@ali-alhaddad.com>",
      to: [data.to],
      subject: "بريد تجريبي من لوحة الإدارة",
      html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:20px"><h2>مرحباً 👋</h2><p>هذا بريد تجريبي للتأكد من عمل إرسال البريد عبر Resend من نطاق <strong>ali-alhaddad.com</strong>.</p><p>الوقت: ${(/* @__PURE__ */ new Date()).toLocaleString("ar")}</p></div>`
    })
  });
  const bodyText = await res.text();
  if (!res.ok) throw new Error(`فشل الإرسال (${res.status}): ${bodyText.slice(0, 300)}`);
  let id;
  try {
    id = JSON.parse(bodyText)?.id;
  } catch {
  }
  return {
    ok: true,
    id,
    to: data.to
  };
});
const projectSchema = objectType({
  id: stringType().uuid().optional(),
  name: stringType().trim().min(1).max(200),
  description: stringType().trim().min(1).max(5e3),
  location: stringType().trim().min(1).max(300),
  duration: stringType().trim().min(1).max(100),
  cover_image: stringType().trim().min(1).max(500),
  images: arrayType(stringType().max(500)).max(20).default([]),
  pdf_file: stringType().trim().max(500).nullable().optional()
});
const upsertProject_createServerFn_handler = createServerRpc({
  id: "387e6b502d42689d22fd064d3335afa86e3c44f2fe491ded2d3150cb36a91126",
  name: "upsertProject",
  filename: "src/lib/admin.functions.ts"
}, (opts) => upsertProject.__executeServer(opts));
const upsertProject = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => projectSchema.parse(d)).handler(upsertProject_createServerFn_handler, async ({
  data,
  context
}) => {
  const isAdmin = context.roles.includes("admin");
  if (!isAdmin) {
    const dup = await findByOwnerAndName(context.userId, data.name, data.id);
    if (dup) throw new Error("لديك مشروع بنفس الاسم بالفعل");
  }
  if (data.id) {
    const existing = await getById(data.id);
    if (!existing) throw new Error("المشروع غير موجود");
    if (!isAdmin && existing.created_by !== context.userId) throw new Error("غير مصرح بالتعديل");
    await updateProject(data.id, {
      name: data.name,
      description: data.description,
      location: data.location,
      duration: data.duration,
      cover_image: data.cover_image,
      images: data.images,
      pdf_file: data.pdf_file ?? null
    });
    await invalidateProjectsAll();
    await invalidateQuotes(existing.created_by);
    return {
      id: data.id
    };
  }
  const id = await insertProject({
    name: data.name,
    description: data.description,
    location: data.location,
    duration: data.duration,
    cover_image: data.cover_image,
    images: data.images,
    pdf_file: data.pdf_file ?? null,
    created_by: context.userId,
    admin_approval: "approved"
  });
  const city = detectCity(data.location);
  const hasVip = city ? (await listActiveByCity(city)).length > 0 : false;
  if (hasVip) {
    const now = /* @__PURE__ */ new Date();
    const vipEndAt = new Date(now.getTime() + 6 * 36e5);
    await setProjectExclusive(id, now.toISOString(), vipEndAt.toISOString());
  }
  notifyVipSubscribersOfNewProject({
    id,
    name: data.name,
    description: data.description,
    location: data.location,
    duration: data.duration
  }).catch((e) => console.error("[vip-notify]", e));
  await invalidateProjectsAll();
  await invalidateQuotes(context.userId);
  return {
    id,
    admin_approval: "approved"
  };
});
const deleteProject_createServerFn_handler = createServerRpc({
  id: "873fe191eaddd17502d9e0ee23b50e63603c08b6463e76d6d368c74a4299f923",
  name: "deleteProject",
  filename: "src/lib/admin.functions.ts"
}, (opts) => deleteProject.__executeServer(opts));
const deleteProject = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(deleteProject_createServerFn_handler, async ({
  data,
  context
}) => {
  const isAdmin = context.roles.includes("admin");
  const existing = await getById(data.id);
  if (!existing) throw new Error("المشروع غير موجود");
  if (!isAdmin && existing.created_by !== context.userId) throw new Error("غير مصرح بالحذف");
  await deleteProject$1(data.id);
  await invalidateProjectsAll();
  await invalidateQuotes(existing.created_by);
  return {
    ok: true
  };
});
const updateProjectStatus_createServerFn_handler = createServerRpc({
  id: "54c65bf3dd015c1926564ab68fd48f22d297a13c1f853f3f20f031b78727cb37",
  name: "updateProjectStatus",
  filename: "src/lib/admin.functions.ts"
}, (opts) => updateProjectStatus.__executeServer(opts));
const updateProjectStatus = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  id: stringType().uuid(),
  status: enumType(["active", "delivered", "cancelled"])
}).parse(d)).handler(updateProjectStatus_createServerFn_handler, async ({
  data
}) => {
  const existing = await getById(data.id);
  await updateProject(data.id, {
    status: data.status
  });
  await invalidateProjectsAll();
  await invalidateQuotes(existing?.created_by);
  return {
    ok: true
  };
});
const listEmployees_createServerFn_handler = createServerRpc({
  id: "8c565f38645e9e9c5973bb0f53137c61eab38648c1e478f7dc867988f9e5df35",
  name: "listEmployees",
  filename: "src/lib/admin.functions.ts"
}, (opts) => listEmployees.__executeServer(opts));
const listEmployees = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(listEmployees_createServerFn_handler, async () => {
  const users = await listUsersWithRoles(500);
  return users.flatMap((u) => (u.roles.length ? u.roles : ["user"]).map((role) => ({
    user_id: u.id,
    email: u.email,
    role,
    created_at: u.created_at
  })));
});
const listRoles_createServerFn_handler = createServerRpc({
  id: "fdc69a2b243b4323d4797604135af2fbf7cfea053d2450646bdfcda3fc281304",
  name: "listRoles",
  filename: "src/lib/admin.functions.ts"
}, (opts) => listRoles.__executeServer(opts));
const listRoles = createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(listRoles_createServerFn_handler, async () => {
  const {
    db: db2,
    rowsToObjects: rowsToObjects2
  } = await import("./db-BSVZwhof.mjs").then((n) => n.e);
  const r = await db2.execute(`SELECT id,name,label FROM roles ORDER BY name`);
  return rowsToObjects2(r).map((x) => ({
    id: String(x.id),
    name: String(x.name),
    label: String(x.label)
  }));
});
const createEmployee_createServerFn_handler = createServerRpc({
  id: "e530ff6faca702227cb960216134cfc2c9112cec642e05e30b7387124440b1ac",
  name: "createEmployee",
  filename: "src/lib/admin.functions.ts"
}, (opts) => createEmployee.__executeServer(opts));
const createEmployee = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  email: stringType().email().max(255),
  password: stringType().min(6).max(72),
  role_id: stringType().min(1).max(80)
}).parse(d)).handler(createEmployee_createServerFn_handler, async ({
  data
}) => {
  const roleName = await getRoleNameById(data.role_id);
  if (!roleName) throw new Error("الدور غير موجود");
  if (roleName !== "admin" && roleName !== "employee" && roleName !== "user") throw new Error("نوع الدور غير مدعوم");
  const email = data.email.trim().toLowerCase();
  if (await findUserByEmail(email)) throw new Error("هذا البريد مسجل بالفعل");
  const id = await createUser(email, await hashPassword(data.password));
  await grantRole(id, roleName);
  return {
    id
  };
});
const deleteEmployee_createServerFn_handler = createServerRpc({
  id: "e17dc487a0036ee336605030048045203e2a326c9b140489d9df450b34555ca9",
  name: "deleteEmployee",
  filename: "src/lib/admin.functions.ts"
}, (opts) => deleteEmployee.__executeServer(opts));
const deleteEmployee = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  user_id: stringType().uuid()
}).parse(d)).handler(deleteEmployee_createServerFn_handler, async ({
  data,
  context
}) => {
  if (data.user_id === context.userId) throw new Error("لا يمكنك حذف نفسك");
  await deleteUser(data.user_id);
  return {
    ok: true
  };
});
const getMyRoles_createServerFn_handler = createServerRpc({
  id: "bc043367e3258bc0750efadc2962d5983ded7a90f892e25e8da034f07aee469d",
  name: "getMyRoles",
  filename: "src/lib/admin.functions.ts"
}, (opts) => getMyRoles.__executeServer(opts));
const getMyRoles = createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(getMyRoles_createServerFn_handler, async ({
  context
}) => {
  const roles = await getRolesForUser(context.userId);
  return roles.sort((a, b) => a === "admin" ? -1 : b === "admin" ? 1 : a.localeCompare(b));
});
const getMyUserId_createServerFn_handler = createServerRpc({
  id: "e713b8df1ef850d860e649e0be3826f2ae16f9211b6d494a158d6e6f22a645a1",
  name: "getMyUserId",
  filename: "src/lib/admin.functions.ts"
}, (opts) => getMyUserId.__executeServer(opts));
const getMyUserId = createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(getMyUserId_createServerFn_handler, async ({
  context
}) => ({
  userId: context.userId
}));
const adminListMessages_createServerFn_handler = createServerRpc({
  id: "a93dcca664db7845b2d7a9b6c8f0b0f7cb52a62972f962422ce68f8dd2e3fd1e",
  name: "adminListMessages",
  filename: "src/lib/admin.functions.ts"
}, (opts) => adminListMessages.__executeServer(opts));
const adminListMessages = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(adminListMessages_createServerFn_handler, async () => listContactMessages());
const countContactMessages_createServerFn_handler = createServerRpc({
  id: "cb8cf01b590bf98771097cf69a35af15af6ad3c0b339c353031913abb86d88c0",
  name: "countContactMessages",
  filename: "src/lib/admin.functions.ts"
}, (opts) => countContactMessages.__executeServer(opts));
const countContactMessages = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  since: stringType().nullable()
}).parse(d)).handler(countContactMessages_createServerFn_handler, async ({
  data
}) => ({
  count: await countContactMessagesSince(data.since)
}));
const adminDeleteContactMessage_createServerFn_handler = createServerRpc({
  id: "7f22a1795cf16f98b92e03c263c95f6dd64ca6dc1132ebeefbcc5b9f73d9b82b",
  name: "adminDeleteContactMessage",
  filename: "src/lib/admin.functions.ts"
}, (opts) => adminDeleteContactMessage.__executeServer(opts));
const adminDeleteContactMessage = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(adminDeleteContactMessage_createServerFn_handler, async ({
  data
}) => {
  await deleteContactMessage(data.id);
  return {
    ok: true
  };
});
const adminSendCustomEmail_createServerFn_handler = createServerRpc({
  id: "02f48f0c640ff1b2fcf707b7db584473b8cd4a9e445a3f6c8dc0d2aa7b195b8c",
  name: "adminSendCustomEmail",
  filename: "src/lib/admin.functions.ts"
}, (opts) => adminSendCustomEmail.__executeServer(opts));
const adminSendCustomEmail = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  to: stringType().trim().email().max(255),
  subject: stringType().trim().min(1).max(300),
  message: stringType().trim().min(1).max(1e4)
}).parse(d)).handler(adminSendCustomEmail_createServerFn_handler, async ({
  data
}) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY غير مضبوط في المتغيرات");
  const safe = data.message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
  const html = `<div dir="rtl" style="font-family:Arial,sans-serif;padding:24px;background:#f9fafb"><div style="max-width:560px;margin:auto;background:#fff;border-radius:8px;padding:24px;border:1px solid #e5e7eb"><h2 style="margin:0 0 12px;color:#1e293b">${data.subject.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h2><p style="color:#1e293b;line-height:1.9">${safe}</p><hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/><p style="color:#94a3b8;font-size:12px">رسالة من فريق منصة العمران.</p></div></div>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      from: "Alamran <send@ali-alhaddad.com>",
      to: [data.to],
      subject: data.subject,
      html
    })
  });
  const bodyText = await res.text();
  if (!res.ok) throw new Error(`فشل الإرسال (${res.status}): ${bodyText.slice(0, 300)}`);
  return {
    ok: true
  };
});
const adminReplyContactMessage_createServerFn_handler = createServerRpc({
  id: "611c241d7fb4bb14926a88872df26c49a49ceddd2c20ae072560cbb5b4f7f30b",
  name: "adminReplyContactMessage",
  filename: "src/lib/admin.functions.ts"
}, (opts) => adminReplyContactMessage.__executeServer(opts));
const adminReplyContactMessage = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  id: stringType().uuid(),
  reply: stringType().trim().min(1).max(5e3)
}).parse(d)).handler(adminReplyContactMessage_createServerFn_handler, async ({
  data
}) => {
  const msg = await getContactMessageById(data.id);
  if (!msg) throw new Error("الرسالة غير موجودة");
  if (!msg.email) throw new Error("لا يوجد بريد إلكتروني للرد عليه");
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY غير مضبوط في المتغيرات");
  const safeReply = data.reply.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
  const html = `<div dir="rtl" style="font-family:Arial,sans-serif;padding:24px;background:#f9fafb"><div style="max-width:560px;margin:auto;background:#fff;border-radius:8px;padding:24px;border:1px solid #e5e7eb"><h2 style="margin:0 0 12px;color:#1e293b">رد من فريق منصة العمران</h2><p style="color:#475569">مرحباً ${msg.name || ""}،</p><p style="color:#1e293b;line-height:1.9">${safeReply}</p><hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/><p style="color:#94a3b8;font-size:12px">هذا رد على رسالتك في صفحة "تواصل بنا" بمنصة العمران.</p></div></div>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      from: "Alamran <send@ali-alhaddad.com>",
      to: [msg.email],
      subject: "رد على رسالتك في منصة العمران",
      html
    })
  });
  const bodyText = await res.text();
  if (!res.ok) throw new Error(`فشل الإرسال (${res.status}): ${bodyText.slice(0, 300)}`);
  await setContactReply(data.id, data.reply.trim());
  return {
    ok: true
  };
});
const FIRST_ADMIN_EMAIL = "aliwadifaraj@gmail.com";
const signupFirstAdmin_createServerFn_handler = createServerRpc({
  id: "d9b106c849be0fd2f7ab18c8e15ec604b7dc5de4962751279938eef968292b51",
  name: "signupFirstAdmin",
  filename: "src/lib/admin.functions.ts"
}, (opts) => signupFirstAdmin.__executeServer(opts));
const signupFirstAdmin = createServerFn({
  method: "POST"
}).inputValidator((d) => objectType({
  email: stringType().email().max(255),
  password: stringType().min(6).max(72)
}).parse(d)).handler(signupFirstAdmin_createServerFn_handler, async ({
  data
}) => {
  const email = data.email.trim().toLowerCase();
  if (email !== FIRST_ADMIN_EMAIL) throw new Error("التسجيل مسموح فقط للحساب المخصص");
  if (await findUserByEmail(email)) throw new Error("هذا البريد مسجل بالفعل");
  const id = await createUser(email, await hashPassword(data.password));
  await grantRole(id, "admin");
  return {
    ok: true
  };
});
const submitBidRequest_createServerFn_handler = createServerRpc({
  id: "49c390e7bc2471cb180475c3dfd0a2969eafc9d669d1f703838230d7f6d6e6d9",
  name: "submitBidRequest",
  filename: "src/lib/admin.functions.ts"
}, (opts) => submitBidRequest.__executeServer(opts));
const submitBidRequest = createServerFn({
  method: "POST"
}).inputValidator((d) => objectType({
  project_id: stringType().uuid().optional().nullable(),
  company_name: stringType().trim().min(1).max(200),
  facility_location: stringType().trim().min(1).max(300),
  email: stringType().trim().email().max(255),
  file_name: stringType().trim().min(1).max(200),
  file_base64: stringType().min(8).max(15e6),
  vip_token: stringType().optional().nullable(),
  project_name: stringType().trim().max(200).optional()
}).parse(d)).handler(submitBidRequest_createServerFn_handler, async ({
  data
}) => {
  const bytes = Buffer.from(data.file_base64, "base64");
  if (bytes.length === 0) throw new Error("الملف فارغ");
  if (bytes.length > 10 * 1024 * 1024) throw new Error("حجم الملف يجب أن يكون أقل من 10 ميغابايت");
  if (bytes[0] !== 37 || bytes[1] !== 80 || bytes[2] !== 68 || bytes[3] !== 70 || bytes[4] !== 45) throw new Error("الملف ليس PDF صالحاً");
  const isAddProject = data.vip_token === "add_project";
  let submitterType = "guest";
  try {
    const {
      getSessionClaims
    } = await import("./db-BSVZwhof.mjs").then((n) => n.b);
    const claims = await getSessionClaims();
    if (claims) submitterType = "user";
  } catch {
  }
  if (!isAddProject) {
    if (!data.project_id) throw new Error("معرف المشروع مطلوب");
    const proj = await getById(data.project_id);
    if (!proj) throw new Error("المشروع غير موجود");
    if (!proj.offers_enabled) throw new Error("تقديم عروض الأسعار متوقف حالياً لهذا المشروع");
    const exclusive = await getProjectExclusive(data.project_id);
    if (exclusive && Date.now() < new Date(exclusive.vip_end_at).getTime()) {
      if (!data.vip_token) throw new Error(`هذا المشروع حصري لـ VIP ${proj.location}`);
      const {
        validateVipToken,
        consumeVipToken
      } = await import("./vip-notify.server-PhbhwAkL.mjs").then((n) => n.v);
      const tokenResult = await validateVipToken(data.vip_token, data.project_id);
      if (!tokenResult.valid) throw new Error("رمز الحصرية غير صالح أو منتهي");
      await consumeVipToken(data.vip_token);
    }
  }
  if (await isBlocked(data.company_name, data.email)) throw new Error(BLOCKED_MESSAGE);
  const safeName = data.file_name.replace(/[^\w.\-]/g, "_").slice(-100);
  const projectIdForPath = data.project_id ?? "add-project";
  const path = `${projectIdForPath}/${Date.now()}-${safeName}${safeName.toLowerCase().endsWith(".pdf") ? "" : ".pdf"}`;
  const {
    uploadToR2
  } = await import("./r2-CJ2zxhhj.mjs");
  await uploadToR2({
    key: path,
    body: bytes,
    contentType: "application/pdf"
  });
  const staff = await (async () => {
    const {
      db: db2,
      rowsToObjects: rowsToObjects2
    } = await import("./db-BSVZwhof.mjs").then((n) => n.e);
    const r = await db2.execute(`SELECT DISTINCT user_id FROM user_roles WHERE role IN ('admin','employee')`);
    return rowsToObjects2(r).map((x) => String(x.user_id));
  })();
  if (isAddProject) {
    await insertOfferNotificationMany(staff.map((uid) => ({
      user_id: uid,
      title: "طلب إضافة مشروع جديد",
      body: `${data.company_name} — ${data.facility_location}`,
      link: "/admin/requests",
      project_id: data.project_id ?? null,
      project_name: data.project_name || data.company_name,
      company_name: data.company_name,
      email: data.email,
      facility_location: data.facility_location,
      pdf_key: path,
      pdf_filename: data.file_name,
      source: "form",
      submitter_type: submitterType,
      offer_status: "pending"
    })));
  } else {
    const proj = data.project_id ? await getById(data.project_id) : null;
    await insertOfferNotificationMany(staff.map((uid) => ({
      user_id: uid,
      title: "عرض سعر جديد",
      body: `${data.company_name} — ${proj?.name ?? data.project_name ?? data.company_name}`,
      link: "/admin/requests",
      project_id: data.project_id,
      project_name: proj?.name ?? data.project_name ?? data.company_name,
      company_name: data.company_name,
      email: data.email,
      pdf_key: path,
      pdf_filename: data.file_name,
      source: "form",
      submitter_type: submitterType,
      offer_status: "pending"
    })));
  }
  return {
    ok: true
  };
});
const submitAddProjectBidRequest_createServerFn_handler = createServerRpc({
  id: "fd5bc09fc8660adfdcd4616b6410796c52b1503d5e4ba402984129c34172ea41",
  name: "submitAddProjectBidRequest",
  filename: "src/lib/admin.functions.ts"
}, (opts) => submitAddProjectBidRequest.__executeServer(opts));
const submitAddProjectBidRequest = createServerFn({
  method: "POST"
}).inputValidator((d) => objectType({
  company_name: stringType().trim().min(1).max(200),
  facility_location: stringType().trim().min(1).max(300),
  email: stringType().trim().email().max(255),
  submitter_type: enumType(["client", "visitor"]),
  file_name: stringType().trim().min(1).max(200),
  file_base64: stringType().min(8).max(15e6)
}).parse(d)).handler(submitAddProjectBidRequest_createServerFn_handler, async ({
  data
}) => {
  const bytes = Buffer.from(data.file_base64, "base64");
  if (bytes.length === 0) throw new Error("الملف فارغ");
  if (bytes.length > 10 * 1024 * 1024) throw new Error("حجم الملف يجب أن يكون أقل من 10 ميغابايت");
  if (bytes[0] !== 37 || bytes[1] !== 80 || bytes[2] !== 68 || bytes[3] !== 70 || bytes[4] !== 45) throw new Error("الملف ليس PDF صالحاً");
  if (await isBlocked(data.company_name, data.email)) throw new Error(BLOCKED_MESSAGE);
  const safeName = data.file_name.replace(/[^\w.\-]/g, "_").slice(-100);
  const path = `add-project/${Date.now()}-${safeName}${safeName.toLowerCase().endsWith(".pdf") ? "" : ".pdf"}`;
  const {
    uploadToR2
  } = await import("./r2-CJ2zxhhj.mjs");
  await uploadToR2({
    key: path,
    body: bytes,
    contentType: "application/pdf"
  });
  const staff = await (async () => {
    const {
      db: db2,
      rowsToObjects: rowsToObjects2
    } = await import("./db-BSVZwhof.mjs").then((n) => n.e);
    const r = await db2.execute(`SELECT DISTINCT user_id FROM user_roles WHERE role IN ('admin','employee')`);
    return rowsToObjects2(r).map((x) => String(x.user_id));
  })();
  await insertOfferNotificationMany(staff.map((uid) => ({
    user_id: uid,
    title: "طلب إضافة مشروع جديد",
    body: `${data.company_name} — ${data.facility_location}`,
    link: "/admin/requests",
    project_name: data.company_name,
    company_name: data.company_name,
    email: data.email,
    facility_location: data.facility_location,
    pdf_key: path,
    pdf_filename: data.file_name,
    source: "form",
    submitter_type: data.submitter_type,
    offer_status: "pending"
  })));
  return {
    ok: true
  };
});
const imageItemSchema = objectType({
  file_name: stringType().trim().min(1).max(200),
  file_base64: stringType().min(8).max(8e6),
  content_type: stringType().regex(/^image\/(png|jpe?g|webp|gif)$/)
});
const submitProjectSuggestion_createServerFn_handler = createServerRpc({
  id: "ab973bdd239dcdf060993b79d04685ed1e203bad5ea576703bca855610fbe619",
  name: "submitProjectSuggestion",
  filename: "src/lib/admin.functions.ts"
}, (opts) => submitProjectSuggestion.__executeServer(opts));
const submitProjectSuggestion = createServerFn({
  method: "POST"
}).inputValidator((d) => objectType({
  name: stringType().trim().min(1).max(200),
  description: stringType().trim().min(1).max(5e3),
  location: stringType().trim().min(1).max(300),
  contact_phone: stringType().trim().min(4).max(40).regex(/^[0-9+\-\s()]+$/),
  images: arrayType(imageItemSchema).max(8).default([])
}).parse(d)).handler(submitProjectSuggestion_createServerFn_handler, async ({
  data
}) => {
  if (await isBlocked(data.name, null)) throw new Error(BLOCKED_MESSAGE);
  const uploadedPaths = [];
  for (const img of data.images) {
    const bytes = Buffer.from(img.file_base64, "base64");
    if (bytes.length === 0) continue;
    if (bytes.length > 5 * 1024 * 1024) throw new Error("حجم الصورة يجب أن يكون أقل من 5 ميغابايت");
    const safeName = img.file_name.replace(/[^\w.\-]/g, "_").slice(-100);
    const path = `submissions/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
    const {
      uploadToR2
    } = await import("./r2-CJ2zxhhj.mjs");
    await uploadToR2({
      key: path,
      body: bytes,
      contentType: img.content_type
    });
    uploadedPaths.push(path);
  }
  await insertSubmission({
    name: data.name,
    description: data.description,
    location: data.location,
    contact_phone: data.contact_phone,
    images: uploadedPaths
  });
  return {
    ok: true
  };
});
const adminListSubmissions_createServerFn_handler = createServerRpc({
  id: "f7cb4f36ca6b1736293532e9375e5e0f66e9982dea905b88e87abdea4fe1dba0",
  name: "adminListSubmissions",
  filename: "src/lib/admin.functions.ts"
}, (opts) => adminListSubmissions.__executeServer(opts));
const adminListSubmissions = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(adminListSubmissions_createServerFn_handler, async () => {
  const rows = await listAllSubmissions();
  return Promise.all(rows.map(async (s) => ({
    ...s,
    image_urls: await Promise.all((s.images ?? []).map(resolveStoragePath))
  })));
});
const approveSubmission_createServerFn_handler = createServerRpc({
  id: "e4885eaeb8ac9297e550ed13942ebcf044f892f4b68e4716a5c74f13b57b131e",
  name: "approveSubmission",
  filename: "src/lib/admin.functions.ts"
}, (opts) => approveSubmission.__executeServer(opts));
const approveSubmission = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(approveSubmission_createServerFn_handler, async ({
  data
}) => {
  const sub = await getSubmissionById(data.id);
  if (!sub) throw new Error("الطلب غير موجود");
  if (sub.status === "approved" && sub.approved_project_id) return {
    id: sub.approved_project_id
  };
  const images = sub.images ?? [];
  const cover = images[0] ?? "placeholder.jpg";
  const newId = await insertProject({
    name: sub.name,
    description: sub.description,
    location: sub.location,
    duration: "غير محدد",
    cover_image: cover,
    images,
    admin_approval: "approved"
  });
  const city = detectCity(sub.location);
  const hasVip = city ? (await listActiveByCity(city)).length > 0 : false;
  if (hasVip) {
    const now = /* @__PURE__ */ new Date();
    const vipEndAt = new Date(now.getTime() + 6 * 36e5);
    await setProjectExclusive(newId, now.toISOString(), vipEndAt.toISOString());
  }
  notifyVipSubscribersOfNewProject({
    id: newId,
    name: sub.name,
    description: sub.description,
    location: sub.location
  }).catch((e) => console.error("[vip-notify]", e));
  await markSubmissionApproved(data.id, newId);
  return {
    id: newId
  };
});
const deleteSubmission_createServerFn_handler = createServerRpc({
  id: "7ad1a8c9b4759d7b2a2362dbde9568531fd386e179b272a7e4daca399eafbc69",
  name: "deleteSubmission",
  filename: "src/lib/admin.functions.ts"
}, (opts) => deleteSubmission.__executeServer(opts));
const deleteSubmission = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(deleteSubmission_createServerFn_handler, async ({
  data
}) => {
  await deleteSubmission$1(data.id);
  return {
    ok: true
  };
});
const submitProjectWithPaths_createServerFn_handler = createServerRpc({
  id: "ec33fce6512ac111f8be4cb4b7013872e5de7e589be41b2cae5a1d61eb469d8f",
  name: "submitProjectWithPaths",
  filename: "src/lib/admin.functions.ts"
}, (opts) => submitProjectWithPaths.__executeServer(opts));
const submitProjectWithPaths = createServerFn({
  method: "POST"
}).inputValidator((d) => objectType({
  name: stringType().trim().min(1).max(200),
  description: stringType().trim().min(1).max(5e3),
  location: stringType().trim().min(1).max(300),
  contact_phone: stringType().trim().min(4).max(40).regex(/^[0-9+\-\s()]+$/),
  image_paths: arrayType(stringType().trim().min(1).max(500)).max(8).default([])
}).parse(d)).handler(submitProjectWithPaths_createServerFn_handler, async ({
  data
}) => {
  if (await isBlocked(data.name, null)) throw new Error(BLOCKED_MESSAGE);
  const safePaths = data.image_paths.filter((p) => p.startsWith("submissions/"));
  await insertSubmission({
    name: data.name,
    description: data.description,
    location: data.location,
    contact_phone: data.contact_phone,
    images: safePaths
  });
  return {
    ok: true
  };
});
const sendRequestMessage_createServerFn_handler = createServerRpc({
  id: "aff117b1e0b4be6dbba2be2060e23662a6cdac14409b025a8c42404d5161cd84",
  name: "sendRequestMessage",
  filename: "src/lib/admin.functions.ts"
}, (opts) => sendRequestMessage.__executeServer(opts));
const sendRequestMessage = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  to: stringType().trim().email().max(255),
  message: stringType().trim().min(1).max(3e3)
}).parse(d)).handler(sendRequestMessage_createServerFn_handler, async ({
  data
}) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY غير مضبوط في المتغيرات");
  const safe = data.message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      from: "Alamran <noreply@ali-alhaddad.com>",
      to: [data.to],
      subject: "رسالة من فريق العمران",
      html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:20px;line-height:1.9">${safe}</div>`
    })
  });
  const bodyText = await res.text();
  if (!res.ok) throw new Error(`فشل الإرسال (${res.status}): ${bodyText.slice(0, 300)}`);
  return {
    ok: true
  };
});
function assertStaffRoles(roles) {
  if (!roles.includes("admin") && !roles.includes("employee")) throw new Error("Forbidden");
}
const adminListProjectOfferToggles_createServerFn_handler = createServerRpc({
  id: "aceaa671ae0c02774591c3ab3a250fc497ecd82113315e64a670b81ffea6766e",
  name: "adminListProjectOfferToggles",
  filename: "src/lib/admin.functions.ts"
}, (opts) => adminListProjectOfferToggles.__executeServer(opts));
const adminListProjectOfferToggles = createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(adminListProjectOfferToggles_createServerFn_handler, async ({
  context
}) => {
  assertStaffRoles(context.roles);
  const rows = await listAllProjects();
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    offers_enabled: p.offers_enabled,
    bot_offers_enabled: p.bot_offers_enabled
  }));
});
const adminSetProjectBotOffersEnabled_createServerFn_handler = createServerRpc({
  id: "60f5263309fdc132607d93bca522cc36ccdd154de4adb18313665bdbaf8b9cb4",
  name: "adminSetProjectBotOffersEnabled",
  filename: "src/lib/admin.functions.ts"
}, (opts) => adminSetProjectBotOffersEnabled.__executeServer(opts));
const adminSetProjectBotOffersEnabled = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  id: stringType().uuid(),
  enabled: booleanType()
}).parse(d)).handler(adminSetProjectBotOffersEnabled_createServerFn_handler, async ({
  data,
  context
}) => {
  assertStaffRoles(context.roles);
  await setBotOffersEnabled(data.id, data.enabled);
  await invalidateProjectsAll();
  return {
    ok: true
  };
});
const adminSetAllProjectBotOffersEnabled_createServerFn_handler = createServerRpc({
  id: "2db74c92baeb5d843e274872db3d4ed5b5eb082b316f00ac263401003b5f2678",
  name: "adminSetAllProjectBotOffersEnabled",
  filename: "src/lib/admin.functions.ts"
}, (opts) => adminSetAllProjectBotOffersEnabled.__executeServer(opts));
const adminSetAllProjectBotOffersEnabled = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  enabled: booleanType()
}).parse(d)).handler(adminSetAllProjectBotOffersEnabled_createServerFn_handler, async ({
  data,
  context
}) => {
  assertStaffRoles(context.roles);
  await setAllBotOffersEnabled(data.enabled);
  await invalidateProjectsAll();
  return {
    ok: true
  };
});
const adminSetProjectOffersEnabled_createServerFn_handler = createServerRpc({
  id: "4972077c58c3cae31fbfd59642caffaaff860ed682186b858700635f81bc3edd",
  name: "adminSetProjectOffersEnabled",
  filename: "src/lib/admin.functions.ts"
}, (opts) => adminSetProjectOffersEnabled.__executeServer(opts));
const adminSetProjectOffersEnabled = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  id: stringType().uuid(),
  enabled: booleanType()
}).parse(d)).handler(adminSetProjectOffersEnabled_createServerFn_handler, async ({
  data,
  context
}) => {
  assertStaffRoles(context.roles);
  await setOffersEnabled(data.id, data.enabled);
  await invalidateProjectsAll();
  return {
    ok: true
  };
});
const adminSetAllProjectOffersEnabled_createServerFn_handler = createServerRpc({
  id: "058fb37501b7ad4f017138ee348dafec62f582e641973f94bdaee5e792354d74",
  name: "adminSetAllProjectOffersEnabled",
  filename: "src/lib/admin.functions.ts"
}, (opts) => adminSetAllProjectOffersEnabled.__executeServer(opts));
const adminSetAllProjectOffersEnabled = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  enabled: booleanType()
}).parse(d)).handler(adminSetAllProjectOffersEnabled_createServerFn_handler, async ({
  data,
  context
}) => {
  assertStaffRoles(context.roles);
  await setAllOffersEnabled(data.enabled);
  await invalidateProjectsAll();
  return {
    ok: true
  };
});
const getExclusiveStatus_createServerFn_handler = createServerRpc({
  id: "49867c4d400851977f9eda18b4c471e7906e96a9b56d2e425a6644d4a76e7cf2",
  name: "getExclusiveStatus",
  filename: "src/lib/admin.functions.ts"
}, (opts) => getExclusiveStatus.__executeServer(opts));
const getExclusiveStatus = createServerFn({
  method: "GET"
}).inputValidator((d) => objectType({
  projectId: stringType().min(1),
  vip_token: stringType().optional().nullable()
}).parse(d)).handler(getExclusiveStatus_createServerFn_handler, async ({
  data
}) => {
  const row = await getProjectExclusive(data.projectId);
  if (!row) return {
    showForm: true,
    vipEndAt: null,
    vipStartAt: null
  };
  const now = Date.now();
  const endTime = new Date(row.vip_end_at).getTime();
  const showForm = now >= endTime;
  if (showForm) return {
    showForm,
    vipEndAt: row.vip_end_at,
    vipStartAt: row.vip_start_at
  };
  if (data.vip_token) {
    const {
      validateVipToken
    } = await import("./vip-notify.server-PhbhwAkL.mjs").then((n) => n.v);
    const result = await validateVipToken(data.vip_token, data.projectId);
    if (result.valid) return {
      showForm: true,
      vipEndAt: row.vip_end_at,
      vipStartAt: row.vip_start_at,
      vipBypass: true
    };
  }
  return {
    showForm: false,
    vipEndAt: row.vip_end_at,
    vipStartAt: row.vip_start_at
  };
});
const getExclusivityConfig_createServerFn_handler = createServerRpc({
  id: "77ff4eb7c6301529d5cd1b294e0d6988476df6bb1844f5c358260435deb1bfb1",
  name: "getExclusivityConfig",
  filename: "src/lib/admin.functions.ts"
}, (opts) => getExclusivityConfig.__executeServer(opts));
const getExclusivityConfig = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  projectId: stringType().uuid()
}).parse(d)).handler(getExclusivityConfig_createServerFn_handler, async ({
  data
}) => {
  const row = await getProjectExclusive(data.projectId);
  if (!row) return null;
  return {
    vipStartAt: row.vip_start_at,
    vipEndAt: row.vip_end_at,
    durationHours: row.duration_hours
  };
});
const updateExclusivity_createServerFn_handler = createServerRpc({
  id: "eb481968f5b65fae23a4b92192abbd939d41ee354876a29434172e6f22a9e5a8",
  name: "updateExclusivity",
  filename: "src/lib/admin.functions.ts"
}, (opts) => updateExclusivity.__executeServer(opts));
const updateExclusivity = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  projectId: stringType().uuid(),
  durationHours: numberType().int().min(0).max(720)
}).parse(d)).handler(updateExclusivity_createServerFn_handler, async ({
  data
}) => {
  await updateProjectExclusivity(data.projectId, data.durationHours);
  await invalidateProjectsAll();
  return {
    ok: true
  };
});
const searchProjectByName_createServerFn_handler = createServerRpc({
  id: "1979a1e4f5d59cbaace842255e4b855ae012ccda75fe38f4250f5d0f795f9a80",
  name: "searchProjectByName",
  filename: "src/lib/admin.functions.ts"
}, (opts) => searchProjectByName.__executeServer(opts));
const searchProjectByName = createServerFn({
  method: "GET"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  q: stringType().trim().min(1).max(200)
}).parse(d)).handler(searchProjectByName_createServerFn_handler, async ({
  data
}) => {
  const rows = await searchByName(data.q);
  const results = await Promise.all(rows.map(async (p) => {
    const exclusive = await getProjectExclusive(p.id).catch(() => null);
    const vipEndAt = exclusive?.vip_end_at ?? null;
    const remainingMs = vipEndAt ? new Date(vipEndAt).getTime() - Date.now() : 0;
    const remainingHours = remainingMs > 0 ? Math.ceil(remainingMs / 36e5) : 0;
    const active = p.is_exclusive || (exclusive ? Date.now() < new Date(exclusive.vip_end_at).getTime() : false);
    return {
      id: p.id,
      name: p.name,
      location: p.location,
      exclusive_hours: p.exclusive_hours,
      is_exclusive: p.is_exclusive,
      exclusive_until: p.exclusive_until,
      has_exclusive: !!exclusive,
      vip_end_at: vipEndAt,
      remaining_hours: remainingHours,
      active
    };
  }));
  return results;
});
const updateExclusivityHours_createServerFn_handler = createServerRpc({
  id: "29d8cf46b86526f4ed2e12e14db38fce20f673c434cc32bba64fd9df14d0d158",
  name: "updateExclusivityHours",
  filename: "src/lib/admin.functions.ts"
}, (opts) => updateExclusivityHours.__executeServer(opts));
const updateExclusivityHours = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  projectId: stringType().uuid(),
  hours: numberType().int().min(1).max(720)
}).parse(d)).handler(updateExclusivityHours_createServerFn_handler, async ({
  data
}) => {
  await updateProject(data.projectId, {
    exclusive_hours: data.hours
  });
  await invalidateProjectsAll();
  return {
    ok: true
  };
});
const toggleExclusivityOn_createServerFn_handler = createServerRpc({
  id: "66bf2c9f42071c86851f464f05150cc8b7062a838c064377680faa7baaf41f1e",
  name: "toggleExclusivityOn",
  filename: "src/lib/admin.functions.ts"
}, (opts) => toggleExclusivityOn.__executeServer(opts));
const toggleExclusivityOn = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  projectId: stringType().uuid(),
  hours: numberType().int().min(1).max(720)
}).parse(d)).handler(toggleExclusivityOn_createServerFn_handler, async ({
  data
}) => {
  const now = /* @__PURE__ */ new Date();
  const endAt = new Date(now.getTime() + data.hours * 36e5);
  await setProjectExclusive(data.projectId, now.toISOString(), endAt.toISOString());
  await updateProject(data.projectId, {
    is_exclusive: true,
    exclusive_until: endAt.toISOString(),
    exclusive_hours: data.hours
  });
  await invalidateProjectsAll();
  return {
    ok: true
  };
});
const toggleExclusivityOff_createServerFn_handler = createServerRpc({
  id: "d2db6b6f294d9a394e3406772dd37197a4cd4e971477c25f77a6607fe3f33d1d",
  name: "toggleExclusivityOff",
  filename: "src/lib/admin.functions.ts"
}, (opts) => toggleExclusivityOff.__executeServer(opts));
const toggleExclusivityOff = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  projectId: stringType().uuid()
}).parse(d)).handler(toggleExclusivityOff_createServerFn_handler, async ({
  data
}) => {
  await updateProject(data.projectId, {
    is_exclusive: false,
    exclusive_until: null
  });
  await invalidateProjectsAll();
  return {
    ok: true
  };
});
export {
  adminDeleteContactMessage_createServerFn_handler,
  adminListMessages_createServerFn_handler,
  adminListProjectOfferToggles_createServerFn_handler,
  adminListRequests_createServerFn_handler,
  adminListSubmissions_createServerFn_handler,
  adminReplyContactMessage_createServerFn_handler,
  adminSendCustomEmail_createServerFn_handler,
  adminSetAllProjectBotOffersEnabled_createServerFn_handler,
  adminSetAllProjectOffersEnabled_createServerFn_handler,
  adminSetProjectBotOffersEnabled_createServerFn_handler,
  adminSetProjectOffersEnabled_createServerFn_handler,
  approveSubmission_createServerFn_handler,
  countContactMessages_createServerFn_handler,
  createEmployee_createServerFn_handler,
  deleteEmployee_createServerFn_handler,
  deleteProject_createServerFn_handler,
  deleteSubmission_createServerFn_handler,
  getAddProjectRequests_createServerFn_handler,
  getBidPdfUrl_createServerFn_handler,
  getExclusiveStatus_createServerFn_handler,
  getExclusivityConfig_createServerFn_handler,
  getMyRoles_createServerFn_handler,
  getMyUserId_createServerFn_handler,
  getPlatformRequests_createServerFn_handler,
  getProject_createServerFn_handler,
  listEmployees_createServerFn_handler,
  listProjects_createServerFn_handler,
  listRoles_createServerFn_handler,
  searchProjectByName_createServerFn_handler,
  searchRequests_createServerFn_handler,
  sendRequestMessage_createServerFn_handler,
  sendTestEmail_createServerFn_handler,
  signupFirstAdmin_createServerFn_handler,
  submitAddProjectBidRequest_createServerFn_handler,
  submitBidRequest_createServerFn_handler,
  submitProjectSuggestion_createServerFn_handler,
  submitProjectWithPaths_createServerFn_handler,
  toggleExclusivityOff_createServerFn_handler,
  toggleExclusivityOn_createServerFn_handler,
  updateExclusivityHours_createServerFn_handler,
  updateExclusivity_createServerFn_handler,
  updateProjectStatus_createServerFn_handler,
  updateRequestStatus_createServerFn_handler,
  upsertProject_createServerFn_handler
};
