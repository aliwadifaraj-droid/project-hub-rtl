import { createFileRoute } from '@tanstack/react-router'
import { getUnsubscribeToken, markUnsubscribeTokenUsed, suppressEmail } from '@/lib/email.repo'

export const Route = createFileRoute("/email/unsubscribe")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const token = url.searchParams.get('token')

        if (!token) {
          return Response.json({ error: 'Token is required' }, { status: 400 })
        }

        const tokenRecord = await getUnsubscribeToken(token)
        if (!tokenRecord) {
          return Response.json({ error: 'Invalid or expired token' }, { status: 404 })
        }

        if (tokenRecord.used) {
          return Response.json({ valid: false, reason: 'already_unsubscribed' })
        }

        return Response.json({ valid: true, email: tokenRecord.email })
      },

      POST: async ({ request }) => {
        const url = new URL(request.url)
        let token: string | null = url.searchParams.get('token')

        // Detect RFC 8058 one-click unsubscribe: POST with form-encoded body
        // containing "List-Unsubscribe=One-Click". Email clients (Gmail, Apple Mail,
        // etc.) send this when the user clicks "Unsubscribe" in the mail UI.
        const contentType = request.headers.get('content-type') ?? ''
        if (contentType.includes('application/x-www-form-urlencoded')) {
          const formText = await request.text()
          const params = new URLSearchParams(formText)
          // For one-click, token comes from query param (already set above).
          // Otherwise, token may be in the form body.
          if (!params.get('List-Unsubscribe')) {
            const formToken = params.get('token')
            if (formToken) {
              token = formToken
            }
          }
        } else {
          // JSON body (from the app's unsubscribe page)
          try {
            const body = await request.json()
            if (body.token) {
              token = body.token
            }
          } catch {
            // Fall through — token stays from query param
          }
        }

        if (!token) {
          return Response.json({ error: 'Token is required' }, { status: 400 })
        }

        const tokenRecord = await getUnsubscribeToken(token)
        if (!tokenRecord) {
          return Response.json({ error: 'Invalid or expired token' }, { status: 404 })
        }

        if (tokenRecord.used) {
          return Response.json({ success: false, reason: 'already_unsubscribed' })
        }

        const updated = await markUnsubscribeTokenUsed(token)
        if (!updated) {
          return Response.json({ success: false, reason: 'already_unsubscribed' })
        }

        await suppressEmail(updated.email, 'unsubscribe', 'unsubscribe')

        return Response.json({ success: true })
      },
    },
  },
})
