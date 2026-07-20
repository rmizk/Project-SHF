"use client";

import { useMemo, useState } from "react";
import {
  FileText,
  Paperclip,
  Pencil,
  Plus,
  Search,
  Trash2,
  User,
  Wallet,
} from "lucide-react";
import MonthYearFilter from "@/components/MonthYearFilter";
import DataTable, { type Column } from "@/components/DataTable";
import RowActionsMenu from "@/components/RowActionsMenu";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Fab } from "@/components/Fab";
import { formatShortDate, formatTND, monthName } from "@/lib/format";
import AddExpenseModal from "./AddExpenseModal";
import { deleteExpense } from "./actions";

export type ExpenseType = "with_invoice" | "without_invoice" | "personal";

export type Category = { id: string; name: string };

export type Expense = {
  id: string;
  type: ExpenseType;
  name: string;
  amount: number | string;
  expense_date: string;
  attachment_path: string | null;
  category: { id: string; name: string };
};

export const TYPE_LABELS: Record<ExpenseType, string> = {
  with_invoice: "Avec facture",
  without_invoice: "Sans facture",
  personal: "Particulier",
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// Badges des 3 types : « Avec facture » bleu, « Sans facture » gris,
// « Particulier » orange en pointillé (marquage visuel demandé par le PRD).
function TypeBadge({ type }: { type: ExpenseType }) {
  if (type === "with_invoice") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand/10 px-3 py-1.5 text-sm font-bold text-brand">
        <FileText size={14} />
        {TYPE_LABELS.with_invoice}
      </span>
    );
  }
  if (type === "without_invoice") {
    return (
      <span className="inline-flex items-center rounded-lg bg-neutral-100 px-3 py-1.5 text-sm font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
        {TYPE_LABELS.without_invoice}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-orange-400 bg-orange-50 px-3 py-1.5 text-sm font-bold text-orange-600 dark:border-orange-500/60 dark:bg-orange-950/40 dark:text-orange-400">
      <User size={14} />
      {TYPE_LABELS.personal}
    </span>
  );
}

function AttachmentButton({ expense }: { expense: Expense }) {
  if (!expense.attachment_path) {
    return (
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-100 text-neutral-400 lg:h-9 lg:w-9 dark:bg-neutral-800">
        —
      </span>
    );
  }
  return (
    <a
      href={`/depenses/piece/${expense.id}`}
      target="_blank"
      rel="noopener"
      aria-label={`Pièce jointe de la dépense ${expense.name}`}
      className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand/10 text-brand transition-colors hover:bg-brand/20 lg:h-9 lg:w-9"
    >
      <Paperclip size={16} />
    </a>
  );
}

