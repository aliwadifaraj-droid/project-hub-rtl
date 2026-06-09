import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // التحقق من المدخلات
    if (!email || !password) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
        { status: 400 }
      );
    }

    // التحقق من صيغة البريد
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'صيغة البريد الإلكتروني غير صحيحة' },
        { status: 400 }
      );
    }

    // التحقق من قوة كلمة المرور
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' },
        { status: 400 }
      );
    }

    // إنشاء عميل Supabase بالمفتاح السري (من السيرفر فقط)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('متغيرات البيئة غير محددة');
      return NextResponse.json(
        { error: 'خطأ في إعدادات السيرفر' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
    });

    // إنشاء المستخدم
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      console.error('خطأ في إنشاء المستخدم:', error);
      
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { error: 'هذا البريد الإلكتروني مسجل بالفعل' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: error.message || 'فشل في إنشاء المستخدم' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'تم إنشاء المستخدم بنجاح',
        user: {
          id: data?.user?.id,
          email: data?.user?.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('خطأ في API:', error);
    return NextResponse.json(
      { error: 'خطأ في السيرفر' },
      { status: 500 }
    );
  }
}