
## نطاق العمل
حذف Supabase كاملاً (بيانات + Auth + Storage) واستبداله بـ:
- **Turso** للبيانات (@libsql/client)
- **Cloudflare R2** للملفات (@aws-sdk/client-s3 - S3-compatible)
- **Auth بسيط في Turso**: bcrypt + JWT في httpOnly cookies

هذا شغل ضخم (~40 ملف يمس Supabase). سأنفذه على **4 دفعات** مع اختبار بين كل دفعة.

## المخاطر المهمة
- **كل المستخدمين الحاليين راح يفقدون حساباتهم** — لأننا نبني Auth جديد من الصفر
- **R2 Account ID اللي أعطيتني (`76`) يبدو ناقص** — R2 endpoints عادة بصيغة `https://<32-hex-char>.r2.cloudflarestorage.com`. سأستخدم القيمة كما هي ولكن قد لا تعمل حتى تصححها
- الأدمن الأول: سأضيف حساب `aliwadifaraj@gmail.com` تلقائياً كأدمن عند التسجيل (يطابق trigger القديم)

## الخطة على دفعات

### الدفعة 1 (هذه الردة) — البنية التحتية + Auth
1. حفظ secrets: `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`
2. تحديث `turso-schema.sql`: إضافة `users`, `sessions`, `user_roles`, `profiles`, `files`, وكل الجداول الناقصة (`ads`, `ad_comments`, `contact_messages`, `project_requests`, `project_submissions`, `site_settings`, `email_*`, `suppressed_emails`)
3. تثبيت: `bcryptjs`, `jose` (JWT), `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`
4. إنشاء:
   - `src/lib/auth.server.ts` — bcrypt hash/verify, JWT sign/verify, session cookies
   - `src/lib/auth.functions.ts` — `signUp`, `signIn`, `signOut`, `getSession`, `resetPassword`
   - `src/lib/r2.ts` — S3 client + `uploadToR2`, `getSignedUrl`, `deleteFromR2`
   - `src/lib/files.repo.ts` + `files.functions.ts`
   - `src/lib/users.repo.ts`, `src/lib/roles.repo.ts`
5. استبدال `src/routes/_authenticated/route.tsx` بحارس Turso session
6. إعادة كتابة `src/routes/auth.tsx` و `reset-password.tsx`
7. حذف `src/integrations/supabase/` بالكامل + `src/lib/kill-switch-*`
8. تحديث `src/start.ts` (حذف Supabase middleware)

### الدفعة 2 — الجداول الأساسية
- `projects`, `ads`, `ad_comments`, `project_requests`, `project_submissions`
- تحويل: `my-projects`, `project-approval`, `ads`, `admin.*` functions

### الدفعة 3 — بقية الجداول
- `contact_messages`, `site_settings`, `bot_*`, `support_*`, `team_messages`, `vip_subscribers`, `email_*`

### الدفعة 4 — Storage migration
- استبدال كل رفع Supabase Storage (bid-pdfs, project-images, vip-receipts) بـ R2
- إضافة signed URLs للملفات الخاصة

## المخطط التقني للدفعة 1

```text
Client                    Server (createServerFn)
──────                    ──────────────────────
signIn(email,pw) ──────► auth.functions.ts
                          ├─ users.repo: SELECT by email
                          ├─ bcrypt.compare
                          ├─ jose.SignJWT (7 days)
                          └─ Set-Cookie: session=<jwt>; httpOnly

Any protected fn ──────► requireAuth middleware
                          ├─ getCookie("session")
                          ├─ jose.jwtVerify
                          └─ context.userId, context.roles

Upload file ──────────► files.functions.ts
                          ├─ R2 PutObject
                          ├─ files.repo INSERT
                          └─ return {id, url}
```

## بعد الدفعة 1
- تسجيل دخول/تسجيل جديد يشتغل
- الحسابات القديمة **لن تعمل** (يحتاجون تسجيل جديد)
- كل صفحات البيانات (projects, ads, vip, ...) لسه ترجع فاضية لأنها كانت على kill-switch
- الدفعات 2-4 تعبيها بالبيانات الفعلية

**هل أبدأ الدفعة 1؟**
