import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request) {
  try {
    const { name, email, message } = await request.json()
    
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'كل الحقول مطلوبة' }, { status: 400 })
    }

    await resend.emails.send({
      from: 'Contact Form <onboarding@resend.dev>',
      to: process.env.TO_EMAIL,
      subject: `رسالة جديدة من ${name}`,
      html: `<p><b>الاسم:</b> ${name}</p><p><b>الايميل:</b> ${email}</p><p><b>الرسالة:</b> ${message}</p>`
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'فشل الارسال' }, { status: 500 })
  }
}
