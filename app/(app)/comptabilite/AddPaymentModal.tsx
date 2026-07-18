"use client";

import { useActionState, useEffect, useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import Modal from "@/components/Modal";
import DatePicker from "@/components/DatePicker";
import { formatTND, monthLabel } from "@/lib/format";
import {
  PAYMENT_TYPE_META,
  PaymentTypeLabel,
  type PaymentType,
} from "@/components/PaymentTypeLabel";
import { addAccountingPayment, type PaymentFormState } from "./actions";

const FORM_ID = "ajout-paiement";
const TYPE_ORDER: PaymentType[] = [
  "tva",
  "accountant_fees",
  "qabadha",
  "cnss",
  "site_insurance",
];

export default function AddPaymentModal({
  month,
  year,
  vatDue,
  onClose,
}: {
  month: number;
  year: number;
  vatDue: string;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState<
    PaymentFormState,
    FormData
  >(addAccountingPayment, {});

  const [type, setType] = useState<PaymentType>("tva");
  const [status, setStatus] = useState<"to_pay" | "paid">("to_pay");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  // Date par défaut : aujourd'hui si le mois affiché est le mois courant,
  // sinon le 1er du mois affiché.
  const now = new Date();
  const isCurrentMonth =
    now.getMonth() + 1 === month && now.getFullYear() === year;
  const defaultDate = isCurrentMonth
    ? `${year}-${String(month).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    : `${year}-${String(month).padStart(2, "0")}-01`;

  // Préremplissage proposé pour la TVA : la TVA calculée du mois (si positive)
  const vatDueNumber = Number(vatDue);
  const canPrefillVat = type === "tva" && vatDueNumber > 0;

  const inputClass =
    "h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-brand focus:bg-white dark:border-neutral-700 dark:bg-neutral-900 dark:focus:bg-neutral-900";
  const labelClass =
    "mb-2 block text-sm font-semibold text-neutral-900 dark:text-neutral-100";

  return (
    <Modal
      open
      onClose={onClose}
      title="Ajouter un paiement"
      subtitle={`Échéance fiscale ou sociale · ${monthLabel(month, year)}`}
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
        {state.error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300"
          >
            {state.error}
          </p>
        )}

        {/* Type de paiement : liste verticale */}
        <div>
          <span className={labelClass}>Type de paiement</span>
          <input type="hidden" name="type" value={type} form={FORM_ID} />
          <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700">
            {TYPE_ORDER.map((value) => {
              const Icon = PAYMENT_TYPE_META[value].icon;
              const selected = type === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  aria-pressed={selected}
                  className={`flex w-full items-center gap-3 border-t border-neutral-200 px-4 py-3.5 text-left text-sm transition-colors first:border-t-0 dark:border-neutral-700 ${
                    selected
                      ? "bg-brand/5 font-bold text-brand"
                      : "font-semibold text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  }`}
                >
                  <Icon size={17} className="shrink-0" />
                  <span className="flex-1">
                    <PaymentTypeLabel type={value} withSuffix={false} />
                  </span>
                  {selected && <Check size={17} className="shrink-0" />}
                </button>
              );
            })}
          </div>
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
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
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
            <label htmlFor="payment_date" className={labelClass}>
              Date
            </label>
            <DatePicker
              id="payment_date"
              name="payment_date"
              formId={FORM_ID}
              defaultValue={defaultDate}
              required
            />
          </div>
        </div>

        {/* Préremplir avec la TVA calculée du mois */}
        {canPrefillVat && (
          <button
            type="button"
            onClick={() => setAmount(formatTND(vatDue))}
            className="flex w-full items-center gap-2.5 rounded-xl bg-brand/5 px-4 py-3 text-left text-sm font-semibold text-brand transition-colors hover:bg-brand/10"
          >
            <Sparkles size={16} className="shrink-0" />
            Préremplir avec la TVA du mois : {formatTND(vatDue)} TND
          </button>
        )}

        {/* État */}
        <div>
          <span className={labelClass}>État</span>
          <input type="hidden" name="status" value={status} form={FORM_ID} />
          <div className="grid grid-cols-2 gap-2.5">
            {(
              [
                { value: "to_pay", label: "À payer", dot: "bg-orange-500" },
                { value: "paid", label: "Payé", dot: "bg-emerald-500" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatus(option.value)}
                aria-pressed={status === option.value}
                className={`flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl border text-sm font-bold transition-colors ${
                  status === option.value
                    ? "border-brand bg-brand/5 text-brand"
                    : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${option.dot}`} />
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
