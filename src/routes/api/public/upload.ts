import { createServerFn } from "@tanstack/react-start";
import { json } from "@tanstack/react-start";
import { requireAuth } from "@/lib/auth-middleware.server";
import { uploadToR2, signGetUrl, makeKey, getBucket } from "@/lib/r2";
// NOTE: r2.ts modified to use import.meta.env VITE_ variables for Vercel compatibility.
