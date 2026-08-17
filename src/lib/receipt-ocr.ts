import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const VISION_MODELS = [
  "qwen/qwen3.6-27b",
];

export interface OcrResult {
  bank: string | null;
  amount: number | null;
  date: string | null;
  time: string | null;
}

const EMPTY_RESULT: OcrResult = {
  bank: null,
  amount: null,
  date: null,
  time: null,
};

const SYSTEM_PROMPT = `You are an expert OCR assistant specialized in reading Saudi bank transfer receipts and payment app screenshots (Al Rajhi, AlAhli, STC Pay, Urpay, Apple Pay, mada, etc).
Extract the transfer amount, date, time, and bank/wallet name from the image.
Respond with a JSON object only — no markdown, no explanation, no code fences:
{"bank":"bank or wallet name or null","amount":100,"date":"YYYY-MM-DD or null","time":"HH:MM or null"}
Amount must be numeric only (no currency symbol, no commas). If you see a Hijri date, convert it to Gregorian YYYY-MM-DD. If a field is not visible, set it to null. Do not include any thinking or reasoning text outside the JSON.`;

function extractJson(text: string): Record<string, unknown> | null {
  const cleaned = text.replace(/<[\s\S]*?<\/think>/gi, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function callModel(model: string, dataUrl: string, apiKey: string): Promise<OcrResult> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_completion_tokens: 300,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Read this receipt and extract the fields as a JSON object." },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Groq ${model} ${res.status}: ${txt.slice(0, 200)}`);
  }

  const response = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  const parsed = extractJson(response.choices?.[0]?.message?.content?.trim() ?? "");
  if (!parsed) return EMPTY_RESULT;

  const amountRaw = parsed.amount;
  const amountNum = typeof amountRaw === "number"
    ? amountRaw
    : amountRaw != null
      ? Number(String(amountRaw).replace(/[^\d.]/g, ""))
      : null;

  return {
    bank: typeof parsed.bank === "string" && parsed.bank.trim() ? parsed.bank.trim() : null,
    amount: amountNum != null && Number.isFinite(amountNum) ? amountNum : null,
    date: typeof parsed.date === "string" && parsed.date.trim() ? parsed.date.trim() : null,
    time: typeof parsed.time === "string" && parsed.time.trim() ? parsed.time.trim() : null,
  };
}

export async function scanReceiptDataUrl(dataUrl: string): Promise<OcrResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("[receipt-ocr] GROQ_API_KEY missing");
    return EMPTY_RESULT;
  }

  let bestResult: OcrResult = EMPTY_RESULT;
  for (const model of VISION_MODELS) {
    try {
      const result = await callModel(model, dataUrl, apiKey);
      if (result.amount !== null && result.date !== null) {
        return result;
      }
      if (result.amount !== null || result.date !== null) {
        bestResult = result;
      }
    } catch (error) {
      console.error(`[receipt-ocr] model ${model} failed`, error);
    }
  }
  return bestResult;
}

export async function scanReceipt(file: File): Promise<OcrResult> {
  return scanReceiptDataUrl(await fileToBase64(file));
}

export function validateOcrResult(result: OcrResult, expectedAmount: number): { ok: boolean; message: string } {
  // 1) التاريخ: لازم يكون خلال آخر 72 ساعة
  if (!result.date) return { ok: false, message: "لم يتم العثور على تاريخ في الإيصال" };
  const receiptDate = new Date(result.date);
  if (isNaN(receiptDate.getTime())) return { ok: false, message: "تاريخ الإيصال غير صالح" };
  const now = new Date();
  const diffHours = (now.getTime() - receiptDate.getTime()) / 3_600_000;
  if (diffHours > 72) return { ok: false, message: "الإيصال قديم — يجب أن يكون خلال آخر 72 ساعة" };
  if (diffHours < -24) return { ok: false, message: "تاريخ الإيصال في المستقبل" };

  // 2) المبلغ: لازم يطابق قيمة الباقة بالضبط
  if (result.amount === null) return { ok: false, message: "لم يتم قراءة مبلغ التحويل من الإيصال" };
  if (Math.abs(result.amount - expectedAmount) > 0.01) {
    return { ok: false, message: `المبلغ في الإيصال (${result.amount} ر.س) لا يطابق قيمة الباقة (${expectedAmount} ر.س)` };
  }

  return { ok: true, message: "تم التحقق من الإيصال بنجاح" };
}

export const validateReceiptOcr = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ imageData: z.string().min(1), expectedAmount: z.number().positive() }).parse(d))
  .handler(async ({ data }) => {
    const result = await scanReceiptDataUrl(data.imageData);
    const validation = validateOcrResult(result, data.expectedAmount);
    return { approved: validation.ok, reason: validation.message, result };
  });

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
