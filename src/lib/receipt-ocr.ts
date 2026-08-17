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

const EMPTY_RESULT: OcrResult = {
  bank: null,
  amount: null,
  date: null,
  time: null,
  is_receipt: false,
  is_recent: false,
};

const SYSTEM_PROMPT = `أنت مسؤول عن فحص صور الإيصالات البنكية.
استخرج اسم البنك والمبلغ وتاريخ ووقت التحويل.
تحقق أن الصورة إيصال تحويل بنكي حقيقي وأن التاريخ خلال آخر 30 يوماً.
أجب بصيغة JSON فقط:
{"bank":"اسم البنك أو null","amount":100,"date":"YYYY-MM-DD أو null","time":"HH:MM أو null","is_receipt":true,"is_recent":true}`;

function extractJson(text: string): Record<string, unknown> | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function scanReceiptDataUrl(dataUrl: string): Promise<OcrResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("[receipt-ocr] GROQ_API_KEY missing");
    return EMPTY_RESULT;
  }

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: VISION_MODEL,
        temperature: 0,
        max_tokens: 256,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "افحص الصورة وأجب بصيغة JSON فقط." },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });
    if (!res.ok) {
      console.error("[receipt-ocr] Groq API error", res.status);
      return EMPTY_RESULT;
    }

    const response = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const parsed = extractJson(response.choices?.[0]?.message?.content?.trim() ?? "");
    if (!parsed) return EMPTY_RESULT;

    return {
      bank: typeof parsed.bank === "string" ? parsed.bank : null,
      amount: typeof parsed.amount === "number" ? parsed.amount : null,
      date: typeof parsed.date === "string" ? parsed.date : null,
      time: typeof parsed.time === "string" ? parsed.time : null,
      is_receipt: parsed.is_receipt === true,
      is_recent: parsed.is_recent === true,
    };
  } catch (error) {
    console.error("[receipt-ocr] exception", error);
    return EMPTY_RESULT;
  }
}

export async function scanReceipt(file: File): Promise<OcrResult> {
  return scanReceiptDataUrl(await fileToBase64(file));
}

export function validateOcrResult(result: OcrResult, expectedPrice: number): { ok: boolean; message: string } {
  if (!result.is_receipt) return { ok: false, message: "الصورة ليست إيصال تحويل بنكي صحيح" };
  if (!result.is_recent) return { ok: false, message: "الإيصال قديم أو لا يحتوي على تاريخ واضح" };
  if (result.amount === null) return { ok: false, message: "تعذر قراءة مبلغ التحويل" };
  if (result.amount < expectedPrice) {
    return { ok: false, message: `المبلغ في الإيصال (${result.amount} ر.س) أقل من قيمة الباقة (${expectedPrice} ر.س)` };
  }
  return { ok: true, message: "تم التحقق من الإيصال بنجاح" };
}

export const validateReceiptOcr = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ imageData: z.string().min(1), expectedPrice: z.number().positive() }).parse(d))
  .handler(async ({ data }) => {
    const result = await scanReceiptDataUrl(data.imageData);
    const validation = validateOcrResult(result, data.expectedPrice);
    return { valid: validation.ok, reason: validation.message, result };
  });

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
