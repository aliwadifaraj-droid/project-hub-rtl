import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { insertContactMessage } from "./contact-messages.repo";

export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({
    name: z.string().trim().min(1).max(100),
    email: z.string().trim().email().max(200),
    message: z.string().trim().min(1).max(2000),
  }).parse(d))
  .handler(async ({ data }) => {
    await insertContactMessage(data);
    return { ok: true };
  });