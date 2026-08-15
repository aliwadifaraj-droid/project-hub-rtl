import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { insertContactMessage } from "./contact-messages.repo";
import * as blockedRepo from "./blocked.repo";
import { BLOCKED_MESSAGE } from "./blocked.functions";
import { insertProject } from "./projects.repo";
import { invalidateProjectsAll } from "./cache";

export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({
    name: z.string().trim().min(1).max(100),
    email: z.string().trim().email().max(200),
    message: z.string().trim().min(1).max(2000),
  }).parse(d))
  .handler(async ({ data }) => {
    if (await blockedRepo.isBlocked(data.name, data.email)) throw new Error(BLOCKED_MESSAGE);
    await insertContactMessage(data);
    return { ok: true };
  });

export const submitVisitorProject = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      title: z.string().trim().min(1).max(200),
      description: z.string().trim().min(1).max(5000),
      location: z.string().trim().min(1).max(300),
      budget: z.string().trim().max(100).optional().default(""),
      deadline: z.string().trim().max(100).optional().default(""),
      image_path: z.string().trim().max(500).optional().default(""),
      contact_email: z.string().trim().max(255).refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "بريد إلكتروني غير صحيح").optional().default(""),
    }).parse(d))
  .handler(async ({ data }) => {
    if (await blockedRepo.isBlocked(null, data.contact_email)) throw new Error(BLOCKED_MESSAGE);
    const safePath = data.image_path && data.image_path.startsWith("submissions/") ? data.image_path : "";
    const duration = [data.budget, data.deadline].filter(Boolean).join(" — ") || "";
    const id = await insertProject({
      name: data.title,
      description: data.description,
      location: data.location,
      duration: duration || null,
      cover_image: safePath || null,
      images: safePath ? [safePath] : [],
      created_by: null,
      status: "active",
      admin_approval: "approved",
    });
    await invalidateProjectsAll();
    return { id };
  });
