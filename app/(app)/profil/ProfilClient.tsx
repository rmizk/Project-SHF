"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  Building2,
  Check,
  LineChart,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useOrganization } from "@/components/OrganizationProvider";
import OrgAvatar from "@/components/OrgAvatar";
import { formatShortDate, formatTND } from "@/lib/format";
import { fromMillimes } from "@/lib/amounts";
import {
  addExpenseCategory,
  changeOwnPassword,
  deleteExpenseCategory,
  renameExpenseCategory,
  updateOrganizationName,
  updateWorkingCapital,
  uploadLogo,
  type ProfilFormState,
} from "./actions";

export type CapitalEntry = {
  id: string;
  amount: string;
  date: string; // ISO « 2026-07-16 »
  deltaMillimes: number | null;
};

export type Category = { id: string; name: string };

const inputClass =
  "h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-brand focus:bg-white dark:border-neutral-700 dark:bg-neutral-900 dark:focus:bg-neutral-900";
const labelClass =
  "mb-2 block text-sm font-semibold text-neutral-900 dark:text-neutral-100";
const cardClass =
  "rounded-2xl bg-white p-6 shadow-sm shadow-neutral-900/5 sm:p-7 dark:bg-card-dark";

function ErrorText({ state }: { state: ProfilFormState }) {
  if (!state.error) return null;
  return (
    <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
      {state.error}
    </p>
  );
}

// « 16 juil. 2026 » depuis une date ISO
function formatDateWithYear(isoDate: string): string {
  return `${formatShortDate(isoDate)} ${isoDate.slice(0, 4)}`;
}

// ------------------------------------------------------------
// Carte « Profil de l'organisation » : logo + nom + mot de passe
// ------------------------------------------------------------
function OrganizationCard() {
  const organization = useOrganization();

  // Logo : l'envoi part dès la sélection du fichier
  const [logoState, logoAction, logoPending] = useActionState<
    ProfilFormState,
    FormData
  >(uploadLogo, {});
  const logoFormRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Nom : sauvegarde au blur si modifié
  const [nameState, nameAction, namePending] = useActionState<
    ProfilFormState,
    FormData
  >(updateOrganizationName, {});
  const nameFormRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState(organization.name);
  const savedName = useRef(organization.name);

  // Mot de passe
  const [passwordState, passwordAction, passwordPending] = useActionState<
    ProfilFormState,
    FormData
  >(changeOwnPassword, {});
  const passwordFormRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (passwordState.success) passwordFormRef.current?.reset();
  }, [passwordState.success]);

  return (
    <section className={cardClass}>
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <Building2 size={20} />
        </span>
        <div>
          <h2 className="text-lg font-extrabold">Profil de l&apos;organisation</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Logo, nom et sécurité du compte
          </p>
        </div>
      </div>

      {/* Logo */}
      <form ref={logoFormRef} action={logoAction} className="mt-6 flex items-center gap-4">
        <OrgAvatar
          organization={organization}
          className="h-20 w-20 rounded-2xl text-xl"
        />
        <div>
          <input
            ref={fileInputRef}
            type="file"
            name="logo"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) logoFormRef.current?.requestSubmit();
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={logoPending}
            className="flex h-11 items-center gap-2 rounded-xl border border-neutral-200 px-4 text-sm font-bold transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            {logoPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            Changer le logo
          </button>
          <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            PNG ou JPG · 2 Mo max.
          </p>
        </div>
      </form>
      <ErrorText state={logoState} />

      {/* Nom de la société */}
      <form
        ref={nameFormRef}
        action={nameAction}
        onSubmit={() => {
          savedName.current = name;
        }}
        className="mt-6"
      >
        <label htmlFor="org-name" className={labelClass}>
          Nom de la société
        </label>
        <div className="relative">
          <input
            id="org-name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              if (name.trim() && name.trim() !== savedName.current.trim()) {
                savedName.current = name;
                nameFormRef.current?.requestSubmit();
              }
            }}
            required
            className={`${inputClass} pr-11`}
          />
          {namePending && (
            <Loader2
              size={16}
              className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-neutral-400"
            />
          )}
        </div>
      </form>
      <ErrorText state={nameState} />

      {/* Mot de passe */}
      <form
        ref={passwordFormRef}
        action={passwordAction}
        className="mt-7 border-t border-neutral-100 pt-6 dark:border-neutral-800"
      >
        <h3 className="font-bold">Mot de passe</h3>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="current_password" className={labelClass}>
              Mot de passe actuel
            </label>
            <input
              id="current_password"
              name="current_password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
              className={inputClass}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="new_password" className={labelClass}>
                Nouveau
              </label>
              <input
                id="new_password"
                name="new_password"
                type="password"
                autoComplete="new-password"
                placeholder="8 caractères minimum"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="confirm_password" className={labelClass}>
                Confirmer
              </label>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                required
                className={inputClass}
              />
            </div>
          </div>
        </div>
        {passwordState.error && (
          <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
            {passwordState.error}
          </p>
        )}
        {passwordState.success && (
          <p className="mt-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            Mot de passe mis à jour.
          </p>
        )}
        <button
          type="submit"
          disabled={passwordPending}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 text-sm font-bold transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          {passwordPending && <Loader2 size={16} className="animate-spin" />}
          Changer le mot de passe
        </button>
      </form>
    </section>
  );
}

