import { createFileRoute } from "@tanstack/react-router";
import { runEscalationJob } from "@/lib/escalation-jobs";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/escalation-worker")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env.QSTASH_TOKEN;
        const authorization = request.headers.get("authorization");
        if (!token || authorization !== `Bearer ${token}`) return json({ error: "unauthorized" }, 401);

        try {
          const job = await request.json();
          if (job?.type !== "alert" && job?.type !== "loop") return json({ error: "invalid job" }, 400);
          if (typeof job.chatId !== "string" || typeof job.startIso !== "string") return json({ error: "invalid job" }, 400);
          await runEscalationJob({
            type: job.type,
            chatId: job.chatId,
            startIso: job.startIso,
            loopIndex: job.loopIndex,
          });
          return json({ ok: true });
        } catch (error) {
          console.error("escalation worker failed", error);
          return json({ error: "worker failed" }, 500);
        }
      },
    },
  },
});
