import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getSessionClaims } from "@/lib/auth.server";
import { getBotSettingsRow, upsertBotSettings } from "@/lib/bot-settings.repo";

const bodySchema = z.object({
  systemInstruction: z.string().trim().max(4000),
  dialect: z.string().trim().max(100),
  botName: z.string().trim().max(100),
  blockedReplies: z.array(z.string().trim().max(200)).max(50),
  scope: z.string().trim().max(2000),
  groqEnabled: z.boolean(),
});

async function authorizeAdmin() {
  const claims = await getSessionClaims();
  if (!claims?.roles.includes("admin")) return null;
  return { uid: claims.sub };
}

export const Route = createFileRoute("/api/admin/bot-settings")({
  server: {
    handlers: {
      GET: async () => {
        const auth = await authorizeAdmin();
        if (!auth) return new Response("Unauthorized", { status: 401 });
        const data = await getBotSettingsRow();
        return Response.json({
          systemInstruction: data?.gemini_system_instruction ?? "",
          dialect: data?.gemini_dialect ?? "",
          botName: data?.gemini_bot_name ?? "",
          blockedReplies: data?.gemini_blocked_replies ?? [],
          scope: data?.gemini_scope ?? "",
          groqEnabled: (data as any)?.groq_enabled ?? true,
        });
      },
      POST: async ({ request }) => {
        const auth = await authorizeAdmin();
        if (!auth) return new Response("Unauthorized", { status: 401 });
        let body: unknown;
        try { body = await request.json(); }
        catch { return new Response("Invalid JSON", { status: 400 }); }
        const parsed = bodySchema.safeParse(body);
        if (!parsed.success) {
          return Response.json({ error: parsed.error.flatten() }, { status: 400 });
        }
        const v = parsed.data;
        const patch = {
          gemini_system_instruction: v.systemInstruction,
          gemini_dialect: v.dialect,
          gemini_bot_name: v.botName,
          gemini_blocked_replies: v.blockedReplies.filter((s) => s.length > 0),
          gemini_scope: v.scope,
          groq_enabled: v.groqEnabled,
        };
        await upsertBotSettings(patch);
        return Response.json({ ok: true });
      },
    },
  },
});
