import { Buffer } from "node:buffer";
import { c as createServerRpc } from "./createServerRpc-DYLDSQ_Q.mjs";
import { c as createServerFn } from "./server-COznR7QB.mjs";
import { r as requireAuth } from "./auth-middleware.server-B9hAjfqi.mjs";
import { existsDuplicateOfferNotification, insertOfferNotificationMany, existsDuplicateAddProjectNotification, listAllOfferNotifications, countNewOfferNotifications, getOfferNotificationById, deleteOfferNotification, updateOfferNotificationStatus } from "./notifications.repo-vog42ua4.mjs";
import { i as isBlocked } from "./blocked.repo-DHutU73k.mjs";
import { B as BLOCKED_MESSAGE } from "./blocked.functions-pr1NkNVd.mjs";
import { signGetUrl } from "./r2-CJ2zxhhj.mjs";

import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import "../_libs/bcryptjs.mjs";
import "../_libs/libsql__isomorphic-ws.mjs";
import "../_libs/libsql__hrana-client.mjs";
import "../_libs/promise-limit.mjs";
import "../_libs/aws4fetch.mjs";
import { o as objectType, s as stringType, e as enumType } from "../_libs/zod.mjs";

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
import "./db-D5OYORU-.mjs";
import "../_libs/libsql__client.mjs";
import "../_libs/libsql__core.mjs";
import "../_libs/js-base64.mjs";
import "../_libs/jose.mjs";
import "./createSsrRpc-DY9HpWEz.mjs";

