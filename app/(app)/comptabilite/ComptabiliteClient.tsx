"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { ChevronDown, CreditCard, Loader2, Plus, Search } from "lucide-react";
import MonthYearFilter from "@/components/MonthYearFilter";
import DataTable, { type Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Fab } from "@/components/Fab";
import { usePersistedBoolean } from "@/lib/use-persisted-boolean";
import {
  PAYMENT_TYPE_META,
  PaymentTypeLabel,
  type PaymentType,
} from "@/components/PaymentTypeLabel";
import { formatShortDate, formatTND, monthLabel, monthName } from "@/lib/format";
import { saveVatCredit, type VatCreditState } from "./actions";
import AddPaymentModal from "./AddPaymentModal";

export type Payment = {
  id: string;
  type: PaymentType;
  amount: number | string;
  payment_date: string;
  status: "to_pay" | "paid";
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function TypeIcon({ type }: { type: PaymentType }) {
  const Icon = PAYMENT_TYPE_META[type].icon;
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
      <Icon size={17} />
    </span>
  );
}

// Nom affiché dans la liste : le paiement TVA porte son mois (« TVA février 2026 »)
function paymentDisplayName(payment: Payment): React.ReactNode {
  if (payment.type === "tva") {
    const [y, m] = payment.payment_date.split("-").map(Number);
    return `TVA ${monthName(m).toLowerCase()} ${y}`;
  }
  return <PaymentTypeLabel type={payment.type} />;
}

function paymentSearchText(payment: Payment): string {
  const meta = PAYMENT_TYPE_META[payment.type];
  if (payment.type === "tva") {
    const [y, m] = payment.payment_date.split("-").map(Number);
    return `tva ${monthName(m)} ${y}`;
  }
  return `${meta.label} ${meta.suffix ?? ""}`;
}

function PaymentStatusBadge({ status }: { status: Payment["status"] }) {
  return status === "paid" ? (
    <StatusBadge variant="success">Payé</StatusBadge>
  ) : (
    <StatusBadge variant="warning">À payer</StatusBadge>
  );
}