export default function DepensesClient({
  expenses,
  categories,
  month,
  year,
  initialModalOpen = false,
}: {
  expenses: Expense[];
  categories: Category[];
  month: number;
  year: number;
  initialModalOpen?: boolean;
}) {
  const [search, setSearch] = useState("");
  // Ouvert d'emblée depuis les actions rapides du tableau de bord (?ajouter=1)
  const [modalOpen, setModalOpen] = useState(initialModalOpen);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);

  const filtered = useMemo(() => {
    const q = normalize(search.trim());
    if (!q) return expenses;
    return expenses.filter(
      (exp) =>
        normalize(exp.name).includes(q) ||
        normalize(exp.category.name).includes(q) ||
        normalize(TYPE_LABELS[exp.type]).includes(q)
    );
  }, [expenses, search]);

  const columns: Column<Expense>[] = [
    {
      key: "name",
      header: "Nom",
      className: "font-bold",
      render: (exp) => exp.name,
    },
    {
      key: "category",
      header: "Catégorie",
      className: "text-neutral-600 dark:text-neutral-300",
      render: (exp) => exp.category.name,
    },
    {
      key: "type",
      header: "Type",
      render: (exp) => <TypeBadge type={exp.type} />,
    },
    {
      key: "amount",
      header: "Montant",
      headerClassName: "text-right",
      className: "text-right font-bold",
      render: (exp) => formatTND(exp.amount),
    },
    {
      key: "date",
      header: "Date",
      className: "text-neutral-500 dark:text-neutral-400",
      render: (exp) => formatShortDate(exp.expense_date),
    },
    {
      key: "attachment",
      header: "Pièce",
      render: (exp) => <AttachmentButton expense={exp} />,
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      render: (exp) => (
        <RowActionsMenu
          label={`Actions pour la dépense ${exp.name}`}
          actions={[
            { label: "Modifier", icon: Pencil, onSelect: () => setEditing(exp) },
            {
              label: "Supprimer",
              icon: Trash2,
              variant: "danger",
              onSelect: () => setDeleting(exp),
            },
          ]}
        />
      ),
    },
  ];

  const emptySearch = search.trim().length > 0;

  return (
    <div className="mx-auto max-w-6xl">
      {/* Barre d'outils */}
      <div className="flex items-center gap-3">
        <MonthYearFilter month={month} year={year} />
        <label className="relative min-w-0 flex-1">
          <Search
            size={17}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une dépense…"
            className="h-12 w-full rounded-xl bg-white pl-11 pr-4 text-sm shadow-sm shadow-neutral-900/5 outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-brand/40 dark:bg-card-dark"
          />
        </label>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="hidden h-12 shrink-0 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white transition-colors hover:bg-brand-hover lg:flex"
        >
          <Plus size={18} />
          Ajouter une dépense
        </button>
      </div>

      {/* Liste — pb-20 : le bouton flottant mobile ne recouvre pas la dernière ligne */}
      <div className="mt-4 pb-20 lg:pb-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-16 text-center shadow-sm shadow-neutral-900/5 dark:bg-card-dark">
            <span className="flex h-24 w-24 items-center justify-center rounded-3xl bg-neutral-100 dark:bg-neutral-800">
              <Wallet size={36} className="text-neutral-400" />
            </span>
            {emptySearch ? (
              <>
                <h2 className="mt-6 text-xl font-extrabold">Aucun résultat</h2>
                <p className="mt-2 max-w-md text-neutral-500 dark:text-neutral-400">
                  Aucune dépense ne correspond à «&nbsp;{search.trim()}&nbsp;»
                  pour ce mois.
                </p>
              </>
            ) : (
              <>
                <h2 className="mt-6 text-xl font-extrabold">
                  Aucune dépense ce mois
                </h2>
                <p className="mt-2 max-w-md text-neutral-500 dark:text-neutral-400">
                  Aucune dépense n&apos;a été enregistrée pour{" "}
                  {monthName(month).toLowerCase()} {year}. Ajoutez-en une pour
                  suivre vos frais et charges.
                </p>
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="mt-7 flex h-12 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white transition-colors hover:bg-brand-hover"
                >
                  <Plus size={18} />
                  Ajouter une dépense
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
                rowKey={(exp) => exp.id}
              />
            </div>

            {/* Mobile : cartes */}
            <ul className="space-y-3 lg:hidden">
              {filtered.map((exp) => (
                <li
                  key={exp.id}
                  className="rounded-2xl bg-white p-4 shadow-sm shadow-neutral-900/5 dark:bg-card-dark"
                >
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{exp.name}</p>
                      <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">
                        {exp.category.name} · {formatShortDate(exp.expense_date)}
                      </p>
                    </div>
                    {exp.attachment_path && <AttachmentButton expense={exp} />}
                    <RowActionsMenu
                      label={`Actions pour la dépense ${exp.name}`}
                      actions={[
                        {
                          label: "Modifier",
                          icon: Pencil,
                          onSelect: () => setEditing(exp),
                        },
                        {
                          label: "Supprimer",
                          icon: Trash2,
                          variant: "danger",
                          onSelect: () => setDeleting(exp),
                        },
                      ]}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800">
                    <TypeBadge type={exp.type} />
                    <p className="font-bold">{formatTND(exp.amount)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Mobile : FAB d'ajout au-dessus de la bottom nav */}
      <Fab label="Ajouter une dépense" onClick={() => setModalOpen(true)} />
      {modalOpen && (
        <AddExpenseModal
          categories={categories}
          month={month}
          year={year}
          onClose={() => setModalOpen(false)}
        />
      )}
      {editing && (
        <AddExpenseModal
          categories={categories}
          month={month}
          year={year}
          expense={editing}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title={`Supprimer la dépense « ${deleting.name} » ?`}
          message={`La dépense du ${formatShortDate(deleting.expense_date)} (${formatTND(deleting.amount)} TND) et sa pièce jointe éventuelle seront définitivement supprimées. Cette action est irréversible.`}
          onConfirm={async () => {
            const result = await deleteExpense(deleting.id);
            if (!result.error) setDeleting(null);
            return result;
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
