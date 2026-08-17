import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

export interface OcrResult {
  bank: string | null;
  amount: number | null;
  date: string | null;
  time: string | null;
  is_receipt: boolean;
  is_recent: boolean;
}

const SYSTEM_PROMPT = `أنت مسؤول عن فحص صور الإيصالات البنكية.
استخرج البيانات التالية من الإيصال:
- اسم البنك
- المبلغ المحوّل
- تاريخ التحويل
- وقت التحويل
ثم تحقق من:
1. هل الصورة تحتوي على إيصال تحويل بنكي حقيقي؟
2. هل التاريخ في الإيصال حديث (ضمن آخر 30 يوماً)؟
أجب بصيغة JSON فقط:
{"bank": "اسم البنك أو null", "amount": 100, "date": "YYYY-MM-DD أو null", "time": "HH:MM أو null", "is_receipt": true/false, "is_recent": true/false}`;

function extractJson(text: string): Record<string, any> | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

export async function scanReceipt(file: File): Promise<OcrResult> {
  const dataUrl = await fileToBase64(file);
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("[receipt-ocr] GROQ_API_KEY missing — skipping scan");
    return { bank: null, amount: null, date: null, time: null, is_receipt: true, is_recent: true };
  }

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        temperature: 0.1,
        max_tokens: 512,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "افحص هذا الإيصال واستخرج البيانات بصيغة JSON." },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      console.error("[receipt-ocr] Groq API error", res.status, await res.text());
      return { bank: null, amount: null, date: null, time: null, is_receipt: true, is_recent: true };
    }

    const j: any = await res.json();
    const text: string = j?.choices?.[0]?.message?.content?.trim() ?? "";
    const parsed = extractJson(text);
    if (!parsed) {
      console.error("[receipt-ocr] No JSON in response:", text);
      return { bank: null, amount: null, date: null, time: null, is_receipt: true, is_recent: true };
    }

    return {
      bank: parsed.bank ?? null,
      amount: typeof parsed.amount === "number" ? parsed.amount : null,
      date: parsed.date ?? null,
      time: parsed.time ?? null,
      is_receipt: parsed.is_receipt === true,
      is_recent: parsed.is_recent === true,
    };
  } catch (e) {
    console.error("[receipt-ocr] exception", e);
    return { bank: null, amount: null, date: null, time: null, is_receipt: true, is_recent: true };
  }
}

export function validateOcrResult(result: OcrResult, expectedPrice: number): { ok: boolean; message: string } {
  if (!result.is_receipt) {
    return { ok: false, message: "الصورة ليست إيصال تحويل بنكي صحيح" };
  }
  if (!result.is_recent) {
    return { ok: false, message: "الإيصال قديم — يجب أن يكون ضمن آخر 30 يوماً" };
  }
  if (result.amount !== null && result.amount < expectedPrice) {
    return { ok: false, message: `المبلغ في الإيصال (${result.amount} ر.س) أقل من قيمة الباقة (${expectedPrice} ر.س)` };
  }
  return { ok: true, message: "تم التحقق من الإيصال بنجاح" };
}

export const validateReceiptOcr = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      imageData: z.string().min(1),
      mime: z.string().optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const dataUrl = data.imageData.startsWith("data:")
      ? data.imageData
      : `data:${data.mime ?? "image/jpeg"};base64,${data.imageData}`;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error("[receipt-ocr] GROQ_API_KEY missing — skipping validation");
      return { valid: true, reason: "لم يتم التحقق (لا يوجد مفتاح API)" };
    }

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: VISION_MODEL,
          temperature: 0.1,
          max_tokens: 256,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: [
                { type: "text", text: "افحص هذه الصورة وأجب بصيغة JSON." },
                { type: "image_url", image_url: { url: dataUrl } },
              ],
            },
          ],
        }),
      });

      if (!res.ok) {
        console.error("[receipt-ocr] Groq API error", res.status, await res.text());
        return { valid: true, reason: "تعذر التحقق من الإيصال" };
      }

      const j: any = await res.json();
      const text: string = j?.choices?.[0]?.message?.content?.trim() ?? "";
      const parsed = extractJson(text);
      if (!parsed) {
        console.error("[receipt-ocr] No JSON in response:", text);
        return { valid: true, reason: "تعذر تحليل نتيجة الفحص" };
      }

      if (parsed.is_receipt !== true) {
        return { valid: false, reason: "الصورة ليست إيصال تحويل بنكي صحيح" };
      }
      if (parsed.is_recent !== true) {
        return { valid: false, reason: "الإيصال قديم — يجب أن يكون ضمن آخر 30 يوماً" };
      }

      return { valid: true, reason: "تم التحقق من الإيصال بنجاح" };
    } catch (e) {
      console.error("[receipt-ocr] exception", e);
      return { valid: true, reason: "تعذر التحقق من الإيصال" };
    }
  });

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
