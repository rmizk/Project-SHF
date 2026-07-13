// Manipulation exacte des montants TND (numeric(14,3)) : jamais de float.
// Les calculs se font en millimes entiers, les montants circulent en chaînes
// normalisées « 1234.500 ».

// « 1 250,500 » / « 1250.5 » → « 1250.500 » ; null si invalide
export function parseAmount(raw: string): string | null {
  const normalized = raw
    .replace(/[\s  ]/g, "")
    .replace(",", ".");
  if (!/^\d+(\.\d{1,3})?$/.test(normalized)) return null;
  const [int, dec = ""] = normalized.split(".");
  return `${int}.${dec.padEnd(3, "0")}`;
}

// « 1250.500 » ou 1250.5 → 1250500 (millimes entiers)
export function toMillimes(amount: string | number): number {
  if (typeof amount === "number") return Math.round(amount * 1000);
  const [int, dec = ""] = amount.split(".");
  return Number(int) * 1000 + Number(dec.padEnd(3, "0") || 0);
}

// 1250500 → « 1250.500 » (signe conservé)
export function fromMillimes(millimes: number): string {
  const sign = millimes < 0 ? "-" : "";
  const abs = Math.abs(millimes);
  return `${sign}${Math.floor(abs / 1000)}.${String(abs % 1000).padStart(3, "0")}`;
}
