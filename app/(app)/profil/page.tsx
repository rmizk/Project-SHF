import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganization } from "@/lib/organization";
import { toMillimes } from "@/lib/amounts";
import ProfilClient, { type CapitalEntry, type Category } from "./ProfilClient";

export const metadata: Metadata = {
  title: "Profil — Comptéo",
};

export default async function ProfilPage() {
  const organization = await getCurrentOrganization();
  if (!organization) redirect("/connexion");

  const supabase = await createClient();
  const [historyRes, categoriesRes] = await Promise.all([
    supabase
      .from("working_capital_history")
      .select("id, amount, created_at, effective_date")
      .order("effective_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(24),
    supabase.from("expense_categories").select("id, name").order("name"),
  ]);

  type CapitalRow = {
    id: string;
    amount: string | number;
    created_at: string;
    effective_date?: string | null;
  };

  // Repli transitoire tant que la migration « effective_date » n'est pas
  // appliquée : tri par date de création uniquement
  let historyData = historyRes.data as CapitalRow[] | null;
  if (historyRes.error) {
    const fallback = await supabase
      .from("working_capital_history")
      .select("id, amount, created_at")
      .order("created_at", { ascending: false })
      .limit(24);
    historyData = fallback.data as CapitalRow[] | null;
  }

  // Variation de chaque saisie par rapport à la précédente (en millimes)
  const rows = historyData ?? [];
  const history: CapitalEntry[] = rows.map((row, index) => {
    const previous = rows[index + 1];
    return {
      id: row.id,
      amount: String(row.amount),
      date: row.effective_date ?? String(row.created_at).slice(0, 10),
      deltaMillimes: previous
        ? toMillimes(row.amount) - toMillimes(previous.amount)
        : null,
    };
  });

  return (
    <ProfilClient
      history={history}
      categories={(categoriesRes.data ?? []) as Category[]}
    />
  );
}
