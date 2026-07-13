// Formats d'affichage français (TND 3 décimales, dates courtes, mois)

const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
] as const;

const MONTHS_SHORT = [
  "janv.",
  "fév.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
] as const;

const tndFormatter = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

// « 1 234,567 » — les montants arrivent de PostgreSQL en number ou string
export function formatTND(amount: number | string): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(value)) return "—";
  return tndFormatter.format(value);
}

// « 19 % » (vat_rate stocké en numeric(4,2) : 19.00)
export function formatVatRate(rate: number | string): string {
  return `${Number(rate)} %`;
}

// « 03 fév. » pour une date ISO « 2026-02-03 »
export function formatShortDate(isoDate: string): string {
  const [, month, day] = isoDate.split("-");
  const m = MONTHS_SHORT[Number(month) - 1];
  return m ? `${day} ${m}` : isoDate;
}

// « Février 2026 » (month : 1-12)
export function monthLabel(month: number, year: number): string {
  return `${MONTHS[month - 1]} ${year}`;
}

export function monthName(month: number): string {
  return MONTHS[month - 1] ?? "";
}

// Bornes ISO du mois : [début, début du mois suivant)
export function monthRange(month: number, year: number): {
  start: string;
  end: string;
} {
  const pad = (n: number) => String(n).padStart(2, "0");
  const start = `${year}-${pad(month)}-01`;
  const end =
    month === 12 ? `${year + 1}-01-01` : `${year}-${pad(month + 1)}-01`;
  return { start, end };
}
