import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface OcrResult {
  bank: string | null;
  iban: string | null;
  amount: number | null;
  date: string | null;
  time: string | null;
}

const EMPTY_RESULT: OcrResult = {
  bank: null,
  iban: null,
  amount: null,
  date: null,
  time: null,
};

function normalizeArabicDigits(text: string): string {
  return text.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

export function extractAmountFromOcr(text: string): number | null {
  const normalized = normalizeArabicDigits(text);
  const patterns = [
    /(?:المبلغ|amount|التحويل|transfer|قيمة|value|مبلغ)\s*[:：]?\s*(\d+(?:[.,]\d{1,2})?)/i,
    /(\d+(?:[.,]\d{1,2})?)\s*(?:ريال|sar|ر\.س|sr)/i,
    /(\d{3,})\s*(?:ريال|sar|ر\.س|sr)/i,
    /\b(\d{2,}(?:[.,]\d{1,2})?)\s*(?:ريال|sar|ر\.س|sr)/i,
    /(?:المبلغ|amount)\s*[:：]?\s*(\d[\d,]*\.?\d*)/i,
    /(\d[\d,]*\.?\d*)\s*(?:SAR|ر\.س|ريال)/i,
  ];
  for (const p of patterns) {
    const m = normalized.match(p);
    if (m && m[1]) {
      const num = Number(m[1].replace(/,/g, ""));
      if (Number.isFinite(num) && num > 0) return num;
    }
  }
  return null;
}

export function extractDateFromOcr(text: string): string | null {
  const normalized = normalizeArabicDigits(text);
  const isoMatch = normalized.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}-${isoMatch[3].padStart(2, "0")}`;
  }
  const dmyMatch = normalized.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
  if (dmyMatch) {
    return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, "0")}-${dmyMatch[1].padStart(2, "0")}`;
  }
  const dateKeywords = /(?:التاريخ|date|تاريخ|التحويل|transfer)\s*[:：]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i;
  const kwMatch = normalized.match(dateKeywords);
  if (kwMatch && kwMatch[1]) {
    const parts = kwMatch[1].split(/[-\/]/);
    if (parts.length === 3) {
      const y = parts[2].length === 4 ? parts[2] : `20${parts[2]}`;
      const m = parts[1];
      const d = parts[0];
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
  }
  return null;
}

function extractIbanFromOcr(text: string): string | null {
  const normalized = normalizeArabicDigits(text);
  const m = normalized.match(/(SA\d{2}\s?\d{2}\s?[A-Z0-9]{4}(?:\s?[A-Z0-9]{4}){5,6})/i);
  return m ? m[1].replace(/\s+/g, "").trim() : null;
}

export function parseOcrText(text: string): OcrResult {
  const amount = extractAmountFromOcr(text);
  const date = extractDateFromOcr(text);
  const iban = extractIbanFromOcr(text);
  if (!amount && !date && !iban) return EMPTY_RESULT;
  return { bank: null, iban, amount, date, time: null };
}

export async function runOcrOnImage(file: File): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("ara+eng");
  try {
    const { data: { text } } = await worker.recognize(file);
    return text;
  } finally {
    await worker.terminate();
  }
}

export async function scanReceiptFile(file: File): Promise<OcrResult> {
  try {
    const text = await runOcrOnImage(file);
    return parseOcrText(text);
  } catch (e) {
    console.error("[receipt-ocr] Tesseract failed", e);
    return EMPTY_RESULT;
  }
}

export async function scanReceiptDataUrl(dataUrl: string): Promise<OcrResult> {
  try {
    const { createWorker } = await import("tesseract.js");
    const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1]! : dataUrl;
    const buffer = Buffer.from(base64, "base64");
    const worker = await createWorker("ara+eng");
    try {
      const { data: { text } } = await worker.recognize(buffer);
      return parseOcrText(text);
    } finally {
      await worker.terminate();
    }
  } catch (e) {
    console.error("[receipt-ocr] Tesseract server-side failed", e);
    return EMPTY_RESULT;
  }
}

export function validateOcrResult(result: OcrResult, expectedAmount: number): { ok: boolean; message: string } {
  if (result.amount === null) return { ok: false, message: "لم يتم قراءة مبلغ التحويل من الإيصال" };
  const required = Number(expectedAmount);
  const found = Number(result.amount);
  if (!Number.isFinite(required) || !Number.isFinite(found) || Math.abs(found - required) > 2) {
    return { ok: false, message: `المبلغ في الإيصال (${found} ر.س) لا يطابق المبلغ المطلوب (${required} ر.س)` };
  }
  return { ok: true, message: "تم التحقق من الإيصال بنجاح" };
}

export const validateReceiptOcr = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      amount: z.number().nullable(),
      date: z.string().nullable(),
      expectedAmount: z.number().positive(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    if (data.amount == null) {
      return { approved: false, reason: "لم يتم قراءة مبلغ التحويل من الإيصال", result: EMPTY_RESULT };
    }
    const required = Number(data.expectedAmount);
    const found = Number(data.amount);
    if (!Number.isFinite(found) || Math.abs(found - required) > 2) {
      return {
        approved: false,
        reason: `المبلغ في الإيصال (${found} ر.س) لا يطابق المبلغ المطلوب (${required} ر.س)`,
        result: { ...EMPTY_RESULT, amount: found },
      };
    }
    if (data.date) {
      const receiptDate = new Date(data.date);
      if (!isNaN(receiptDate.getTime())) {
        const hoursDiff = (Date.now() - receiptDate.getTime()) / 3_600_000;
        if (hoursDiff < 0 || hoursDiff > 168) {
          return {
            approved: false,
            reason: "تاريخ الإيصال خارج نطاق 7 أيام المسموح",
            result: { ...EMPTY_RESULT, amount: found, date: data.date },
          };
        }
      }
    }
    return {
      approved: true,
      reason: "تم التحقق من الإيصال بنجاح",
      result: { ...EMPTY_RESULT, amount: found, date: data.date },
    };
  });
