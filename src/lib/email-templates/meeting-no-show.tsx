import * as React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Text, Hr } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  clientName?: string
  ownerName?: string
  meetingDate?: string
  meetingTime?: string
}

function formatDateAr(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('ar-SA-u-ca-gregory', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function MeetingNoShowEmail({
  clientName = '',
  ownerName = '',
  meetingDate = '',
  meetingTime = '',
}: Props) {
  const dateLabel = meetingDate ? formatDateAr(meetingDate) : ''

  return (
    <Html lang="ar" dir="rtl">
      <Head />
      <Preview>لم يتم الحضور في الموعد — {dateLabel}</Preview>
      <Body style={{ fontFamily: 'Cairo, Arial, sans-serif', background: '#f6f7f9', padding: '24px' }}>
        <Container style={{ background: '#fff', borderRadius: 8, padding: 24, maxWidth: 560 }}>
          <Heading style={{ fontSize: 20, margin: 0, color: '#991b1b' }}>لم يتم الحضور في الموعد</Heading>
          {clientName ? (
            <Text style={{ color: '#444', marginTop: 12 }}>مرحباً {clientName}،</Text>
          ) : (
            <Text style={{ color: '#444', marginTop: 12 }}>مرحباً،</Text>
          )}
          <Text style={{ color: '#222', fontSize: 16 }}>
            لم يتم حضوركم في الاجتماع الذي كان مقرراً
            {ownerName ? <> مع <strong>{ownerName}</strong></> : null}
            {dateLabel ? <> يوم <strong>{dateLabel}</strong></> : null}
            {meetingTime ? <> الساعة <strong>{meetingTime}</strong></> : null}.
          </Text>
          <Text style={{ color: '#666', fontSize: 14, marginTop: 16 }}>
            تم إغلاق غرفة الاجتماع تلقائياً بعد مرور 10 دقائق دون الحضور.
          </Text>
          <Text style={{ color: '#666', fontSize: 14, marginTop: 12 }}>
            لتنسيق موعد آخر، يرجى التواصل مع إدارة المنصة.
          </Text>
          <Hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '20px 0' }} />
          <Text style={{ color: '#94a3b8', fontSize: 12 }}>
            رسالة من منصة العمران.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: MeetingNoShowEmail,
  subject: (data: Record<string, any>) =>
    `لم يتم الحضور في الموعد — ${data.meetingDate ?? ''} ${data.meetingTime ?? ''}`,
  displayName: 'Meeting No-Show',
  previewData: {
    clientName: 'عميل تجريبي',
    ownerName: 'شركة تجريبية',
    meetingDate: '2026-11-15',
    meetingTime: '10:00',
  },
} satisfies TemplateEntry
