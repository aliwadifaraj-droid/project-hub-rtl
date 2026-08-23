import { c as createServerRpc } from "./createServerRpc-Dx-ThoJh.mjs";
import { c as createServerFn } from "./server-BNqJEEJz.mjs";
import { r as requireAuth, a as requireAdmin } from "./auth-middleware.server-CWyFWbOs.mjs";
import { d as db, r as rowsToObjects } from "./db-BSVZwhof.mjs";
import { o as findByAdId, i as insertProject, p as setExclusive } from "./projects.repo-GgbtJXPt.mjs";
import { h as findUserById } from "./users.repo-JS4Zo3xr.mjs";
import { r as resolveStoredFileUrl } from "./storage-url-BOHLt4ef.mjs";
import { i as isBlocked } from "./blocked.repo-C-JF9Ik-.mjs";
import { B as BLOCKED_MESSAGE } from "./blocked.functions-B0hy_Vq2.mjs";

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

import "./createSsrRpc-C50NoQin.mjs";
db.execute(`ALTER TABLE ads ADD COLUMN location TEXT`).catch(() => void 0);
db.execute(`ALTER TABLE ads ADD COLUMN pdf_key TEXT`).catch(() => void 0);
function decodeAd(r) {
  return {
    id: String(r.id),
    title: String(r.title ?? ""),
    description: r.description ?? null,
    location: r.location ?? null,
    image_url: r.image_url ?? null,
    link_url: r.link_url ?? null,
    status: String(r.status ?? "pending"),
    rejection_reason: r.rejection_reason ?? null,
    contact_email: r.contact_email ?? null,
    created_by: r.created_by ?? null,
    created_at: String(r.created_at ?? "")
  };
}
const AD_COLS = "id,title,description,location,image_url,link_url,status,rejection_reason,contact_email,created_by,created_at";
async function listAdsByStatus(status) {
  const r = await db.execute(
    `SELECT ${AD_COLS} FROM ads WHERE status = ? ORDER BY created_at DESC LIMIT 200`,
    [status]
  );
  return rowsToObjects(r).map(decodeAd);
}
async function countAdsByStatus(status) {
  const r = await db.execute(`SELECT COUNT(*) AS n FROM ads WHERE status = ?`, [status]);
  return Number(r.rows[0]?.n ?? 0);
}
async function getAdById(id) {
  const r = await db.execute(`SELECT ${AD_COLS} FROM ads WHERE id = ? LIMIT 1`, [id]);
  const rows = rowsToObjects(r);
  return rows[0] ? decodeAd(rows[0]) : null;
}
async function insertAd(input) {
  const id = crypto.randomUUID();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await db.execute(
    `INSERT INTO ads (id,title,description,location,image_url,link_url,status,contact_email,created_by,pdf_key,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id,
      input.title,
      input.description ?? null,
      input.location ?? null,
      input.image_url ?? null,
      input.link_url ?? null,
      input.status ?? "pending",
      input.contact_email ?? null,
      input.created_by ?? null,
      input.pdf_key ?? null,
      now,
      now
    ]
  );
  return id;
}
async function updateAd$1(id, patch) {
  const sets = [];
  const args = [];
  for (const [k, v] of Object.entries(patch)) {
    if (v === void 0) continue;
    sets.push(`${k} = ?`);
    args.push(v);
  }
  if (!sets.length) return;
  sets.push(`updated_at = ?`);
  args.push((/* @__PURE__ */ new Date()).toISOString());
  args.push(id);
  await db.execute(`UPDATE ads SET ${sets.join(", ")} WHERE id = ?`, args);
}
async function deleteAd$1(id) {
  await db.execute(`DELETE FROM ads WHERE id = ?`, [id]);
}
async function listAdComments$1(adId) {
  const r = await db.execute(
    `SELECT id,ad_id,author_name,body,created_at FROM ad_comments WHERE ad_id = ? ORDER BY created_at DESC LIMIT 100`,
    [adId]
  );
  return rowsToObjects(r).map((x) => ({
    id: String(x.id),
    ad_id: String(x.ad_id),
    author_name: x.author_name ?? null,
    body: String(x.body ?? ""),
    created_at: String(x.created_at ?? "")
  }));
}
async function insertAdComment(input) {
  const id = crypto.randomUUID();
  await db.execute(
    `INSERT INTO ad_comments (id,ad_id,author_name,contact,body,created_at) VALUES (?,?,?,?,?,?)`,
    [id, input.ad_id, input.author_name, input.contact ?? null, input.body, (/* @__PURE__ */ new Date()).toISOString()]
  );
  return id;
}
function assertStaff(roles) {
  if (!roles.includes("admin") && !roles.includes("employee")) throw new Error("غير مصرح");
}
async function resolveImage(path) {
  return resolveStoredFileUrl(path, 60 * 60 * 24 * 7).catch(() => "");
}
const adSchema = objectType({
  title: stringType().trim().min(1).max(200),
  description: stringType().trim().max(2e3).optional().default(""),
  location: stringType().trim().max(300).optional().default(""),
  image_url: stringType().trim().max(1e3).optional().default("")
});
const createAd_createServerFn_handler = createServerRpc({
  id: "a063de24e27e7066703bf4640340a5f98e56ac9e25a5324ae1896bd72f3339e9",
  name: "createAd",
  filename: "src/lib/ads.functions.ts"
}, (opts) => createAd.__executeServer(opts));
const createAd = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => adSchema.parse(d)).handler(createAd_createServerFn_handler, async ({
  data,
  context
}) => {
  assertStaff(context.roles);
  const id = await insertAd({
    title: data.title,
    description: data.description || null,
    location: data.location || null,
    image_url: data.image_url || null,
    status: "pending",
    created_by: context.userId
  });
  const link_url = `/ads/${id}`;
  await updateAd$1(id, {
    link_url
  });
  return {
    id,
    link_url
  };
});
const listPendingAds_createServerFn_handler = createServerRpc({
  id: "9df46a5875b60883376ae5ded6ff62d2c029a5e63ceaee7a57d3d4387c07232a",
  name: "listPendingAds",
  filename: "src/lib/ads.functions.ts"
}, (opts) => listPendingAds.__executeServer(opts));
const listPendingAds = createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(listPendingAds_createServerFn_handler, async ({
  context
}) => {
  assertStaff(context.roles);
  const ads = await listAdsByStatus("pending");
  const rows = await Promise.all(ads.map(async (a) => {
    let submitter_label = a.contact_email ?? "زائر";
    if (a.created_by) {
      const u = await findUserById(a.created_by).catch(() => null);
      submitter_label = u?.email ?? "موظف";
    }
    return {
      ...a,
      image_signed_url: await resolveImage(a.image_url),
      submitter_label
    };
  }));
  return {
    rows,
    isAdmin: context.roles.includes("admin")
  };
});
const countPendingAds_createServerFn_handler = createServerRpc({
  id: "3f82ba1060afbc012e7aa4eb899978a01af558ced2c471d584282a43987d701c",
  name: "countPendingAds",
  filename: "src/lib/ads.functions.ts"
}, (opts) => countPendingAds.__executeServer(opts));
const countPendingAds = createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(countPendingAds_createServerFn_handler, async ({
  context
}) => {
  assertStaff(context.roles);
  return countAdsByStatus("pending");
});
const approveAd_createServerFn_handler = createServerRpc({
  id: "ba5e5d3e45d027763b3e6f83463fd24c55b59547ee2957357a0b658ee58c9729",
  name: "approveAd",
  filename: "src/lib/ads.functions.ts"
}, (opts) => approveAd.__executeServer(opts));
const approveAd = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(approveAd_createServerFn_handler, async ({
  data
}) => {
  const ad = await getAdById(data.id);
  if (!ad) throw new Error("الإعلان غير موجود");
  await updateAd$1(data.id, {
    status: "approved",
    rejection_reason: null
  });
  !ad.created_by && !!ad.contact_email;
  const existing = await findByAdId(ad.id);
  if (!existing) {
    await insertProject({
      name: ad.title,
      description: ad.description ?? "",
      location: ad.location ?? "",
      duration: "",
      cover_image: ad.image_url ?? "",
      images: [],
      created_by: ad.created_by,
      ad_id: ad.id,
      admin_approval: "approved",
      is_customer_request: true
    });
    await setExclusive((await findByAdId(ad.id)).id, true, 6);
  } else {
    await setExclusive(existing.id, true, 6);
  }
  return {
    ok: true
  };
});
const rejectAd_createServerFn_handler = createServerRpc({
  id: "f49e090916aa28e89ee0ee0eaa1c2632215cadab9f9b670fe8121a6271c37f47",
  name: "rejectAd",
  filename: "src/lib/ads.functions.ts"
}, (opts) => rejectAd.__executeServer(opts));
const rejectAd = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  id: stringType().uuid(),
  reason: stringType().trim().min(1).max(500)
}).parse(d)).handler(rejectAd_createServerFn_handler, async ({
  data
}) => {
  await updateAd$1(data.id, {
    status: "rejected",
    rejection_reason: data.reason
  });
  return {
    ok: true
  };
});
const updateAd_createServerFn_handler = createServerRpc({
  id: "ba8201b60d030f84ad17817069c7fd101140ec025edaa95101eb79c705206605",
  name: "updateAd",
  filename: "src/lib/ads.functions.ts"
}, (opts) => updateAd.__executeServer(opts));
const updateAd = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  id: stringType().uuid(),
  title: stringType().trim().min(1).max(200),
  description: stringType().trim().max(2e3).optional().default(""),
  location: stringType().trim().max(300).optional().default(""),
  image_url: stringType().trim().max(1e3).optional().default("")
}).parse(d)).handler(updateAd_createServerFn_handler, async ({
  data
}) => {
  await updateAd$1(data.id, {
    title: data.title,
    description: data.description || null,
    location: data.location || null,
    image_url: data.image_url || null
  });
  return {
    ok: true
  };
});
const deleteAd_createServerFn_handler = createServerRpc({
  id: "165f6b5098b795c7472c0550a57f60e43dd18da3ce1c2f9509a61dff5b5b1836",
  name: "deleteAd",
  filename: "src/lib/ads.functions.ts"
}, (opts) => deleteAd.__executeServer(opts));
const deleteAd = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(deleteAd_createServerFn_handler, async ({
  data
}) => {
  await deleteAd$1(data.id);
  return {
    ok: true
  };
});
const deleteMyAd_createServerFn_handler = createServerRpc({
  id: "944bdf9b14036b6396cdff2ceede4468310a8caa97d79271cc547dd1bbd80d54",
  name: "deleteMyAd",
  filename: "src/lib/ads.functions.ts"
}, (opts) => deleteMyAd.__executeServer(opts));
const deleteMyAd = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(deleteMyAd_createServerFn_handler, async ({
  data,
  context
}) => {
  const ad = await getAdById(data.id);
  if (!ad || ad.created_by !== context.userId) throw new Error("غير مصرح");
  await deleteAd$1(data.id);
  return {
    ok: true
  };
});
const listApprovedAds_createServerFn_handler = createServerRpc({
  id: "2c215c91a90faef79da9d18b0eb92d1ef9fbb18f84106d533d5af37449a05903",
  name: "listApprovedAds",
  filename: "src/lib/ads.functions.ts"
}, (opts) => listApprovedAds.__executeServer(opts));
const listApprovedAds = createServerFn({
  method: "GET"
}).handler(listApprovedAds_createServerFn_handler, async () => {
  const ads = await listAdsByStatus("approved");
  return Promise.all(ads.map(async (a) => ({
    ...a,
    image_signed_url: await resolveImage(a.image_url)
  })));
});
const getApprovedAd_createServerFn_handler = createServerRpc({
  id: "e65f1c7b2b5c36bbc7a7b847ae74a85fff6117377deccf4cd42c9a446ca3737a",
  name: "getApprovedAd",
  filename: "src/lib/ads.functions.ts"
}, (opts) => getApprovedAd.__executeServer(opts));
const getApprovedAd = createServerFn({
  method: "GET"
}).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(getApprovedAd_createServerFn_handler, async ({
  data
}) => {
  const ad = await getAdById(data.id);
  if (!ad || ad.status !== "approved") return null;
  return {
    ...ad,
    image_signed_url: await resolveImage(ad.image_url)
  };
});
const submitVisitorAd_createServerFn_handler = createServerRpc({
  id: "8e18ebb7412094656070fe87bb4f75b5585d040dde6dc8879e5a04cdef734f7b",
  name: "submitVisitorAd",
  filename: "src/lib/ads.functions.ts"
}, (opts) => submitVisitorAd.__executeServer(opts));
const submitVisitorAd = createServerFn({
  method: "POST"
}).inputValidator((d) => objectType({
  title: stringType().trim().min(1).max(200),
  description: stringType().trim().max(2e3).optional().default(""),
  location: stringType().trim().max(300).optional().default(""),
  image_path: stringType().trim().max(500).optional().default(""),
  pdf_key: stringType().trim().max(500).optional().default(""),
  contact_email: stringType().trim().max(255).refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "بريد إلكتروني غير صحيح").optional().default("")
}).parse(d)).handler(submitVisitorAd_createServerFn_handler, async ({
  data
}) => {
  if (await isBlocked(null, data.contact_email)) throw new Error(BLOCKED_MESSAGE);
  const safePath = data.image_path && data.image_path.startsWith("submissions/") ? data.image_path : "";
  const safePdf = data.pdf_key && data.pdf_key.startsWith("submissions/") ? data.pdf_key : "";
  const id = await insertAd({
    title: data.title,
    description: data.description || null,
    location: data.location || null,
    image_url: safePath || null,
    contact_email: data.contact_email || null,
    status: "pending",
    pdf_key: safePdf || null
  });
  await updateAd$1(id, {
    link_url: `/ads/${id}`
  });
  return {
    id
  };
});
const listAdComments_createServerFn_handler = createServerRpc({
  id: "5b95ad651485d828d299837e8ae3aebcf2601ddb83a81bafd444e7c657d79eb8",
  name: "listAdComments",
  filename: "src/lib/ads.functions.ts"
}, (opts) => listAdComments.__executeServer(opts));
const listAdComments = createServerFn({
  method: "GET"
}).inputValidator((d) => objectType({
  adId: stringType().uuid()
}).parse(d)).handler(listAdComments_createServerFn_handler, async ({
  data
}) => listAdComments$1(data.adId));
const submitAdComment_createServerFn_handler = createServerRpc({
  id: "1ce867041959958fcb72da9a77d8774d8c5933420d2de303a25279903543e4fc",
  name: "submitAdComment",
  filename: "src/lib/ads.functions.ts"
}, (opts) => submitAdComment.__executeServer(opts));
const submitAdComment = createServerFn({
  method: "POST"
}).inputValidator((d) => objectType({
  adId: stringType().uuid(),
  author_name: stringType().trim().min(1).max(80),
  contact: stringType().trim().max(120).optional().default(""),
  body: stringType().trim().min(1).max(1e3)
}).parse(d)).handler(submitAdComment_createServerFn_handler, async ({
  data
}) => {
  const ad = await getAdById(data.adId);
  if (!ad || ad.status !== "approved") throw new Error("الإعلان غير متاح");
  await insertAdComment({
    ad_id: data.adId,
    author_name: data.author_name,
    contact: data.contact || null,
    body: data.body
  });
  return {
    ok: true
  };
});
export {
  approveAd_createServerFn_handler,
  countPendingAds_createServerFn_handler,
  createAd_createServerFn_handler,
  deleteAd_createServerFn_handler,
  deleteMyAd_createServerFn_handler,
  getApprovedAd_createServerFn_handler,
  listAdComments_createServerFn_handler,
  listApprovedAds_createServerFn_handler,
  listPendingAds_createServerFn_handler,
  rejectAd_createServerFn_handler,
  submitAdComment_createServerFn_handler,
  submitVisitorAd_createServerFn_handler,
  updateAd_createServerFn_handler
};
