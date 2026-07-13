"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, UserRound } from "lucide-react";
import Modal from "@/components/Modal";
import { monthLabel } from "@/lib/format";
import { addAttachement, type AttachementFormState } from "./actions";
import type { Client } from "./ServicesClient";

const VAT_RATES = [0, 7, 13, 19];
const FORM_ID = "ajout-attachement";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export default function AddAttachementModal({
  clients,
  month,
  year,
  onClose,
}: {
  clients: Client[];
  month: number;
  year: number;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState<
    AttachementFormState,
    FormData
  >(addAttachement, {});

  const [clientName, setClientName] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [vatRate, setVatRate] = useState(19);
  const [status, setStatus] = useState<"pending" | "paid">("pending");
  const clientRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!clientRef.current?.contains(e.target as Node)) {
        setSuggestionsOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const suggestions = useMemo(() => {
    const q = normalize(clientName.trim());
    if (!q) return [];
    return clients.filter((c) => normalize(c.name).includes(q)).slice(0, 6);
  }, [clients, clientName]);

  const now = new Date();
  const isCurrentMonth =
    now.getMonth() + 1 === month && now.getFullYear() === year;
  const defaultDate = isCurrentMonth
    ? `${year}-${String(month).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    : `${year}-${String(month).padStart(2, "0")}-01`;

  const inputClass =
    "h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-brand focus:bg-white dark:border-neutral-700 dark:bg-neutral-900 dark:focus:bg-neutral-900";
  const labelClass =
    "mb-2 block text-sm font-semibold text-neutral-900 dark:text-neutral-100";

  return (
    <Modal
      open
      onClose={onClose}
      title="Ajouter un attachement"
      subtitle={`Prestation de service · ${monthLabel(month, year)}`}
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

        {/* Client avec auto-complétion */}
        <div ref={clientRef} className="relative">
          <label htmlFor="client_name" className={labelClass}>
            Nom du client
          </label>
          <input
            id="client_name"
            name="client_name"
            form={FORM_ID}
            value={clientName}
            onChange={(e) => {
              setClientName(e.target.value);
              setSuggestionsOpen(true);
            }}
            onFocus={() => setSuggestionsOpen(true)}
            placeholder="Ex. Novatech Solutions"
            autoComplete="off"
            required
            className={inputClass}
          />
          {suggestionsOpen && suggestions.length > 0 && (
            <ul className="absolute inset-x-0 top-full z-10 mt-2 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl shadow-neutral-900/10 dark:border-neutral-700 dark:bg-card-dark">
              {suggestions.map((c, i) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setClientName(c.name);
                      setSuggestionsOpen(false);
                    }}
                    className={`flex w-full items-center gap-2.5 border-t border-neutral-100 px-4 py-3 text-left text-sm transition-colors first:border-t-0 dark:border-neutral-800 ${
                      i === 0
                        ? "bg-brand/5 font-bold text-brand"
                        : "text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    }`}
                  >
                    {i === 0 && <UserRound size={16} />}
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="amount_ht" className={labelClass}>
              Montant HT
            </label>
            <div className="relative">
              <input
                id="amount_ht"
                name="amount_ht"
                form={FORM_ID}
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
          <div>
            <label htmlFor="attachement_date" className={labelClass}>
              Date
            </label>
            <input
              id="attachement_date"
              name="attachement_date"
              form={FORM_ID}
              type="date"
              defaultValue={defaultDate}
              required
              className={inputClass}
            />
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

        {/* État initial */}
        <div>
          <span className={labelClass}>État</span>
          <input type="hidden" name="status" value={status} form={FORM_ID} />
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setStatus("pending")}
              aria-pressed={status === "pending"}
              className={`flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-bold transition-colors ${
                status === "pending"
                  ? "border-brand bg-brand/5 text-brand"
                  : "border-neutral-200 bg-neutral-50 text-neutral-500 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${status === "pending" ? "bg-brand" : "bg-neutral-400"}`}
              />
              En attente
            </button>
            <button
              type="button"
              onClick={() => setStatus("paid")}
              aria-pressed={status === "paid"}
              className={`flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-bold transition-colors ${
                status === "paid"
                  ? "border-brand bg-brand/5 text-brand"
                  : "border-neutral-200 bg-neutral-50 text-neutral-500 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${status === "paid" ? "bg-brand" : "bg-neutral-400"}`}
              />
              Payé
            </button>
          </div>
          {status === "paid" && (
            <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
              Le bénéfice net restera à définir : utilisez ensuite «&nbsp;Modifier
              les retenues&nbsp;» pour le calculer.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
