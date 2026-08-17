// Receipt OCR scanning using Tesseract.js
// Extracts: bank name, amount, date, time from receipt images

export type OcrResult = {
  bank: string | null;
  amount: string | null;
  date: string | null;
  time: string | null;
  rawText: string;
};

export type OcrValidation = {
  ok: boolean;
  message: string;
};

const BANK_KEYWORDS = [
  "الأهلي", "الراجحي", "البلاد", "الإنماء", "السعودي", "الفرنسي",
  "العربي", "ساب", "الرياض", "أبها", "الجزيرة", "الخليج",
  "Al Rajhi", "NCB", "SNB", "AlBilad", "Alinma", "Riyadh",
  "SABB", "Arab National", "Saudi Fransi", "Bank AlJazira",
];

export async function scanReceipt(file: File): Promise<OcrResult> {
  const { default: Tesseract } = await import("tesseract.js");
  const imageUrl = URL.createObjectURL(file);
  try {
    const { data } = await Tesseract.recognize(imageUrl, "ara+eng", {
      logger: () => {},
    });
    const text = data.text || "";
    return parseReceiptText(text);
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

function parseReceiptText(text: string): OcrResult {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const bank = findBank(lines);
  const amount = findAmount(lines);
  const date = findDate(lines);
  const time = findTime(lines);

  return { bank, amount, date, time, rawText: text };
}

function findBank(lines: string[]): string | null {
  for (const line of lines) {
    for (const keyword of BANK_KEYWORDS) {
      if (line.includes(keyword)) return line;
    }
  }
  return null;
}

function findAmount(lines: string[]): string | null {
  const amountRegex = /(\d{1,3}(?:[,\.\s]\d{3})*(?:[.,]\d{2})?|\d+(?:[.,]\d{2})?)\s*(?:ر\.?س|SAR|SR|ريال|ريالان|ريالين)?/i;
  const keywords = ["مبلغ", "amount", "قيمة", "value", "total", "المجموع", "transfer", "تحويل", "مبلغ التحويل"];
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (keywords.some((k) => lower.includes(k.toLowerCase()))) {
      const match = line.match(amountRegex);
      if (match) return match[1].replace(/[,\s]/g, "").replace(/[.](?=\d{2}$)/, ".");
    }
  }
  for (const line of lines) {
    const match = line.match(amountRegex);
    if (match && match[1] && Number(match[1].replace(/[,\s]/g, "")) > 0) {
      return match[1].replace(/[,\s]/g, "").replace(/[.](?=\d{2}$)/, ".");
    }
  }
  return null;
}

function findDate(lines: string[]): string | null {
  const datePatterns = [
    /(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/,
    /(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})/,
    /(\d{1,2})\s+(يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر)\s+(\d{4})/i,
  ];
  for (const line of lines) {
    for (const pattern of datePatterns) {
      const match = line.match(pattern);
      if (match) return match[0];
    }
  }
  return null;
}

function findTime(lines: string[]): string | null {
  const timePatterns = [
    /(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(?:ص|م|AM|PM)?/i,
    /(\d{1,2})\s*(?:ص|م)\s*(\d{1,2}):(\d{2})/i,
  ];
  for (const line of lines) {
    for (const pattern of timePatterns) {
      const match = line.match(pattern);
      if (match) return match[0];
    }
  }
  return null;
}

export function validateOcrResult(result: OcrResult, expectedAmount: number): OcrValidation {
  if (result.date) {
    const parsed = parseDate(result.date);
    if (parsed) {
      const diffMs = Date.now() - parsed.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays > 3) {
        return { ok: false, message: "تاريخ الإيصال أقدم من 3 أيام — لا يمكن قبوله" };
      }
    }
  }

  if (result.amount) {
    const amountNum = Number(result.amount.replace(/[^0-9.]/g, ""));
    if (!isNaN(amountNum) && amountNum > 0) {
      if (Math.abs(amountNum - expectedAmount) > 1) {
        return { ok: false, message: `المبلغ في الإيصال (${amountNum} ر.س) لا يطابق المبلغ المطلوب (${expectedAmount} ر.س)` };
      }
    }
  }

  return { ok: true, message: "تم التحقق بنجاح" };
}

function parseDate(dateStr: string): Date | null {
  const arabicMonths: Record<string, number> = {
    "يناير": 0, "فبراير": 1, "مارس": 2, "أبريل": 3, "مايو": 4, "يونيو": 5,
    "يوليو": 6, "أغسطس": 7, "سبتمبر": 8, "أكتوبر": 9, "نوفمبر": 10, "ديسمبر": 11,
  };

  const arabicMatch = dateStr.match(/(\d{1,2})\s+(يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر)\s+(\d{4})/i);
  if (arabicMatch) {
    const day = Number(arabicMatch[1]);
    const month = arabicMonths[arabicMatch[2]];
    const year = Number(arabicMatch[3]);
    if (month !== undefined) return new Date(year, month, day);
  }

  const parts = dateStr.split(/[/\-.]/);
  if (parts.length === 3) {
    let [a, b, c] = parts.map(Number);
    if (c < 100) c += 2000;
    if (a > 31 && b <= 12) return new Date(a, b - 1, c);
    if (a <= 31 && b <= 12) return new Date(c, b - 1, a);
  }

  return null;
}
