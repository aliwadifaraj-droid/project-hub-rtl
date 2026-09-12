## نطاق العمل
تم حذف Supabase كاملاً (بيانات + Auth + Storage) واستبداله بـ:
- **Turso** للبيانات (@libsql/client)
- **Cloudflare R2** للملفات (@aws-sdk/client-s3 - S3-compatible)
- **Auth بسيط في Turso**: bcrypt + JWT في httpOnly cookies

## الحالة
- ✅ البنية التحتية + Auth (Turso + bcrypt + JWT cookies)
- ✅ حذف src/integrations/supabase/ بالكامل
- ✅ حذف src/lib/supabase-url.ts
- ✅ تحديث src/start.ts (حذف Supabase middleware)
- ✅ إزالة @supabase/supabase-js من package.json
- ✅ تحديث .env و .env.local.example (إزالة متغيرات Supabase)

## المخطط التقني

```text
Client                    Server (createServerFn)
──────                    ──────────────────────
signIn(email,pw) ──────► auth.functions.ts
                          ├─ users.repo: SELECT by email
                          ├─ bcrypt.compare
                          ├─ jose.SignJWT (30 days)
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
