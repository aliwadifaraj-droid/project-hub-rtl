import * as React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Text, Hr, Section } from '@react-email/components'
import type { TemplateEntry } from './registry'

export interface MeetingInvitationProps {
  variant?: 'client' | 'owner'
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

function formatTimeAr(timeStr: string): string {
  try {
    const [h, m] = timeStr.split(':').map(Number)
    const period = h >= 12 ? 'مساءً' : 'صباحاً'
    const h12 = h % 12 || 12
    return `${h12}:${String(m).padStart(2, '0')} ${period}`
  } catch {
    return timeStr
  }
}

export function MeetingInvitationEmail({
  variant = 'client',
  clientName = '',
  ownerName = '',
  meetingDate = '',
  meetingTime = '',
}: MeetingInvitationProps) {
  const dateLabel = meetingDate ? formatDateAr(meetingDate) : ''
  const timeLabel = meetingTime ? formatTimeAr(meetingTime) : ''
  const isOwner = variant === 'owner'
  const greetingName = isOwner ? ownerName : clientName
  const counterpartName = isOwner ? clientName : ownerName
  const counterpartLabel = isOwner ? 'مع العميل' : 'مع'

  return (
    <Html lang="ar" dir="rtl">
      <Head />
      <Preview>دعوة لحضور اجتماع — {dateLabel} {timeLabel}</Preview>
      <Body style={{ fontFamily: 'Cairo, Arial, sans-serif', background: '#f6f7f9', padding: '24px' }}>
        <Container style={{ background: '#fff', borderRadius: 8, padding: 24, maxWidth: 560 }}>
          <Heading style={{ fontSize: 20, margin: 0, color: '#111' }}>دعوة لحضور اجتماع</Heading>
          {greetingName ? (
            <Text style={{ color: '#444', marginTop: 12 }}>مرحباً {greetingName}،</Text>
          ) : (
            <Text style={{ color: '#444', marginTop: 12 }}>مرحباً،</Text>
          )}
          <Text style={{ color: '#222', fontSize: 16 }}>
            {isOwner ? 'تمت جدولة اجتماع' : 'تمت جدولة اجتماع لك'}
            {counterpartName ? <> {counterpartLabel} <strong>{counterpartName}</strong></> : null}.
          </Text>
          <Section style={{ background: '#f9fafb', borderRadius: 8, padding: 16, marginTop: 16 }}>
            <Text style={{ margin: 0, color: '#444', fontSize: 15 }}>
              📅 التاريخ: <strong>{dateLabel}</strong>
            </Text>
            <Text style={{ margin: '8px 0 0', color: '#444', fontSize: 15 }}>
              🕐 الوقت: <strong>{timeLabel}</strong>
            </Text>
          </Section>
          <Text style={{ color: '#666', fontSize: 13, marginTop: 24 }}>
            يرجى الحضور في الوقت المحدد. للاستفسار، تواصل معنا.
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
  component: MeetingInvitationEmail,
  subject: (data: Record<string, any>) =>
    `دعوة لحضور اجتماع — ${data.meetingDate ?? ''} ${data.meetingTime ?? ''}`,
  displayName: 'Meeting Invitation',
  previewData: {
    clientName: 'عميل تجريبي',
    ownerName: 'شركة تجريبية',
    meetingDate: '2026-11-15',
    meetingTime: '10:00',
  },
} satisfies TemplateEntry
