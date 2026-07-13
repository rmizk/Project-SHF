import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { monthRange } from "@/lib/format";
import AchatsClient, { type Invoice, type Supplier } from "./AchatsClient";

export const metadata: Metadata = {
  title: "Achats — Comptéo",
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

export default async function AchatsPage({
  searchParams,
}: {
  searchParams: Promise<{ mois?: string; annee?: string }>;
}) {
  const params = await searchParams;
  const { month, year } = parseMonthYear(params.mois, params.annee);
  const { start, end } = monthRange(month, year);

  const supabase = await createClient();
  const [invoicesRes, suppliersRes] = await Promise.all([
    supabase
      .from("purchase_invoices")
      .select(
        "id, invoice_number, invoice_date, amount_ht, vat_rate, amount_ttc, attachment_path, supplier:suppliers(id, name)"
      )
      .gte("invoice_date", start)
      .lt("invoice_date", end)
      .order("invoice_date", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase.from("suppliers").select("id, name").order("name"),
  ]);

  const invoices = (invoicesRes.data ?? []) as unknown as Invoice[];
  const suppliers = (suppliersRes.data ?? []) as Supplier[];

  return (
    <AchatsClient
      invoices={invoices}
      suppliers={suppliers}
      month={month}
      year={year}
    />
  );
}