// Carte « TVA du mois » : équation collectée − déductible − crédit = à payer
function VatCard({
  month,
  year,
  vatCollected,
  vatDeductible,
  vatCredit,
  vatDue,
  vatDeclared,
}: {
  month: number;
  year: number;
  vatCollected: string;
  vatDeductible: string;
  vatCredit: string | null;
  vatDue: string;
  vatDeclared: boolean;
}) {
  const [creditState, creditAction, creditPending] = useActionState<
    VatCreditState,
    FormData
  >(saveVatCredit, {});
  const formRef = useRef<HTMLFormElement>(null);
  const initialCredit = vatCredit && Number(vatCredit) !== 0 ? formatTND(vatCredit) : "";
  const [creditValue, setCreditValue] = useState(initialCredit);
  const savedValue = useRef(initialCredit);

  const isCredit = Number(vatDue) < 0;
  const lastDay = new Date(year, month, 0).getDate();

  const termBox =
    "flex-1 rounded-2xl bg-neutral-50 px-5 py-4 dark:bg-neutral-800/60";
  const termLabel = "text-sm text-neutral-500 dark:text-neutral-400";
  const termValue = "mt-1 text-2xl font-extrabold tracking-tight";
  const operator =
    "self-center text-xl font-extrabold text-neutral-300 dark:text-neutral-600";

  function submitIfChanged() {
    if (creditValue.trim() !== savedValue.current.trim()) {
      savedValue.current = creditValue;
      formRef.current?.requestSubmit();
    }
  }

  // Section repliable, repliée par défaut, état mémorisé (mobile et bureau)
  const [open, setOpen] = usePersistedBoolean("compteo.tva-mois.ouvert", false);

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm shadow-neutral-900/5 sm:p-7 dark:bg-card-dark">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-4 text-left"
      >
        <span className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <CreditCard size={20} />
          </span>
          <span>
            <span className="block text-lg font-extrabold">TVA du mois</span>
            <span className="block text-sm text-neutral-500 dark:text-neutral-400">
              {monthLabel(month, year)} · déclaration au {lastDay}{" "}
              {formatShortDate(`${year}-${String(month).padStart(2, "0")}-01`).split(" ")[1]}
            </span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {vatDeclared ? (
            <StatusBadge variant="success">Déposée</StatusBadge>
          ) : (
            <StatusBadge variant="warning">À déposer</StatusBadge>
          )}
          <ChevronDown
            size={20}
            aria-hidden
            className={`text-neutral-400 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>

      <div className={open ? "" : "hidden"}>
      {/* Équation visuelle */}
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:gap-4">
        <div className={termBox}>
          <p className={termLabel}>TVA collectée</p>
          <p className={termValue}>{formatTND(vatCollected)}</p>
        </div>
        <span className={operator}>−</span>
        <div className={termBox}>
          <p className={termLabel}>TVA déductible</p>
          <p className={termValue}>{formatTND(vatDeductible)}</p>
        </div>
        <span className={operator}>−</span>
        <div className={termBox}>
          <p className={termLabel}>Crédit de TVA</p>
          <p className={`${termValue} text-brand`}>
            {formatTND(vatCredit ?? 0)}
          </p>
        </div>
        <span className={operator}>=</span>
        <div className="flex-1 rounded-2xl bg-neutral-900 px-5 py-4 text-white dark:bg-neutral-950">
          <p className="text-sm text-neutral-400">
            {isCredit ? "Crédit de TVA" : "TVA à payer"}
          </p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight">
            {formatTND(Math.abs(Number(vatDue)))}
            <span className="ml-1.5 text-sm font-bold text-neutral-400">TND</span>
          </p>
        </div>
      </div>

      {/* Crédit de TVA à reporter : saisie manuelle, unique par mois */}
      <div className="mt-6 flex flex-col gap-3 border-t border-neutral-100 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
        <div>
          <h3 className="font-bold">Crédit de TVA à reporter</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Reporté du mois précédent, déduit du montant à payer.
          </p>
        </div>
        <form
          ref={formRef}
          action={creditAction}
          onSubmit={() => {
            savedValue.current = creditValue;
          }}
          className="flex items-center gap-3"
        >
          <input type="hidden" name="month" value={month} />
          <input type="hidden" name="year" value={year} />
          <div className="relative w-full sm:w-56">
            <input
              name="amount"
              value={creditValue}
              onChange={(e) => setCreditValue(e.target.value)}
              onBlur={submitIfChanged}
              inputMode="decimal"
              placeholder="0,000"
              aria-label="Crédit de TVA à reporter"
              className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 pr-14 text-right text-sm font-bold outline-none transition-colors focus:border-brand focus:bg-white dark:border-neutral-700 dark:bg-neutral-900 dark:focus:bg-neutral-900"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-neutral-500">
              {creditPending ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                "TND"
              )}
            </span>
          </div>
        </form>
      </div>
      {creditState.error && (
        <p role="alert" className="mt-2 text-right text-sm text-red-600 dark:text-red-400">
          {creditState.error}
        </p>
      )}
      </div>
    </section>
  );
}

export default function ComptabiliteClient({
  month,
  year,
  vatCollected,
  vatDeductible,
  vatCredit,
  vatDue,
  vatDeclared,
  payments,
}: {
  month: number;
  year: number;
  vatCollected: string;
  vatDeductible: string;
  vatCredit: string | null;
  vatDue: string;
  vatDeclared: boolean;
  payments: Payment[];
}) {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = normalize(search.trim());
    if (!q) return payments;
    return payments.filter((p) => normalize(paymentSearchText(p)).includes(q));
  }, [payments, search]);

  const columns: Column<Payment>[] = [
    {
      key: "type",
      header: "Type",
      render: (p) => (
        <span className="flex items-center gap-3">
          <TypeIcon type={p.type} />
          <span className="font-bold">{paymentDisplayName(p)}</span>
        </span>
      ),
    },
    {
      key: "amount",
      header: "Montant",
      headerClassName: "text-right",
      className: "text-right font-bold",
      render: (p) => formatTND(p.amount),
    },
    {
      key: "date",
      header: "Date",
      className: "text-neutral-500 dark:text-neutral-400",
      render: (p) => formatShortDate(p.payment_date),
    },
    {
      key: "status",
      header: "État",
      render: (p) => <PaymentStatusBadge status={p.status} />,
    },
  ];

  const emptySearch = search.trim().length > 0;

  return (
    <div className="mx-auto max-w-6xl">
      {/* Barre d'outils des paiements */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <h2 className="text-xl font-extrabold lg:flex-1">Paiements</h2>
        <div className="flex items-center gap-3">
          <MonthYearFilter month={month} year={year} />
          <label className="relative min-w-0 flex-1 lg:w-64">
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="h-12 w-full rounded-xl bg-white pl-11 pr-4 text-sm shadow-sm shadow-neutral-900/5 outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-brand/40 dark:bg-card-dark"
            />
          </label>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="hidden h-12 shrink-0 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white transition-colors hover:bg-brand-hover lg:flex"
          >
            <Plus size={18} />
            Ajouter un paiement
          </button>
        </div>
      </div>

      {/* Liste */}
      <div className="mt-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-16 text-center shadow-sm shadow-neutral-900/5 dark:bg-card-dark">
            <span className="flex h-24 w-24 items-center justify-center rounded-3xl bg-neutral-100 dark:bg-neutral-800">
              <CreditCard size={36} className="text-neutral-400" />
            </span>
            {emptySearch ? (
              <>
                <h2 className="mt-6 text-xl font-extrabold">Aucun résultat</h2>
                <p className="mt-2 max-w-md text-neutral-500 dark:text-neutral-400">
                  Aucun paiement ne correspond à «&nbsp;{search.trim()}&nbsp;»
                  pour ce mois.
                </p>
              </>
            ) : (
              <>
                <h2 className="mt-6 text-xl font-extrabold">
                  Aucun paiement ce mois
                </h2>
                <p className="mt-2 max-w-md text-neutral-500 dark:text-neutral-400">
                  Aucune échéance fiscale ou sociale n&apos;a été enregistrée
                  pour {monthName(month).toLowerCase()} {year}.
                </p>
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="mt-7 flex h-12 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white transition-colors hover:bg-brand-hover"
                >
                  <Plus size={18} />
                  Ajouter un paiement
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Bureau : tableau */}
            <div className="hidden lg:block">
              <DataTable
                columns={columns}
                rows={filtered}
                rowKey={(p) => p.id}
              />
            </div>

            {/* Mobile : cartes */}
            <ul className="space-y-3 lg:hidden">
              {filtered.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm shadow-neutral-900/5 dark:bg-card-dark"
                >
                  <TypeIcon type={p.type} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{paymentDisplayName(p)}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {formatShortDate(p.payment_date)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="font-bold">{formatTND(p.amount)}</p>
                    <PaymentStatusBadge status={p.status} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* TVA du mois : sous la liste, repliable */}
      <div className="mt-6 pb-20 lg:pb-0">
        <VatCard
          month={month}
          year={year}
          vatCollected={vatCollected}
          vatDeductible={vatDeductible}
          vatCredit={vatCredit}
          vatDue={vatDue}
          vatDeclared={vatDeclared}
        />
      </div>

      {/* Mobile : FAB d'ajout au-dessus de la bottom nav */}
      <Fab label="Ajouter un paiement" onClick={() => setModalOpen(true)} />
      {modalOpen && (
        <AddPaymentModal
          month={month}
          year={year}
          vatDue={vatDue}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
