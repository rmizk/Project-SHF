import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  CreditCard,
  DollarSign,
  LineChart,
  Paperclip,
  ReceiptText,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  formatShortDate,
  formatTND,
  monthLabel,
  monthName,
  monthRange,
} from "@/lib/format";
import { fromMillimes, toMillimes } from "@/lib/amounts";
import StatusBadge, { type StatusVariant } from "@/components/StatusBadge";
import {
  PAYMENT_TYPE_META,
  PaymentTypeLabel,
  type PaymentType,
} from "@/components/PaymentTypeLabel";

export const metadata: Metadata = {
  title: "Tableau de bord — Comptéo",
};

// Σ (montant HT × taux/100) en millimes entiers, arrondi ligne par ligne
function sumVat(rows: { amount_ht: string | number; vat_rate: string | number }[]): number {
  return rows.reduce(
    (total, row) =>
      total + Math.round((toMillimes(row.amount_ht) * Number(row.vat_rate)) / 100),
    0
  );
}

// TTC exact en millimes : HT + TVA arrondie
function ttcMillimes(row: { amount_ht: string | number; vat_rate: string | number }): number {
  const ht = toMillimes(row.amount_ht);
  return ht + Math.round((ht * Number(row.vat_rate)) / 100);
}

const percentFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 1,
});

// « +8,2 % » / « −3,4 % » ; null si la base est nulle
function variationPercent(current: number, previous: number): string | null {
  if (previous === 0) return null;
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const sign = pct > 0 ? "+" : pct < 0 ? "−" : "";
  return `${sign}${percentFormatter.format(Math.abs(pct))} %`;
}

