import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface OcrResult {
  bank: string | null;
  iban: string | null;
  amount: number | null;
  date: string | null;
  time: string | null;
}

const EMPTY_RESULT: OcrResult = { bank: null, iban: null, amount: null, date: null, time: null };

function normalizeArabicDigits(text: string): string {
  return text.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

export function extractAmountFromOcr(text: string, expectedAmount?: number): number | null {
  const normalized = normalizeArabicDigits(text);
  const patterns = [
    /(?:المبلغ|amount|التحويل|transfer|قيمة|value|مبلغ)\s*[:：]?\s*(\d+(?:[.,]\d{1,2})?)/i,
    /(\d+(?:[.,]\d{1,2})?)\s*(?:ريال|sar|ر\.س|sr)/i,
    /(\d{3,})\s*(?:ريال|sar|ر\.س|sr)/i,
    /\b(\d{2,}(?:[.,]\d{1,2})?)\s*(?:ريال|sar|ر\.س|sr)/i,
    /(?:المبلغ|amount)\s*[:：]?\s*(\d[\d,]*\.?\d*)/i,
    /(\d[\d,]*\.?\d*)\s*(?:SAR|ر\.س|ريال)/i,
  ];
  const amounts: number[] = [];
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (!match?.[1]) continue;
    const amount = Number(match[1].replace(/,/g, ""));
    if (Number.isFinite(amount) && amount > 0 && !amounts.includes(amount)) amounts.push(amount);
  }
  const expected = Number(expectedAmount);
  if (Number.isFinite(expected) && expected > 0) {
    const matchingAmount = amounts.find((amount) => Math.abs(amount - expected) <= 2);
    if (matchingAmount !== undefined) return matchingAmount;
    const mergedDigitAmount = amounts.find((amount) => {
      const digits = String(Math.trunc(amount));
      return digits.length >= 4 && Math.abs(Number(digits.slice(0, 3)) - expected) <= 2;
    });
    if (mergedDigitAmount !== undefined) return Number(String(Math.trunc(mergedDigitAmount)).slice(0, 3));
  }
  const mergedDigitAmount = amounts.find((amount) => {
    const digits = String(Math.trunc(amount));
    const leadingAmount = Number(digits.slice(0, 3));
    return digits.length >= 4 && digits.endsWith("0") === false && leadingAmount >= 100 && leadingAmount <= 999 && leadingAmount % 50 === 0;
  });
  if (mergedDigitAmount !== undefined) return Number(String(Math.trunc(mergedDigitAmount)).slice(0, 3));
  return amounts[0] ?? null;
}

export function extractDateFromOcr(text: string): string | null {
  const normalized = normalizeArabicDigits(text);
  const isoMatch = normalized.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}-${isoMatch[3].padStart(2, "0")}`;
  const dmyMatch = normalized.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
  if (dmyMatch) return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, "0")}-${dmyMatch[1].padStart(2, "0")}`;
  const dateKeywords = /(?:التاريخ|date|تاريخ|التحويل|transfer)\s*[:：]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i;
  const kwMatch = normalized.match(dateKeywords);
  if (kwMatch?.[1]) {
    const parts = kwMatch[1].split(/[-\/]/);
    if (parts.length === 3) {
      const y = parts[2].length === 4 ? parts[2] : `20${parts[2]}`;
      return `${y}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }
  }
  return null;
}

function extractIbanFromOcr(text: string): string | null {
  const normalized = normalizeArabicDigits(text);
  const m = normalized.match(/(SA\d{2}\s?\d{2}\s?[A-Z0-9]{4}(?:\s?[A-Z0-9]{4}){5,6})/i);
  return m ? m[1].replace(/\s+/g, "").trim() : null;
}

export function parseOcrText(text: string, expectedAmount?: number): OcrResult {
  const amount = extractAmountFromOcr(text, expectedAmount);
  const date = extractDateFromOcr(text);
  const iban = extractIbanFromOcr(text);
  if (!amount && !date && !iban) return EMPTY_RESULT;
  return { bank: null, iban, amount, date, time: null };
}

async function prepareImageForOcr(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("تعذر قراءة الصورة"));
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("تعذر تجهيز صورة الإيصال"));
    element.src = dataUrl;
  });
  const maxDimension = 1800;
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("تعذر تجهيز صورة الإيصال");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => value ? resolve(value) : reject(new Error("تعذر تحويل صورة الإيصال")), "image/jpeg", 0.9);
  });
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, { type: "image/jpeg", lastModified: file.lastModified });
}

async function recognizeImage(file: File): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("ara+eng");
  try {
    const { data: { text } } = await worker.recognize(file);
    return text;
  } finally {
    await worker.terminate();
  }
}

export async function runOcrOnImage(file: File, expectedAmount?: number): Promise<string> {
  let preparedFile = file;
  try {
    preparedFile = await prepareImageForOcr(file);
  } catch (e) {
    console.warn("[receipt-ocr] image preparation failed, using original", e);
  }
  const preparedText = await recognizeImage(preparedFile);
  if (preparedFile === file || parseOcrText(preparedText, expectedAmount).amount !== null) return preparedText;
  const originalText = await recognizeImage(file);
  return parseOcrText(originalText, expectedAmount).amount !== null ? originalText : preparedText;
}

export async function scanReceiptFile(file: File, expectedAmount?: number): Promise<OcrResult> {
  try {
    const text = await runOcrOnImage(file, expectedAmount);
    return parseOcrText(text, expectedAmount);
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
  .inputValidator((d: unknown) => z.object({ amount: z.number().nullable(), date: z.string().nullable(), expectedAmount: z.number().positive() }).parse(d))
  .handler(async ({ data }) => {
    if (data.amount == null) return { approved: false, reason: "لم يتم قراءة مبلغ التحويل من الإيصال", result: EMPTY_RESULT };
    const required = Number(data.expectedAmount);
    const found = Number(data.amount);
    if (!Number.isFinite(found) || Math.abs(found - required) > 2) {
      return { approved: false, reason: `المبلغ في الإيصال (${found} ر.س) لا يطابق المبلغ المطلوب (${required} ر.س)`, result: { ...EMPTY_RESULT, amount: found } };
    }
    if (data.date) {
      const receiptDate = new Date(data.date);
      if (!isNaN(receiptDate.getTime())) {
        const hoursDiff = (Date.now() - receiptDate.getTime()) / 3_600_000;
        if (hoursDiff < 0 || hoursDiff > 168) return { approved: false, reason: "تاريخ الإيصال خارج نطاق 7 أيام المسموح", result: { ...EMPTY_RESULT, amount: found, date: data.date } };
      }
    }
    return { approved: true, reason: "تم التحقق من الإيصال بنجاح", result: { ...EMPTY_RESULT, amount: found, date: data.date } };
  });