// ------------------------------------------------------------
// Carte « Fond de roulement » : montant actuel + historique
// ------------------------------------------------------------
function WorkingCapitalCard({ history }: { history: CapitalEntry[] }) {
  const [state, formAction, isPending] = useActionState<ProfilFormState, FormData>(
    updateWorkingCapital,
    {}
  );
  const current = history[0] ? formatTND(history[0].amount) : "";
  const [amount, setAmount] = useState(current);

  return (
    <section className={cardClass}>
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <LineChart size={20} />
        </span>
        <div>
          <h2 className="text-lg font-extrabold">Fond de roulement</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Capital de trésorerie de référence
          </p>
        </div>
      </div>

      <form action={formAction} className="mt-6">
        <label htmlFor="capital-amount" className={labelClass}>
          Montant actuel
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <input
              id="capital-amount"
              name="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="0,000"
              required
              className={`${inputClass} pr-14 text-right font-bold`}
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-neutral-500">
              TND
            </span>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending && <Loader2 size={16} className="animate-spin" />}
            Mettre à jour
          </button>
        </div>
      </form>
      <ErrorText state={state} />

      <h3 className="mt-7 text-xs font-semibold uppercase tracking-widest text-neutral-400">
        Historique des modifications
      </h3>
      {history.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
          Aucune saisie pour l&apos;instant : renseignez le montant ci-dessus.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-neutral-100 dark:divide-neutral-800">
          {history.map((entry) => (
            <li key={entry.id} className="flex items-center gap-3 py-3.5">
              <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />
              <span className="flex-1 font-bold">
                {formatTND(entry.amount)} TND
              </span>
              <span className="text-right">
                {entry.deltaMillimes !== null && (
                  <span
                    className={`block text-sm font-bold ${
                      entry.deltaMillimes >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {entry.deltaMillimes >= 0 ? "+" : "−"}
                    {formatTND(fromMillimes(Math.abs(entry.deltaMillimes)))}
                  </span>
                )}
                <span className="block text-sm text-neutral-500 dark:text-neutral-400">
                  {formatDateWithYear(entry.date)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ------------------------------------------------------------
// Catégories de dépenses : ajout + chips renommer/supprimer
// ------------------------------------------------------------
function CategoryChip({ category }: { category: Category }) {
  const [renameState, renameAction, renamePending] = useActionState<
    ProfilFormState,
    FormData
  >(renameExpenseCategory, {});
  const [deleteState, deleteAction] = useActionState<ProfilFormState, FormData>(
    deleteExpenseCategory,
    {}
  );
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const deleteFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (renameState.success) setEditing(false);
  }, [renameState.success]);

  if (editing) {
    return (
      <form
        action={renameAction}
        className="flex items-center gap-1.5 rounded-xl border border-brand bg-brand/5 py-1.5 pl-3 pr-1.5"
      >
        <input type="hidden" name="id" value={category.id} />
        <input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
          aria-label={`Renommer la catégorie ${category.name}`}
          className="w-32 bg-transparent text-sm font-bold outline-none"
        />
        <button
          type="submit"
          disabled={renamePending}
          aria-label="Enregistrer le nouveau nom"
          className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand text-white transition-colors hover:bg-brand-hover disabled:opacity-60 lg:h-8 lg:w-8"
        >
          {renamePending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Check size={14} />
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setName(category.name);
          }}
          aria-label="Annuler le renommage"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 lg:h-8 lg:w-8 dark:hover:bg-neutral-800"
        >
          <X size={14} />
        </button>
        {renameState.error && (
          <span role="alert" className="pl-1 text-xs text-red-600 dark:text-red-400">
            {renameState.error}
          </span>
        )}
      </form>
    );
  }

  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 py-1.5 pl-4 pr-1.5 dark:border-neutral-700 dark:bg-neutral-900">
      <span className="text-sm font-bold">{category.name}</span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={`Renommer la catégorie ${category.name}`}
        className="ml-1 flex h-11 w-11 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-200 lg:h-8 lg:w-8 dark:hover:bg-neutral-800"
      >
        <Pencil size={14} />
      </button>
      <form ref={deleteFormRef} action={deleteAction} className="contents">
        <input type="hidden" name="id" value={category.id} />
        <button
          type="button"
          onClick={() => {
            if (confirm(`Supprimer la catégorie « ${category.name} » ?`)) {
              deleteFormRef.current?.requestSubmit();
            }
          }}
          aria-label={`Supprimer la catégorie ${category.name}`}
          className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-50 text-red-500 transition-colors hover:bg-red-100 lg:h-8 lg:w-8 dark:bg-red-950/50 dark:hover:bg-red-950"
        >
          <Trash2 size={14} />
        </button>
      </form>
      {deleteState.error && (
        <span role="alert" className="px-1.5 text-xs text-red-600 dark:text-red-400">
          {deleteState.error}
        </span>
      )}
    </div>
  );
}

function CategoriesCard({ categories }: { categories: Category[] }) {
  const [addState, addAction, addPending] = useActionState<
    ProfilFormState,
    FormData
  >(addExpenseCategory, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (addState.success) formRef.current?.reset();
  }, [addState.success]);

  return (
    <section className={cardClass}>
      <h2 className="text-lg font-extrabold">Catégories de dépenses</h2>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        Ajouter, renommer ou supprimer les catégories.
      </p>

      <form ref={formRef} action={addAction} className="mt-5 flex gap-3">
        <input
          name="name"
          placeholder="Nouvelle catégorie…"
          required
          aria-label="Nom de la nouvelle catégorie"
          className={`${inputClass} flex-1`}
        />
        <button
          type="submit"
          disabled={addPending}
          className="flex h-12 shrink-0 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {addPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Plus size={16} />
          )}
          Ajouter
        </button>
      </form>
      <ErrorText state={addState} />

      {categories.length === 0 ? (
        <p className="mt-5 text-sm text-neutral-500 dark:text-neutral-400">
          Aucune catégorie : ajoutez-en une pour classer vos dépenses.
        </p>
      ) : (
        <div className="mt-5 flex flex-wrap gap-2.5">
          {categories.map((category) => (
            <CategoryChip key={category.id} category={category} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function ProfilClient({
  history,
  categories,
}: {
  history: CapitalEntry[];
  categories: Category[];
}) {
  const organization = useOrganization();

  return (
    <div className="mx-auto max-w-6xl pb-20 lg:pb-0">
      {/* En-tête mobile (le titre bureau est dans la TopBar) */}
      <div className="mb-4 lg:hidden">
        <h1 className="text-2xl font-extrabold">Profil</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {organization.name} · Organisation
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
        <OrganizationCard />
        <WorkingCapitalCard history={history} />
      </div>
      <div className="mt-4 lg:mt-5">
        <CategoriesCard categories={categories} />
      </div>
    </div>
  );
}
