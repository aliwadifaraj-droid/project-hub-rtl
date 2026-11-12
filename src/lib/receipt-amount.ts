export function normalizeArabicDigits(text: string): string {
  return text.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

function parseAmountToken(token: string): number {
  return Number(token.replace(/,(\d{1,2})$/, ".$1").replace(/,/g, ""));
}

function getShortAmount(token: string): number | null {
  const digitsOnly = token.replace(/\D/g, "");
  const amount = parseAmountToken(token);
  if (!Number.isFinite(amount) || amount <= 0 || digitsOnly.length > 4 || /^(19|20)\d{2}$/.test(digitsOnly)) {
    return null;
  }
  return amount;
}

export function extractPlanAmountFromOcr(text: string, planAmounts: readonly number[]): string {
  const normalized = normalizeArabicDigits(text);
  const amountToken = "\\d{1,4}(?:[.,]\\d{1,2})?";
  const labeledPatterns = [
    new RegExp(`(?:amount|المبلغ|قيمة(?:\\s+التحويل)?|value|total|الإجمالي)\\s*[:：]?\\s*(${amountToken})`, "i"),
    new RegExp(`(${amountToken})\\s*(?:sar|ر\\.س|ريال|sr)`, "i"),
  ];

  for (const pattern of labeledPatterns) {
    const match = normalized.match(pattern);
    const amount = match?.[1] ? getShortAmount(match[1]) : null;
    if (amount !== null) return String(amount);
  }

  const tokens = normalized.match(/\d[\d,]*(?:\.\d{1,2})?/g) ?? [];
  const values = tokens.map(parseAmountToken);
  const exact = values.find((value, index) => {
    const digitsOnly = tokens[index].replace(/\D/g, "");
    return digitsOnly.length <= 4 && planAmounts.includes(value);
  });
  if (exact !== undefined) return String(exact);

  for (const token of tokens) {
    if (!/^\d+$/.test(token) || token.length > 6) continue;
    const plan = planAmounts.find((amount) => {
      const digits = String(amount);
      return token.length > digits.length && token.length <= digits.length + 3 && token.startsWith(digits);
    });
    if (plan !== undefined) return String(plan);
  }

  const shortAmount = tokens.map(getShortAmount).find((amount): amount is number => amount !== null);
  return shortAmount !== undefined ? String(shortAmount) : "";
}
