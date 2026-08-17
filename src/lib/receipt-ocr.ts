import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

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

const SYSTEM_PROMPT = `أنت مسؤول عن قراءة صور الإيصالات البنكية.
استخرج اسم البنك أو المحفظة والمبلغ وتاريخ ووقت التحويل من الصورة.
أجب بصيغة JSON فقط:
{"bank":"اسم البنك أو المحفظة أو null","amount":100,"date":"YYYY-MM-DD أو null","time":"HH:MM أو null"}`;

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
              { type: "text", text: "اقرأ الإيصال وأجب بصيغة JSON فقط." },
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
    };
  } catch (error) {
    console.error("[receipt-ocr] exception", error);
    return EMPTY_RESULT;
  }
}

export async function scanReceipt(file: File): Promise<OcrResult> {
  return scanReceiptDataUrl(await fileToBase64(file));
}

const BANK_KEYWORDS = ["بنك", "bank", "stc pay", "apple pay", "mada", "مدى", "محفظة", "wallet", "alipay", "wechat"];

export function validateOcrResult(result: OcrResult, expectedAmount: number): { ok: boolean; message: string } {
  // 1) اسم البنك: لازم يكون فيه كلمة "بنك" أو "Bank" أو اسم محفظة
  if (!result.bank) return { ok: false, message: "لم يتم العثور على اسم بنك أو محفظة في الإيصال" };
  const bankLower = result.bank.toLowerCase();
  const hasBankKeyword = BANK_KEYWORDS.some((k) => bankLower.includes(k));
  if (!hasBankKeyword) return { ok: false, message: "الإيصال لا يحتوي على اسم بنك أو محفظة معروفة" };

  // 2) التاريخ: لازم يكون خلال آخر 72 ساعة
  if (!result.date) return { ok: false, message: "لم يتم العثور على تاريخ في الإيصال" };
  const receiptDate = new Date(result.date);
  if (isNaN(receiptDate.getTime())) return { ok: false, message: "تاريخ الإيصال غير صالح" };
  const now = new Date();
  const diffHours = (now.getTime() - receiptDate.getTime()) / 3_600_000;
  if (diffHours > 72) return { ok: false, message: "الإيصال قديم — يجب أن يكون خلال آخر 72 ساعة" };
  if (diffHours < -24) return { ok: false, message: "تاريخ الإيصال في المستقبل" };

  // 3) المبلغ: لازم يطابق قيمة الباقة بالضبط
  if (result.amount === null) return { ok: false, message: "لم يتم قراءة مبلغ التحويل من الإيصال" };
  if (result.amount !== expectedAmount) {
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
