"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { Briefcase, Check, FileText, Loader2 } from "lucide-react";
import Modal from "@/components/Modal";
import FileDropzone from "@/components/FileDropzone";
import DatePicker from "@/components/DatePicker";
import { formatTND, monthLabel } from "@/lib/format";
import {
  addPurchaseInvoice,
  updatePurchaseInvoice,
  type InvoiceFormState,
} from "./actions";
import type { Invoice, Supplier } from "./AchatsClient";

const VAT_RATES = [0, 7, 13, 19];
const FORM_ID = "ajout-facture";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export default function AddInvoiceModal({
  suppliers,
  month,
  year,
  invoice,
  onClose,
}: {
  suppliers: Supplier[];
  month: number;
  year: number;
  invoice?: Invoice; // fourni : le modal passe en mode « Modifier »
  onClose: () => void;
}) {
  const editing = Boolean(invoice);
  const [state, formAction, isPending] = useActionState<
    InvoiceFormState,
    FormData
  >(invoice ? updatePurchaseInvoice : addPurchaseInvoice, {});

  const [supplierName, setSupplierName] = useState(invoice?.supplier.name ?? "");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [amountHt, setAmountHt] = useState(
    invoice ? formatTND(invoice.amount_ht) : ""
  );
  const [vatRate, setVatRate] = useState(
    invoice ? Number(invoice.vat_rate) : 19
  );
  const supplierRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  // Fermeture des suggestions au clic extérieur
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!supplierRef.current?.contains(e.target as Node)) {
        setSuggestionsOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const suggestions = useMemo(() => {
    const q = normalize(supplierName.trim());
    if (!q) return [];
    return suppliers
      .filter((s) => normalize(s.name).includes(q))
      .slice(0, 6);
  }, [suppliers, supplierName]);

  const parsedHt = Number(
    amountHt.replace(/[\s  ]/g, "").replace(",", ".")
  );
  const ttc = Number.isFinite(parsedHt)
    ? Math.round(parsedHt * (1 + vatRate / 100) * 1000) / 1000
    : null;

  // Date par défaut : aujourd'hui si le mois affiché est le mois courant,
  // sinon le 1er du mois affiché.
  const now = new Date();
  const isCurrentMonth =
    now.getMonth() + 1 === month && now.getFullYear() === year;
  const defaultDate =
    invoice?.invoice_date ??
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
      title={
        editing
          ? `Modifier la facture ${invoice?.invoice_number}`
          : "Ajouter une facture"
      }
      subtitle={`Facture fournisseur · ${monthLabel(month, year)}`}
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
                {editing ? "Enregistrer les modifications" : "Enregistrer la facture"}
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {invoice && (
          <input
            type="hidden"
            name="invoice_id"
            value={invoice.id}
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

        {/* Fournisseur avec auto-complétion */}
        <div ref={supplierRef} className="relative">
          <label htmlFor="supplier_name" className={labelClass}>
            Nom du fournisseur
          </label>
          <input
            id="supplier_name"
            name="supplier_name"
            form={FORM_ID}
            value={supplierName}
            onChange={(e) => {
              setSupplierName(e.target.value);
              setSuggestionsOpen(true);
            }}
            onFocus={() => setSuggestionsOpen(true)}
            placeholder="Ex. Sotumag SA"
            autoComplete="off"
            required
            className={inputClass}
          />
          {suggestionsOpen && suggestions.length > 0 && (
            <ul className="absolute inset-x-0 top-full z-10 mt-2 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl shadow-neutral-900/10 dark:border-neutral-700 dark:bg-card-dark">
              {suggestions.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSupplierName(s.name);
                      setSuggestionsOpen(false);
                    }}
                    className={`flex w-full items-center gap-2.5 border-t border-neutral-100 px-4 py-3 text-left text-sm transition-colors first:border-t-0 dark:border-neutral-800 ${
                      i === 0
                        ? "bg-brand/5 font-bold text-brand"
                        : "text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    }`}
                  >
                    {i === 0 && <Briefcase size={16} />}
                    {s.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="invoice_number" className={labelClass}>
              N° de facture
            </label>
            <input
              id="invoice_number"
              name="invoice_number"
              form={FORM_ID}
              defaultValue={invoice?.invoice_number}
              placeholder="Ex. FCT-2026-0142"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="invoice_date" className={labelClass}>
              Date
            </label>
            <DatePicker
              id="invoice_date"
              name="invoice_date"
              formId={FORM_ID}
              defaultValue={defaultDate}
              required
            />
          </div>
        </div>

        {/* Montant HT */}
        <div>
          <label htmlFor="amount_ht" className={labelClass}>
            Montant HT
          </label>
          <div className="relative">
            <input
              id="amount_ht"
              name="amount_ht"
              form={FORM_ID}
              value={amountHt}
              onChange={(e) => setAmountHt(e.target.value)}
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

        {/* Taux de TVA */}
        <div>
          <span className={labelClass}>Taux de TVA</span>
          <input type="hidden" name="vat_rate" value={vatRate} form={FORM_ID} />
          <div className="grid grid-cols-4 gap-2.5">
            {VAT_RATES.map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => setVatRate(rate)}
                aria-pressed={vatRate === rate}
                className={`h-12 rounded-xl border text-sm font-bold transition-colors ${
                  vatRate === rate
                    ? "border-brand bg-brand/5 text-brand"
                    : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
                }`}
              >
                {rate} %
              </button>
            ))}
          </div>
        </div>

        {/* TTC calculé (affichage — le montant réel est calculé en base) */}
        <div>
          <span className={labelClass}>
            Montant TTC{" "}
            <span className="font-normal text-neutral-400">
              · calculé automatiquement
            </span>
          </span>
          <div className="flex items-center gap-3 rounded-xl bg-brand/5 px-4 py-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-neutral-800">
              <FileText size={16} className="text-brand" />
            </span>
            <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
              HT + TVA
            </span>
            <span className="ml-auto text-xl font-extrabold text-brand">
              {ttc !== null && amountHt.trim() !== "" ? formatTND(ttc) : "—"}
              <span className="ml-1.5 text-sm">TND</span>
            </span>
          </div>
        </div>

        {/* Pièce jointe */}
        <div>
          <span className={labelClass}>
            Pièce jointe{" "}
            <span className="font-normal text-neutral-400">· optionnel</span>
          </span>
          <FileDropzone name="attachment" formId={FORM_ID} />
          {editing && invoice?.attachment_path && (
            <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
              Une pièce est déjà jointe : déposez un nouveau fichier pour la
              remplacer, ou ne touchez à rien pour la conserver.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
