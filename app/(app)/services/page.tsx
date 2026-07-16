import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { monthRange } from "@/lib/format";
import ServicesClient, { type Attachement, type Client } from "./ServicesClient";

export const metadata: Metadata = {
  title: "Services — Comptéo",
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

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ mois?: string; annee?: string; ajouter?: string }>;
}) {
  const params = await searchParams;
  const { month, year } = parseMonthYear(params.mois, params.annee);
  const { start, end } = monthRange(month, year);

  const supabase = await createClient();
  const [attachementsRes, clientsRes] = await Promise.all([
    supabase
      .from("attachements")
      .select(
        "id, amount_ht, vat_rate, attachement_date, status, paid_at, net_profit, client:clients(id, name), deductions:attachement_deductions(id, label, amount)"
      )
      .gte("attachement_date", start)
      .lt("attachement_date", end)
      .order("attachement_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("id, name").order("name"),
  ]);

  const attachements = (attachementsRes.data ?? []) as unknown as Attachement[];
  const clients = (clientsRes.data ?? []) as Client[];

  return (
    <ServicesClient
      attachements={attachements}
      clients={clients}
      month={month}
      year={year}
      initialAddOpen={params.ajouter === "1"}
    />
  );
}