const OFFER_SUCCESS_MESSAGE = "تم استلام عرضك بنجاح. سيتم اشعاركم بأي تحديث ✅";
const submitSchema = objectType({
  project_id: stringType().uuid(),
  projectName: stringType().trim().min(2).max(200),
  companyName: stringType().trim().min(2).max(200),
  email: stringType().trim().email().max(200),
  amount: stringType().trim().min(1).max(60),
  pdfKey: stringType().trim().min(1).max(500),
  pdfFilename: stringType().trim().min(1).max(200),
  visitorToken: stringType().uuid().optional().nullable()
});
const OFFER_DUPLICATE_MESSAGE = "لم نتمكن من معالجة طلبكم يرجى التواصل مع الدعم الفني";
async function listAdminUserIds() {
  const {
    db,
    rowsToObjects
  } = await import("./db-D5OYORU-.mjs").then((n) => n.e);
  const r = await db.execute(`SELECT DISTINCT user_id FROM user_roles WHERE role IN ('admin','employee')`);
  return rowsToObjects(r).map((x) => String(x.user_id));
}
const submitOffer_createServerFn_handler = createServerRpc({
  id: "44b86b436fe8582afd56c6b0eda471eb699a048021a38998ebcdfc0c9d9704f8",
  name: "submitOffer",
  filename: "src/lib/offers.functions.ts"
}, (opts) => submitOffer.__executeServer(opts));
const submitOffer = createServerFn({
  method: "POST"
}).inputValidator((d) => submitSchema.parse(d)).handler(submitOffer_createServerFn_handler, async ({
  data
}) => {
  const blocked = await isBlocked(data.companyName, data.email);
  if (blocked) {
    return {
      ok: false,
      message: BLOCKED_MESSAGE
    };
  }
  const projectsRepo = await import("./projects.repo-DX_seSWS.mjs");
  const project = await projectsRepo.getById(data.project_id);
  if (!project) {
    return {
      ok: false,
      message: "المشروع غير موجود"
    };
  }
  const duplicate = await existsDuplicateOfferNotification(data.projectName, data.email, data.companyName);
  if (duplicate) {
    return {
      ok: false,
      message: OFFER_DUPLICATE_MESSAGE
    };
  }
  const staff = await listAdminUserIds();
  const title = "عرض سعر جديد";
  const body = `${data.companyName} — ${data.projectName} — ${data.amount}`;
  const ids = await insertOfferNotificationMany(staff.map((uid) => ({
    user_id: uid,
    title,
    body,
    link: "/admin/offers",
    project_id: data.project_id,
    project_name: data.projectName,
    company_name: data.companyName,
    email: data.email,
    amount: data.amount,
    pdf_key: data.pdfKey,
    pdf_filename: data.pdfFilename,
    source: "platform",
    offer_status: "new"
  })));
  const id = ids[0] ?? "";
  if (data.visitorToken) {
    try {
      const support = await import("./support.repo-DmHG3-Jr.mjs");
      const chat = await support.getChatByVisitorToken(data.visitorToken);
      if (chat) await support.addSupportMessage(chat.id, "bot", OFFER_SUCCESS_MESSAGE);
    } catch (e) {
      console.error("offer chat message failed", e);
    }
  }
  return {
    ok: true,
    id,
    message: OFFER_SUCCESS_MESSAGE
  };
});
const addProjectSchema = objectType({
  company_name: stringType().trim().min(1).max(200),
  facility_location: stringType().trim().min(1).max(300),
  email: stringType().trim().email().max(255),
  file_name: stringType().trim().min(1).max(200),
  file_base64: stringType().min(8).max(15e6)
});
const ADD_PROJECT_SUCCESS_MESSAGE = "تم استلام طلبكم بنجاح. سيتم التواصل معكم لاحقاً ✅";
const submitAddProjectOffer_createServerFn_handler = createServerRpc({
  id: "ecdc73f97ae33d5257d739dbb17f737a77ab3872680ff91462798930243850fd",
  name: "submitAddProjectOffer",
  filename: "src/lib/offers.functions.ts"
}, (opts) => submitAddProjectOffer.__executeServer(opts));
const submitAddProjectOffer = createServerFn({
  method: "POST"
}).inputValidator((d) => addProjectSchema.parse(d)).handler(submitAddProjectOffer_createServerFn_handler, async ({
  data
}) => {
  const blocked = await isBlocked(data.company_name, data.email);
  if (blocked) {
    return {
      ok: false,
      message: BLOCKED_MESSAGE
    };
  }
  const duplicate = await existsDuplicateAddProjectNotification(data.email, data.company_name);
  if (duplicate) {
    return {
      ok: false,
      message: OFFER_DUPLICATE_MESSAGE
    };
  }
  const bytes = Buffer.from(data.file_base64, "base64");
  if (bytes.length === 0) throw new Error("الملف فارغ");
  if (bytes.length > 10 * 1024 * 1024) throw new Error("حجم الملف يجب أن يكون أقل من 10 ميغابايت");
  if (bytes[0] !== 37 || bytes[1] !== 80 || bytes[2] !== 68 || bytes[3] !== 70 || bytes[4] !== 45) {
    throw new Error("الملف ليس PDF صالحاً");
  }
  let submitterType = "guest";
  try {
    const {
      getSessionClaims
    } = await import("./db-D5OYORU-.mjs").then((n) => n.b);
    const claims = await getSessionClaims();
    if (claims) submitterType = "user";
  } catch {
  }
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
  const staff = await listAdminUserIds();
  const title = "طلب إضافة مشروع جديد";
  const body = `${data.company_name} — ${data.facility_location}`;
  const ids = await insertOfferNotificationMany(staff.map((uid) => ({
    user_id: uid,
    title,
    body,
    link: "/admin/offers",
    company_name: data.company_name,
    email: data.email,
    facility_location: data.facility_location,
    pdf_key: path,
    pdf_filename: data.file_name,
    source: "add_project",
    submitter_type: submitterType,
    offer_status: "new"
  })));
  return {
    ok: true,
    id: ids[0] ?? "",
    message: ADD_PROJECT_SUCCESS_MESSAGE
  };
});
function assertStaff(roles) {
  if (!roles.includes("admin") && !roles.includes("employee")) throw new Error("Forbidden");
}
const adminListOffers_createServerFn_handler = createServerRpc({
  id: "2b7d944e60b08bcdc1fa7a16dba44b1924f252c838ee796c60dd9c638a18e6d5",
  name: "adminListOffers",
  filename: "src/lib/offers.functions.ts"
}, (opts) => adminListOffers.__executeServer(opts));
const adminListOffers = createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(adminListOffers_createServerFn_handler, async ({
  context
}) => {
  assertStaff(context.roles);
  const rows = await listAllOfferNotifications();
  return rows.map((r) => ({
    id: r.id,
    project_id: r.project_id,
    project_name: r.project_name,
    company_name: r.company_name ?? "",
    email: r.email ?? "",
    amount: r.amount ?? "",
    duration: null,
    facility_location: r.facility_location,
    pdf_key: r.pdf_key,
    pdf_filename: r.pdf_filename,
    status: r.offer_status ?? "new",
    visitor_token: null,
    source: r.source ?? "platform",
    submitter_type: r.submitter_type,
    created_at: r.created_at
  }));
});
const adminCountNewOffers_createServerFn_handler = createServerRpc({
  id: "185a1991094210b2d32efab49f8d7acd5513ff227faca5d4da0087bb88635515",
  name: "adminCountNewOffers",
  filename: "src/lib/offers.functions.ts"
}, (opts) => adminCountNewOffers.__executeServer(opts));
const adminCountNewOffers = createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(adminCountNewOffers_createServerFn_handler, async ({
  context
}) => {
  assertStaff(context.roles);
  return {
    count: await countNewOfferNotifications()
  };
});
const adminUpdateOfferStatus_createServerFn_handler = createServerRpc({
  id: "008260bf3785ecc73620b20adfb599ce556159535a1c054533b212ab63a5b0fa",
  name: "adminUpdateOfferStatus",
  filename: "src/lib/offers.functions.ts"
}, (opts) => adminUpdateOfferStatus.__executeServer(opts));
const adminUpdateOfferStatus = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  id: stringType().uuid(),
  status: enumType(["pending", "new", "reviewing", "accepted", "rejected"])
}).parse(d)).handler(adminUpdateOfferStatus_createServerFn_handler, async ({
  data,
  context
}) => {
  assertStaff(context.roles);
  if (data.status === "accepted") {
    const offer = await getOfferNotificationById(data.id);
    if (!offer) return {
      ok: false,
      message: "العرض غير موجود"
    };
    const requests = await import("./project-requests.repo-BJrIn2i8.mjs");
    const requestId = await requests.insertRequest({
      project_id: offer.project_id ?? null,
      company_name: offer.company_name ?? "",
      facility_location: offer.facility_location ?? offer.project_name ?? "",
      email: offer.email ?? "",
      pdf_url: offer.pdf_key ?? "",
      submitter_type: offer.submitter_type ?? "offer"
    });
    await requests.updateRequestStatus(requestId, "new");
    await deleteOfferNotification(offer.id);
    return {
      ok: true,
      moved: true,
      requestId
    };
  }
  await updateOfferNotificationStatus(data.id, data.status);
  return {
    ok: true
  };
});
const adminDeleteOffer_createServerFn_handler = createServerRpc({
  id: "054b265a94cc68fad8096cb913bc75d1468d45ef608c672eb224b988bcb6020c",
  name: "adminDeleteOffer",
  filename: "src/lib/offers.functions.ts"
}, (opts) => adminDeleteOffer.__executeServer(opts));
const adminDeleteOffer = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(adminDeleteOffer_createServerFn_handler, async ({
  data,
  context
}) => {
  if (!context.roles.includes("admin")) throw new Error("Forbidden");
  await deleteOfferNotification(data.id);
  return {
    ok: true
  };
});
const adminGetOfferPdfUrl_createServerFn_handler = createServerRpc({
  id: "3c44a42ed774bf578a6b2548e0865d038dcc3dcb253782b3109b445d11569b3e",
  name: "adminGetOfferPdfUrl",
  filename: "src/lib/offers.functions.ts"
}, (opts) => adminGetOfferPdfUrl.__executeServer(opts));
const adminGetOfferPdfUrl = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  key: stringType().min(1).max(500)
}).parse(d)).handler(adminGetOfferPdfUrl_createServerFn_handler, async ({
  data,
  context
}) => {
  assertStaff(context.roles);
  return {
    url: await signGetUrl(data.key, 60 * 60)
  };
});
export {
  adminCountNewOffers_createServerFn_handler,
  adminDeleteOffer_createServerFn_handler,
  adminGetOfferPdfUrl_createServerFn_handler,
  adminListOffers_createServerFn_handler,
  adminUpdateOfferStatus_createServerFn_handler,
  submitAddProjectOffer_createServerFn_handler,
  submitOffer_createServerFn_handler
};
