export function normalizeArabicDigits(text: string): string {
  return text.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

function parseAmountToken(token: string): number {
  return Number(token.replace(/,(\d{1,2})$/, ".$1").replace(/,/g, ""));
}

export function extractPlanAmountFromOcr(text: string, planAmounts: readonly number[]): string {
  const tokens = normalizeArabicDigits(text).match(/\d[\d,]*(?:\.\d{1,2})?/g) ?? [];
  const values = tokens.map(parseAmountToken);
  const exact = values.find((value) => planAmounts.includes(value));
  if (exact !== undefined) return String(exact);
  for (const token of tokens) {
    if (!/^\d+$/.test(token)) continue;
    const plan = planAmounts.find((amount) => {
      const digits = String(amount);
      return token.length > digits.length && token.length <= digits.length + 3 && token.startsWith(digits);
    });
    if (plan !== undefined) return String(plan);
  }
  const fallback = values.find((value) => value > 0);
  return fallback !== undefined ? String(fallback) : "";
}
