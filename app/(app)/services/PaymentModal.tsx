"use client";

import { useActionState, useEffect, useState } from "react";
import { Check, DollarSign, Loader2, Plus, Trash2 } from "lucide-react";
import Modal from "@/components/Modal";
import { formatTND } from "@/lib/format";
import { toMillimes } from "@/lib/amounts";
import { recordPayment, type AttachementFormState } from "./actions";
import type { Attachement } from "./ServicesClient";

const FORM_ID = "paiement-attachement";

type Row = { key: number; label: string; amount: string };

function parseRowAmount(raw: string): number | null {
  const normalized = raw.replace(/[\s  ]/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,3})?$/.test(normalized)) return null;
  return toMillimes(normalized);
}

export default function PaymentModal({
  attachement,
  onClose,
}: {
  attachement: Attachement;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState<
    AttachementFormState,
    FormData
  >(recordPayment, {});

  const isEdit = attachement.status === "paid";
  const [rows, setRows] = useState<Row[]>(() => {
    const existing = attachement.deductions.map((d, i) => ({
      key: i,
      label: d.label,
      amount: formatTND(d.amount).replace(/[  ]/g, " ").trim(),
    }));
    return existing.length > 0
      ? existing
      : [{ key: 0, label: "", amount: "" }];
  });

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  function updateRow(key: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((rs) => [
      ...rs,
      { key: (rs[rs.length - 1]?.key ?? 0) + 1, label: "", amount: "" },
    ]);
  }

  function removeRow(key: number) {
    setRows((rs) =>
      rs.length > 1 ? rs.filter((r) => r.key !== key) : rs.map((r) => ({ ...r, label: "", amount: "" }))
    );
  }

  // Total et bénéfice affichés en direct (le calcul faisant foi est serveur)
  const totalMillimes = rows.reduce((sum, r) => {
    if (!r.amount.trim()) return sum;
    const m = parseRowAmount(r.amount);
    return m === null ? sum : sum + m;
  }, 0);
  const htMillimes = toMillimes(attachement.amount_ht);
  const netMillimes = htMillimes - totalMillimes;

  const inputClass =
    "h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-brand focus:bg-white dark:border-neutral-700 dark:bg-neutral-900 dark:focus:bg-neutral-900";

  return (
    <Modal
      open
      onClose={onClose}
      title="Enregistrer le paiement"
      subtitle={
        isEdit
          ? `${attachement.client.name} · retenues et bénéfice net`
          : `${attachement.client.name} · passage à « Payé »`
      }
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
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <Check size={18} />
                Confirmer le paiement
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

        <input
          type="hidden"
          name="attachement_id"
          value={attachement.id}
          form={FORM_ID}
        />

        {/* Rappel du montant HT */}
        <div className="flex items-center justify-between gap-4 rounded-2xl bg-neutral-100 px-5 py-4 dark:bg-neutral-800">
          <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
            Montant HT de l&apos;attachement
          </span>
          <span className="text-lg font-extrabold">
            {formatTND(attachement.amount_ht)}
            <span className="ml-1.5 text-sm font-bold text-neutral-500">
              TND
            </span>
          </span>
        </div>

        {/* Retenues et charges */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold">Retenues et charges</span>
            <button
              type="button"
              onClick={addRow}
              className="flex items-center gap-1.5 rounded-lg border border-brand/30 px-3.5 py-2 text-sm font-bold text-brand transition-colors hover:bg-brand/5"
            >
              <Plus size={16} />
              Ajouter une ligne
            </button>
          </div>

          <div className="space-y-2.5">
            {rows.map((row) => (
              <div key={row.key} className="flex items-center gap-2.5">
                <input
                  name="deduction_label"
                  form={FORM_ID}
                  value={row.label}
                  onChange={(e) => updateRow(row.key, { label: e.target.value })}
                  placeholder="Ex. Retenue à la source (1,5 %)"
                  aria-label="Libellé de la retenue"
                  className={`${inputClass} flex-1`}
                />
                <div className="relative w-40 shrink-0">
                  <input
                    name="deduction_amount"
                    form={FORM_ID}
                    value={row.amount}
                    onChange={(e) =>
                      updateRow(row.key, { amount: e.target.value })
                    }
                    inputMode="decimal"
                    placeholder="0,000"
                    aria-label="Montant de la retenue"
                    className={`${inputClass} pr-12 text-right`}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-500">
                    TND
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  aria-label="Supprimer la ligne"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 transition-colors hover:bg-red-100 dark:bg-red-950/50 dark:text-red-400 dark:hover:bg-red-950"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Total des retenues */}
        <div className="flex items-center justify-between border-t border-dashed border-neutral-200 pt-4 dark:border-neutral-700">
          <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
            Total des retenues
          </span>
          <span className="text-lg font-extrabold text-red-600 dark:text-red-400">
            − {formatTND(totalMillimes / 1000)}
            <span className="ml-1.5 text-sm">TND</span>
          </span>
        </div>

        {/* Bénéfice net calculé */}
        <div>
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-5 py-4 dark:bg-emerald-950/40">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-neutral-800">
              <DollarSign size={17} className="text-emerald-600" />
            </span>
            <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
              Bénéfice net calculé
            </span>
            <span className="ml-auto text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatTND(netMillimes / 1000)}
              <span className="ml-1.5 text-sm font-bold">TND</span>
            </span>
          </div>
          <p className="mt-2 text-right text-xs text-neutral-400">
            Bénéfice net = Montant HT − total des retenues
          </p>
        </div>
      </div>
    </Modal>
  );
}
