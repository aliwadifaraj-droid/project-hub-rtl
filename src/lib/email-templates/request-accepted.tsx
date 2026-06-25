import * as React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  requestId?: string
  companyName?: string
}

export function RequestAcceptedEmail({ requestId = '', companyName = '' }: Props) {
  return (
    <Html lang="ar" dir="rtl">
      <Head />
      <Preview>طلبك مقبول</Preview>
      <Body style={{ fontFamily: 'Cairo, Arial, sans-serif', background: '#f6f7f9', padding: '24px' }}>
        <Container style={{ background: '#fff', borderRadius: 8, padding: 24, maxWidth: 560 }}>
          <Heading style={{ fontSize: 20, margin: 0, color: '#111' }}>طلبك مقبول</Heading>
          {companyName ? (
            <Text style={{ color: '#444', marginTop: 12 }}>مرحباً {companyName}،</Text>
          ) : null}
          <Text style={{ color: '#222', fontSize: 16 }}>
            طلبك رقم <strong>{requestId}</strong> تم قبوله.
          </Text>
          <Text style={{ color: '#666', fontSize: 13, marginTop: 24 }}>
            سيتم التواصل معكم قريباً لاستكمال الإجراءات.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: RequestAcceptedEmail,
  subject: 'طلبك مقبول',
  displayName: 'Request Accepted',
  previewData: { requestId: '00000000-0000-0000-0000-000000000000', companyName: 'شركة تجريبية' },
} satisfies TemplateEntry
