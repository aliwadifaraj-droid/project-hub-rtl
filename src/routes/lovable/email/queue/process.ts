import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/lovable/email/queue/process')({
  server: {
    handlers: {
      POST: async () => Response.json({ processed: 0, skipped: true, reason: 'direct-send-enabled' }),
    },
  },
})