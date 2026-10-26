import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type OwnerLoginPageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

async function loginOwner(formData: FormData): Promise<never> {
  "use server";

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/owner-login?error=يرجى إدخال البريد الإلكتروني وكلمة المرور");
  }

  const database = createClient({
    url: process.env.TURSO_DATABASE_URL ?? "",
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  const result = await database.execute(
    "SELECT id,email,password_hash FROM project_owners WHERE lower(email) = lower(?) LIMIT 1",
    [email],
  );
  const owner = result.rows[0] as { id?: string; email?: string; password_hash?: string } | undefined;
  const validPassword = owner?.password_hash ? await bcrypt.compare(password, owner.password_hash) : false;

  if (!owner?.id || !owner.email || !validPassword) {
    redirect("/owner-login?error=بيانات الدخول غير صحيحة");
  }

  const sessionId = crypto.randomUUID();
  const now = new Date().toISOString();
  await database.execute(
    `INSERT INTO project_owner_sessions (id,owner_id,active,created_at,last_login_at,revoked_at)
     VALUES (?,?,1,?,?,NULL)
     ON CONFLICT(owner_id) DO UPDATE SET active = 1,last_login_at = excluded.last_login_at,revoked_at = NULL`,
    [sessionId, owner.id, now, now],
  );

  const cookieStore = await cookies();
  cookieStore.set("owner_session", sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/owner-login?success=تم تسجيل الدخول بنجاح");
}

export default async function OwnerLoginPage({ searchParams }: OwnerLoginPageProps) {
  const params = await searchParams;

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 px-4 py-16 text-white">
      <section className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white p-7 text-slate-950 shadow-2xl sm:p-9">
        <div className="mb-8">
          <p className="text-sm font-semibold text-blue-600">منصة العمران</p>
          <h1 className="mt-2 text-3xl font-extrabold">تسجيل صاحب المشروع</h1>
          <p className="mt-3 text-sm leading-7 text-slate-500">سجّل الدخول لإدارة مشاريعك ومتابعة الطلبات الواردة.</p>
        </div>

        {params.error ? <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{params.error}</p> : null}
        {params.success ? <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{params.success}</p> : null}

        <form action={loginOwner} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-bold">البريد الإلكتروني</label>
            <input id="email" name="email" type="email" required autoComplete="email" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-bold">كلمة المرور</label>
            <input id="password" name="password" type="password" required minLength={6} autoComplete="current-password" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>
          <button type="submit" className="w-full rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white transition hover:bg-blue-700">تسجيل الدخول</button>
        </form>
      </section>
    </main>
  );
}
