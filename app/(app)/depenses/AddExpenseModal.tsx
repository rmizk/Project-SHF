"use client";

import { useActionState, useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  FileText,
  FileX,
  Info,
  Loader2,
  User,
} from "lucide-react";
import Modal from "@/components/Modal";
import FileDropzone from "@/components/FileDropzone";
import DatePicker from "@/components/DatePicker";
import { formatTND, monthLabel } from "@/lib/format";
import { addExpense, updateExpense, type ExpenseFormState } from "./actions";
import {
  TYPE_LABELS,
  type Category,
  type Expense,
  type ExpenseType,
} from "./DepensesClient";

const FORM_ID = "ajout-depense";

const TYPE_OPTIONS: { value: ExpenseType; icon: typeof FileText }[] = [
  { value: "with_invoice", icon: FileText },
  { value: "without_invoice", icon: FileX },
  { value: "personal", icon: User },
];

export default function AddExpenseModal({
  categories,
  month,
  year,
  expense,
  onClose,
}: {
  categories: Category[];
  month: number;
  year: number;
  expense?: Expense; // fourni : le modal passe en mode « Modifier »
  onClose: () => void;
}) {
  const editing = Boolean(expense);
  const [state, formAction, isPending] = useActionState<
    ExpenseFormState,
    FormData
  >(expense ? updateExpense : addExpense, {});

  const [type, setType] = useState<ExpenseType>(expense?.type ?? "with_invoice");

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  // Date par défaut : aujourd'hui si le mois affiché est le mois courant,
  // sinon le 1er du mois affiché.
  const now = new Date();
  const isCurrentMonth =
    now.getMonth() + 1 === month && now.getFullYear() === year;
  const defaultDate =
    expense?.expense_date ??
    (isCurrentMonth
      ? `${year}-${String(month).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
      : `${year}-${String(month).padStart(2, "0")}-01`);

  const inputClass =
    "h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-brand focus:bg-white dark:border-neutral-700 dark:bg-neutral-900 dark:focus:bg-neutral-900";
  const labelClass =
    "mb-2 block text-sm font-semibold text-neutral-900 dark:text-neutral-100";

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? `Modifier la dépense — ${expense?.name}` : "Ajouter une dépense"}
      subtitle={`Frais & charges · ${monthLabel(month, year)}`}
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-xl border border-neutral-200 text-sm font-bold transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Annuler
          </button>
          <form action={formAction} id={FORM_ID} className="contents" />
          <button
            type="submit"
            form={FORM_ID}
            disabled={isPending}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <Check size={18} />
                Enregistrer
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {expense && (
          <input
            type="hidden"
            name="expense_id"
            value={expense.id}
            form={FORM_ID}
          />
        )}
        {state.error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300"
          >
            {state.error}
          </p>
        )}

        {/* Type de dépense : 3 boutons */}
        <div>
          <span className={labelClass}>Type de dépense</span>
          <input type="hidden" name="type" value={type} form={FORM_ID} />
          <div className="grid grid-cols-3 gap-2.5">
            {TYPE_OPTIONS.map(({ value, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                aria-pressed={type === value}
                className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-4 text-sm font-bold transition-colors ${
                  type === value
                    ? "border-brand bg-brand/5 text-brand"
                    : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
                }`}
              >
                <Icon size={20} />
                {TYPE_LABELS[value]}
              </button>
            ))}
          </div>
        </div>

        {/* Catégorie */}
        <div>
          <label htmlFor="category_id" className={labelClass}>
            Catégorie
          </label>
          <div className="relative">
            <select
              id="category_id"
              name="category_id"
              form={FORM_ID}
              required
              defaultValue={expense?.category.id ?? categories[0]?.id ?? ""}
              className={`${inputClass} appearance-none pr-11`}
            >
              {categories.length === 0 && (
                <option value="" disabled>
                  Aucune catégorie disponible
                </option>
              )}
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={17}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400"
            />
          </div>
        </div>

        {/* Nom */}
        <div>
          <label htmlFor="name" className={labelClass}>
            Nom de la dépense
          </label>
          <input
            id="name"
            name="name"
            form={FORM_ID}
            defaultValue={expense?.name}
            placeholder="Ex. Repas équipe"
            required
            className={inputClass}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Montant */}
          <div>
            <label htmlFor="amount" className={labelClass}>
              Montant
            </label>
            <div className="relative">
              <input
                id="amount"
                name="amount"
                form={FORM_ID}
                defaultValue={expense ? formatTND(expense.amount) : undefined}
                inputMode="decimal"
                placeholder="0,000"
                required
                className={`${inputClass} pr-14`}
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-neutral-500">
                TND
              </span>
            </div>
          </div>
          {/* Date */}
          <div>
            <label htmlFor="expense_date" className={labelClass}>
              Date
            </label>
            <DatePicker
              id="expense_date"
              name="expense_date"
              formId={FORM_ID}
              defaultValue={defaultDate}
              required
            />
          </div>
        </div>

        {/* Pièce jointe : uniquement pour « Avec facture », alors obligatoire */}
        {type === "with_invoice" ? (
          <div>
            <span className={labelClass}>
              Pièce jointe{" "}
              <span className="font-normal text-brand">
                · requise pour une dépense avec facture
              </span>
            </span>
            <FileDropzone name="attachment" formId={FORM_ID} />
            {editing && expense?.attachment_path && (
              <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                Une pièce est déjà jointe : déposez un nouveau fichier pour la
                remplacer, ou ne touchez à rien pour la conserver.
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
            <Info size={17} className="shrink-0 text-neutral-400" />
            Aucune pièce jointe requise pour ce type de dépense.
          </div>
        )}
      </div>
    </Modal>
  );
}
