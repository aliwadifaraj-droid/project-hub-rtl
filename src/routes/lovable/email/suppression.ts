import { WebhookError, verifyWebhookRequest } from '@lovable.dev/webhooks-js'
import { createFileRoute } from '@tanstack/react-router'
import { insertEmailLog, suppressEmail } from '@/lib/email.repo'

// Suppression event payload sent by the Go API when Mailgun reports
// a bounce, complaint, or unsubscribe.
interface SuppressionPayload {
  email: string
  reason: 'bounce' | 'complaint' | 'unsubscribe'
  message_id?: string
  metadata?: Record<string, unknown>
  is_retry: boolean
  retry_count: number
}

function parseSuppressionPayload(body: string): SuppressionPayload {
  const parsed = JSON.parse(body)
  if (!parsed.data) {
    throw new Error('Missing data field in payload')
  }
  const data = parsed.data as SuppressionPayload
  if (!data.email || !data.reason) {
    throw new Error('Missing required fields: email, reason')
  }
  return data
}

function mapReasonToStatus(
  reason: string,
): 'bounced' | 'complained' | 'suppressed' {
  switch (reason) {
    case 'bounce':
      return 'bounced'
    case 'complaint':
      return 'complained'
    default:
      return 'suppressed'
  }
}

function mapReasonToMessage(reason: string): string {
  switch (reason) {
    case 'bounce':
      return 'Permanent bounce — email address is invalid or rejected'
    case 'complaint':
      return 'Spam complaint — recipient marked email as spam'
    case 'unsubscribe':
      return 'Recipient unsubscribed'
    default:
      return 'Email suppressed'
  }
}

export const Route = createFileRoute("/lovable/email/suppression")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY
        if (!apiKey) {
          console.error('Missing required environment variables')
          return Response.json({ error: 'Server configuration error' }, { status: 500 })
        }

        // Verify HMAC signature using the Lovable API Key (same as auth-email-hook)
        let payload: SuppressionPayload
        try {
          const verified = await verifyWebhookRequest({
            req: request,
            secret: apiKey,
            parser: parseSuppressionPayload,
          })
          payload = verified.payload
        } catch (error) {
          if (error instanceof WebhookError) {
            switch (error.code) {
              case 'invalid_signature':
                console.error('Invalid webhook signature')
                return Response.json({ error: 'Invalid signature' }, { status: 401 })
              case 'stale_timestamp':
                console.error('Stale webhook timestamp')
                return Response.json({ error: 'Stale timestamp' }, { status: 401 })
              case 'invalid_payload':
              case 'invalid_json':
                console.error('Invalid payload', { code: error.code })
                return Response.json({ error: 'Invalid payload' }, { status: 400 })
              default:
                console.error('Webhook verification failed', {
                  code: error.code,
                  message: error.message,
                })
                return Response.json({ error: 'Verification failed' }, { status: 401 })
            }
          }
          console.error('Unexpected error during verification', { error })
          return Response.json({ error: 'Internal error' }, { status: 500 })
        }

        const normalizedEmail = payload.email.toLowerCase()

        await suppressEmail(normalizedEmail, payload.reason, 'lovable-email')

        // 2. Append a new log entry for the suppression event (never update existing rows)
        const sendLogStatus = mapReasonToStatus(payload.reason)
        const sendLogMessage = mapReasonToMessage(payload.reason)

        await insertEmailLog({ to_email: normalizedEmail, template: 'system', status: sendLogStatus, error: sendLogMessage, metadata: payload.metadata ?? null })

        console.log('Suppression processed', {
          email_redacted: normalizedEmail[0] + '***@' + normalizedEmail.split('@')[1],
          reason: payload.reason,
          is_retry: payload.is_retry,
          retry_count: payload.retry_count,
          has_message_id: !!payload.message_id,
        })

        return Response.json({ success: true })
      },
    },
  },
})
