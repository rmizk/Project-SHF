import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { monthRange } from "@/lib/format";
import DepensesClient, { type Expense, type Category } from "./DepensesClient";

export const metadata: Metadata = {
  title: "Dépenses — Comptéo",
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

export default async function DepensesPage({
  searchParams,
}: {
  searchParams: Promise<{ mois?: string; annee?: string; ajouter?: string }>;
}) {
  const params = await searchParams;
  const { month, year } = parseMonthYear(params.mois, params.annee);
  const { start, end } = monthRange(month, year);

  const supabase = await createClient();
  const [expensesRes, categoriesRes] = await Promise.all([
    supabase
      .from("expenses")
      .select(
        "id, type, name, amount, expense_date, attachment_path, category:expense_categories(id, name)"
      )
      .gte("expense_date", start)
      .lt("expense_date", end)
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("expense_categories").select("id, name").order("name"),
  ]);

  const expenses = (expensesRes.data ?? []) as unknown as Expense[];
  const categories = (categoriesRes.data ?? []) as Category[];

  return (
    <DepensesClient
      expenses={expenses}
      categories={categories}
      month={month}
      year={year}
      initialModalOpen={params.ajouter === "1"}
    />
  );
}
