import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { monthRange } from "@/lib/format";
import { fromMillimes, toMillimes } from "@/lib/amounts";
import ComptabiliteClient, { type Payment } from "./ComptabiliteClient";

export const metadata: Metadata = {
  title: "Comptabilité — Comptéo",
};

function parseMonthYear(mois?: string, annee?: string): {
  month: number;
  year: number;
} {
  const now = new Date();
  const month = Number(mois);
  const year = Number(annee);
  return {
    month: Number.isInteger(month) && month >= 1 && month <= 12
      ? month
      : now.getMonth() + 1,
    year: Number.isInteger(year) && year >= 2000 && year <= 2100
      ? year
      : now.getFullYear(),
  };
}

// Σ (montant HT × taux/100) en millimes entiers, arrondi ligne par ligne
function sumVat(rows: { amount_ht: string | number; vat_rate: string | number }[]): number {
  return rows.reduce(
    (total, row) =>
      total + Math.round((toMillimes(row.amount_ht) * Number(row.vat_rate)) / 100),
    0
  );
}

export default async function ComptabilitePage({
  searchParams,
}: {
  searchParams: Promise<{ mois?: string; annee?: string }>;
}) {
  const params = await searchParams;
  const { month, year } = parseMonthYear(params.mois, params.annee);
  const { start, end } = monthRange(month, year);

  const supabase = await createClient();
  const [attachementsRes, invoicesRes, creditRes, paymentsRes] =
    await Promise.all([
      supabase
        .from("attachements")
        .select("amount_ht, vat_rate")
        .gte("attachement_date", start)
        .lt("attachement_date", end),
      supabase
        .from("purchase_invoices")
        .select("amount_ht, vat_rate")
        .gte("invoice_date", start)
        .lt("invoice_date", end),
      supabase
        .from("vat_credits")
        .select("amount")
        .eq("period", start)
        .maybeSingle(),
      supabase
        .from("accounting_payments")
        .select("id, type, amount, payment_date, status")
        .gte("payment_date", start)
        .lt("payment_date", end)
        .order("payment_date", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);

  // Règle métier n°4 : TVA du mois = collectée − déductible − crédit saisi.
  // Calcul côté serveur, en millimes entiers.
  const collectedMillimes = sumVat(attachementsRes.data ?? []);
  const deductibleMillimes = sumVat(invoicesRes.data ?? []);
  const creditMillimes = creditRes.data ? toMillimes(creditRes.data.amount) : 0;
  const dueMillimes = collectedMillimes - deductibleMillimes - creditMillimes;

  const payments = (paymentsRes.data ?? []) as Payment[];
  // « Déposée » dès qu'un paiement TVA du mois est marqué Payé
  const vatDeclared = payments.some((p) => p.type === "tva" && p.status === "paid");

  return (
    <ComptabiliteClient
      month={month}
      year={year}
      vatCollected={fromMillimes(collectedMillimes)}
      vatDeductible={fromMillimes(deductibleMillimes)}
      vatCredit={creditRes.data ? String(creditRes.data.amount) : null}
      vatDue={fromMillimes(dueMillimes)}
      vatDeclared={vatDeclared}
      payments={payments}
    />
  );
}