// Badge de variation : vert quand la variation est « bonne » (fond de
// roulement qui monte, dépenses qui baissent), rouge sinon.
function VariationBadge({
  current,
  previous,
  goodWhenUp,
}: {
  current: number;
  previous: number;
  goodWhenUp: boolean;
}) {
  const label = variationPercent(current, previous);
  if (!label) return null;
  const up = current >= previous;
  const good = up === goodWhenUp;
  const Icon = up ? ArrowUpRight : ArrowDownLeft;
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${
        good
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
          : "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400"
      }`}
    >
      <Icon size={13} />
      {label}
    </span>
  );
}

type Operation = {
  key: string;
  label: React.ReactNode;
  searchLabel: string;
  category: "Achats" | "Services" | "Comptabilité" | "Dépenses";
  date: string;
  createdAt: string;
  signedMillimes: number;
  badge: { variant: StatusVariant; label: string };
};

const CATEGORY_ICONS = {
  Achats: ReceiptText,
  Services: Paperclip,
  Comptabilité: CreditCard,
  Dépenses: DollarSign,
} as const;

function OperationIcon({ category }: { category: Operation["category"] }) {
  const Icon = CATEGORY_ICONS[category];
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
      <Icon size={17} />
    </span>
  );
}

// Montant signé : « +18 900,000 » / « −5 120,000 »
function signedTND(millimes: number): string {
  const sign = millimes < 0 ? "−" : "+";
  return `${sign}${formatTND(fromMillimes(Math.abs(millimes)))}`;
}

export default async function TableauDeBordPage() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const { start, end } = monthRange(month, year);

  // Fenêtre de 6 mois pour le mini-graphe des dépenses
  const graphMonths: { month: number; year: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1);
    graphMonths.push({ month: d.getMonth() + 1, year: d.getFullYear() });
  }
  const graphStart = monthRange(graphMonths[0].month, graphMonths[0].year).start;

  const supabase = await createClient();
  const [capitalRes, attachementsRes, invoicesRes, creditRes, paymentsRes, expensesRes] =
    await Promise.all([
      supabase
        .from("working_capital_history")
        .select("amount, created_at, effective_date")
        .order("effective_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("attachements")
        .select(
          "id, amount_ht, vat_rate, attachement_date, status, created_at, client:clients(name)"
        )
        .gte("attachement_date", start)
        .lt("attachement_date", end),
      supabase
        .from("purchase_invoices")
        .select(
          "id, invoice_number, invoice_date, amount_ht, vat_rate, created_at, supplier:suppliers(name)"
        )
        .gte("invoice_date", start)
        .lt("invoice_date", end),
      supabase.from("vat_credits").select("amount").eq("period", start).maybeSingle(),
      supabase
        .from("accounting_payments")
        .select("id, type, amount, payment_date, status, created_at")
        .gte("payment_date", start)
        .lt("payment_date", end),
      supabase
        .from("expenses")
        .select("id, name, amount, expense_date, created_at")
        .gte("expense_date", graphStart)
        .lt("expense_date", end),
    ]);

  type Row = { amount_ht: string | number; vat_rate: string | number };
  const attachements = (attachementsRes.data ?? []) as unknown as (Row & {
    id: string;
    attachement_date: string;
    status: "pending" | "paid";
    created_at: string;
    client: { name: string };
  })[];
  const invoices = (invoicesRes.data ?? []) as unknown as (Row & {
    id: string;
    invoice_number: string;
    invoice_date: string;
    created_at: string;
    supplier: { name: string };
  })[];
  const payments = (paymentsRes.data ?? []) as {
    id: string;
    type: PaymentType;
    amount: string | number;
    payment_date: string;
    status: "to_pay" | "paid";
    created_at: string;
  }[];
  const expenses = (expensesRes.data ?? []) as {
    id: string;
    name: string;
    amount: string | number;
    expense_date: string;
    created_at: string;
  }[];

  // --- Carte 1 : fond de roulement (dernière saisie par date d'effet +
  // comparaison avec la dernière saisie antérieure au mois courant).
  // Repli transitoire par date de création si la migration
  // « effective_date » n'est pas encore appliquée.
  let capitalRows = (capitalRes.data ?? []) as {
    amount: string | number;
    created_at: string;
    effective_date?: string | null;
  }[];
  if (capitalRes.error) {
    const fallback = await supabase
      .from("working_capital_history")
      .select("amount, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    capitalRows = (fallback.data ?? []) as typeof capitalRows;
  }
  const capitalDate = (r: (typeof capitalRows)[number]) =>
    r.effective_date ?? String(r.created_at).slice(0, 10);
  const currentCapital = capitalRows[0] ? toMillimes(capitalRows[0].amount) : null;
  const previousCapitalRow = capitalRows.find((r) => capitalDate(r) < start);
  const previousCapital = previousCapitalRow ? toMillimes(previousCapitalRow.amount) : null;

  // --- Carte 2 : TVA du mois (règle métier n°4, en millimes entiers) ----
  const collected = sumVat(attachements);
  const deductible = sumVat(invoices);
  const credit = creditRes.data ? toMillimes(creditRes.data.amount) : 0;
  const vatDue = collected - deductible - credit;
  const lastDay = new Date(year, month, 0).getDate();
  const daysLeft = lastDay - now.getDate();
  const monthProgress = Math.min(100, Math.round((now.getDate() / lastDay) * 100));
  const deadlineLabel = formatShortDate(
    `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`
  );

  // --- Carte 3 : attachements en attente du mois ------------------------
  const pending = attachements.filter((a) => a.status === "pending");
  const pendingTotal = pending.reduce((t, a) => t + ttcMillimes(a), 0);

  // --- Carte 4 : dépenses du mois + mini-graphe sur 6 mois ---------------
  const expensesByMonth = new Map<string, number>();
  for (const e of expenses) {
    const key = e.expense_date.slice(0, 7);
    expensesByMonth.set(key, (expensesByMonth.get(key) ?? 0) + toMillimes(e.amount));
  }
  const graphTotals = graphMonths.map(({ month: m, year: y }) => ({
    label: monthName(m),
    total: expensesByMonth.get(`${y}-${String(m).padStart(2, "0")}`) ?? 0,
  }));
  const expensesTotal = graphTotals[5].total;
  const expensesPrevious = graphTotals[4].total;
  const graphMax = Math.max(...graphTotals.map((g) => g.total), 1);

  // --- Dernières opérations : agrégation des 4 modules -------------------
  const operations: Operation[] = [
    ...attachements.map((a): Operation => ({
      key: `att-${a.id}`,
      label: `Attachement — ${a.client.name}`,
      searchLabel: `Attachement — ${a.client.name}`,
      category: "Services",
      date: a.attachement_date,
      createdAt: a.created_at,
      signedMillimes: ttcMillimes(a),
      badge:
        a.status === "paid"
          ? { variant: "success", label: "Payé" }
          : { variant: "warning", label: "En attente" },
    })),
    ...invoices.map((i): Operation => ({
      key: `inv-${i.id}`,
      label: `Facture ${i.invoice_number} — ${i.supplier.name}`,
      searchLabel: `Facture ${i.invoice_number} — ${i.supplier.name}`,
      category: "Achats",
      date: i.invoice_date,
      createdAt: i.created_at,
      signedMillimes: -ttcMillimes(i),
      badge: { variant: "neutral", label: "Enregistrée" },
    })),
    ...payments.map((p): Operation => {
      const [y, m] = p.payment_date.split("-").map(Number);
      const label =
        p.type === "tva" ? (
          `TVA ${monthName(m).toLowerCase()} ${y}`
        ) : (
          <PaymentTypeLabel type={p.type} />
        );
      return {
        key: `pay-${p.id}`,
        label,
        searchLabel: PAYMENT_TYPE_META[p.type].label,
        category: "Comptabilité",
        date: p.payment_date,
        createdAt: p.created_at,
        signedMillimes: -toMillimes(p.amount),
        badge:
          p.status === "paid"
            ? { variant: "success", label: "Payé" }
            : { variant: "warning", label: "À payer" },
      };
    }),
    ...expenses
      .filter((e) => e.expense_date >= start)
      .map((e): Operation => ({
        key: `exp-${e.id}`,
        label: e.name,
        searchLabel: e.name,
        category: "Dépenses",
        date: e.expense_date,
        createdAt: e.created_at,
        signedMillimes: -toMillimes(e.amount),
        badge: { variant: "success", label: "Réglé" },
      })),
  ]
    .sort((a, b) =>
      a.date === b.date
        ? b.createdAt.localeCompare(a.createdAt)
        : b.date.localeCompare(a.date)
    )
    .slice(0, 6);

  const cardClass =
    "rounded-2xl bg-white p-5 shadow-sm shadow-neutral-900/5 dark:bg-card-dark";
  const cardTitle = "text-sm font-semibold text-neutral-500 dark:text-neutral-400";

  return (
    <div className="mx-auto max-w-6xl">
      {/* En-tête mobile (le titre bureau est dans la TopBar) */}
      <div className="mb-4 lg:hidden">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {monthLabel(month, year)}
        </p>
        <h1 className="text-2xl font-extrabold">Tableau de bord</h1>
      </div>

      {/* Fond de roulement — carte sombre sur mobile (fidèle au screen) */}
      <section className="relative overflow-hidden rounded-2xl bg-neutral-900 p-5 text-white lg:hidden dark:bg-neutral-950">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold text-neutral-300">Fond de roulement</p>
          {currentCapital !== null && previousCapital !== null && (
            <VariationBadge
              current={currentCapital}
              previous={previousCapital}
              goodWhenUp
            />
          )}
        </div>
        <p className="mt-2 text-3xl font-extrabold tracking-tight">
          {currentCapital !== null ? formatTND(fromMillimes(currentCapital)) : "—"}
          <span className="ml-1.5 text-base font-bold text-neutral-400">TND</span>
        </p>
      </section>

      {/* Les 4 cartes (bureau) / cartes restantes (mobile) */}
      <div className="mt-3 grid grid-cols-2 gap-3 lg:mt-0 lg:grid-cols-4 lg:gap-4">
        {/* Fond de roulement (bureau) */}
        <section className={`${cardClass} hidden lg:block`}>
          <div className="flex items-start justify-between gap-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <LineChart size={19} />
            </span>
            {currentCapital !== null && previousCapital !== null && (
              <VariationBadge
                current={currentCapital}
                previous={previousCapital}
                goodWhenUp
              />
            )}
          </div>
          <p className={`mt-4 ${cardTitle}`}>Fond de roulement</p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight">
            {currentCapital !== null ? formatTND(fromMillimes(currentCapital)) : "—"}
            <span className="ml-1 text-sm font-bold text-neutral-400">TND</span>
          </p>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            {previousCapital !== null
              ? `vs ${formatTND(fromMillimes(previousCapital))} le mois dernier`
              : "Modifiable depuis la page Profil"}
          </p>
        </section>

        {/* TVA à payer ce mois */}
        <section className={cardClass}>
          <div className="flex items-start justify-between gap-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500 dark:bg-orange-950/50">
              <CreditCard size={19} />
            </span>
            <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-600 dark:bg-orange-950/50 dark:text-orange-400">
              <CalendarClock size={13} />
              {deadlineLabel}
            </span>
          </div>
          <p className={`mt-4 ${cardTitle}`}>
            {vatDue < 0 ? "Crédit de TVA ce mois" : "TVA à payer ce mois"}
          </p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight">
            {formatTND(fromMillimes(Math.abs(vatDue)))}
            <span className="ml-1 text-sm font-bold text-neutral-400">TND</span>
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <div
              className="h-full rounded-full bg-orange-500"
              style={{ width: `${monthProgress}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Déclaration à déposer sous {daysLeft} jour{daysLeft > 1 ? "s" : ""}
          </p>
        </section>

        {/* Attachements en attente */}
        <section className={cardClass}>
          <div className="flex items-start justify-between gap-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Paperclip size={19} />
            </span>
            {pending.length > 0 && (
              <span className="whitespace-nowrap rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-500 dark:bg-red-950/50 dark:text-red-400">
                À traiter
              </span>
            )}
          </div>
          <p className={`mt-4 ${cardTitle}`}>Attachements en attente</p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight">
            {pending.length}
            <span className="ml-1.5 text-sm font-bold text-neutral-400">
              document{pending.length > 1 ? "s" : ""}
            </span>
          </p>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            {pending.length > 0
              ? `${formatTND(fromMillimes(pendingTotal))} TND à encaisser ce mois`
              : "Aucun attachement à traiter ce mois"}
          </p>
        </section>

        {/* Dépenses du mois */}
        <section className={`${cardClass} col-span-2 lg:col-span-1`}>
          <div className="flex items-start justify-between gap-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-500 dark:bg-red-950/50">
              <DollarSign size={19} />
            </span>
            <VariationBadge
              current={expensesTotal}
              previous={expensesPrevious}
              goodWhenUp={false}
            />
          </div>
          <p className={`mt-4 ${cardTitle}`}>Dépenses du mois</p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight">
            {formatTND(fromMillimes(expensesTotal))}
            <span className="ml-1 text-sm font-bold text-neutral-400">TND</span>
          </p>
          {/* Mini-graphe : 6 derniers mois, mois courant en surbrillance */}
          <div className="mt-3 flex h-12 items-end gap-1.5" aria-hidden>
            {graphTotals.map((g, index) => (
              <div
                key={`${g.label}-${index}`}
                title={`${g.label} : ${formatTND(fromMillimes(g.total))} TND`}
                className={`flex-1 rounded-md ${
                  index === 5 ? "bg-brand" : "bg-neutral-100 dark:bg-neutral-800"
                }`}
                style={{ height: `${Math.max(12, Math.round((g.total / graphMax) * 100))}%` }}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Dernières opérations */}
      <section className="mt-6 rounded-2xl bg-white shadow-sm shadow-neutral-900/5 dark:bg-card-dark">
        <div className="flex items-center justify-between px-5 pt-5 lg:px-6">
          <h2 className="text-lg font-extrabold">Dernières opérations</h2>
        </div>

        {operations.length === 0 ? (
          <p className="px-5 pb-6 pt-3 text-neutral-500 lg:px-6 dark:text-neutral-400">
            Aucune opération enregistrée pour {monthName(month).toLowerCase()} {year}.
          </p>
        ) : (
          <>
            {/* Bureau : tableau */}
            <div className="mt-2 hidden overflow-x-auto pb-2 lg:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:border-neutral-800">
                    <th className="px-6 py-3">Libellé</th>
                    <th className="px-6 py-3">Catégorie</th>
                    <th className="px-6 py-3 text-right">Montant</th>
                    <th className="px-6 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {operations.map((op) => (
                    <tr
                      key={op.key}
                      className="border-b border-neutral-100 last:border-b-0 dark:border-neutral-800"
                    >
                      <td className="px-6 py-3.5">
                        <span className="flex items-center gap-3">
                          <OperationIcon category={op.category} />
                          <span>
                            <span className="block font-bold">{op.label}</span>
                            <span className="block text-neutral-500 dark:text-neutral-400">
                              {formatShortDate(op.date)} {op.date.slice(0, 4)}
                            </span>
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-neutral-500 dark:text-neutral-400">
                        {op.category}
                      </td>
                      <td className="px-6 py-3.5 text-right font-bold">
                        {signedTND(op.signedMillimes)}
                      </td>
                      <td className="px-6 py-3.5">
                        <StatusBadge variant={op.badge.variant}>
                          {op.badge.label}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile : cartes */}
            <ul className="mt-2 divide-y divide-neutral-100 px-4 pb-4 lg:hidden dark:divide-neutral-800">
              {operations.map((op) => (
                <li key={op.key} className="flex items-center gap-3 py-3">
                  <OperationIcon category={op.category} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{op.label}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {op.category}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <p className="font-bold">{signedTND(op.signedMillimes)}</p>
                    <p
                      className={`text-sm font-bold ${
                        op.badge.variant === "success"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : op.badge.variant === "warning"
                            ? "text-orange-500"
                            : "text-neutral-500 dark:text-neutral-400"
                      }`}
                    >
                      {op.badge.label}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* Actions rapides mobile : vers les modals des modules */}
      <div className="mt-5 grid grid-cols-3 gap-2.5 pb-4 lg:hidden">
        {(
          [
            { href: "/achats?ajouter=1", label: "+ Facture" },
            { href: "/services?ajouter=1", label: "+ Attachement" },
            { href: "/depenses?ajouter=1", label: "+ Dépense" },
          ] as const
        ).map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex h-12 items-center justify-center rounded-xl bg-white text-sm font-bold text-brand shadow-sm shadow-neutral-900/5 transition-colors hover:bg-brand/5 dark:bg-card-dark"
          >
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
