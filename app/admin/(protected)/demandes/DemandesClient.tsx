"use client";

import { useState } from "react";
import {
  Check,
  CircleAlert,
  CircleCheck,
  KeyRound,
  Trash2,
  X,
} from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable";
import StatusBadge, { type StatusVariant } from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import Modal from "@/components/Modal";
import CopyButton from "@/components/admin/CopyButton";
import { formatShortDate } from "@/lib/format";
import {
  approveRequest,
  deleteProcessedRequests,
  deleteRequest,
  rejectRequest,
  type AdminActionState,
} from "@/lib/admin/actions";

export type AdminRequest = {
  id: string;
  company_name: string;
  tax_id: string;
  email: string;
  phone: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

const FILTERS = [
  { key: "pending", label: "En attente" },
  { key: "approved", label: "Approuvées" },
  { key: "rejected", label: "Refusées" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

const STATUS_META: Record<
  AdminRequest["status"],
  { variant: StatusVariant; label: string }
> = {
  pending: { variant: "warning", label: "En attente" },
  approved: { variant: "success", label: "Approuvée" },
  rejected: { variant: "neutral", label: "Refusée" },
};

// « 16 juil. 2026 » depuis un timestamp ISO
function formatDateWithYear(iso: string): string {
  return `${formatShortDate(iso)} ${iso.slice(0, 4)}`;
}

// ------------------------------------------------------------
// Modal de remise des identifiants après approbation
// ------------------------------------------------------------
function CredentialsModal({
  credentials,
  onClose,
}: {
  credentials: { orgCode: string; password: string };
  onClose: () => void;
}) {
  const rows = [
    { label: "Identifiant de l'organisation", value: credentials.orgCode },
    { label: "Mot de passe provisoire", value: credentials.password },
  ];

  return (
    <Modal
      open
      onClose={onClose}
      title="Identifiants de connexion"
      subtitle="À transmettre manuellement au demandeur"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="h-12 w-full rounded-xl bg-brand text-sm font-bold text-white transition-colors hover:bg-brand-hover"
        >
          Fermer
        </button>
      }
    >
      <div className="space-y-5">
        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 px-4 py-3 dark:border-neutral-700"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  {row.label}
                </p>
                <p className="truncate font-mono text-sm font-bold">
                  {row.value}
                </p>
              </div>
              <CopyButton value={row.value} label={`Copier : ${row.label}`} />
            </div>
          ))}
        </div>
        <p className="flex items-start gap-2.5 rounded-xl bg-neutral-100 px-4 py-3 text-sm text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
          <KeyRound size={18} className="mt-0.5 shrink-0" />
          Ces identifiants restent disponibles dans la liste des organisations
          tant que le mot de passe n&apos;a pas été changé.
        </p>
      </div>
    </Modal>
  );
}

// ------------------------------------------------------------
// Approuver / Refuser une demande en attente
// ------------------------------------------------------------
function PendingActions({
  request,
  onResult,
}: {
  request: AdminRequest;
  onResult: (state: AdminActionState) => void;
}) {
  const [dialog, setDialog] = useState<"approve" | "reject" | null>(null);

  async function run(
    action: typeof approveRequest,
    close: () => void
  ): Promise<{ error?: string } | void> {
    const formData = new FormData();
    formData.set("request_id", request.id);
    const result = await action({}, formData);
    if (result.error) return { error: result.error };
    onResult(result);
    close();
  }

  return (
    <span className="flex justify-end gap-2">
      {/* Mobile : icône seule ; bureau : icône + libellé */}
      <button
        type="button"
        onClick={() => setDialog("approve")}
        aria-label={`Approuver la demande de ${request.company_name}`}
        title="Approuver"
        className="flex h-11 w-11 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 text-sm font-bold text-white transition-colors hover:bg-emerald-600 lg:h-9 lg:w-auto lg:bg-brand lg:px-3.5 lg:hover:bg-brand-hover"
      >
        <Check size={17} className="lg:hidden" />
        <Check size={15} className="hidden lg:block" />
        <span className="hidden lg:inline">Approuver</span>
      </button>
      <button
        type="button"
        onClick={() => setDialog("reject")}
        aria-label={`Refuser la demande de ${request.company_name}`}
        title="Refuser"
        className="flex h-11 w-11 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 text-sm font-bold text-red-600 transition-colors hover:bg-red-50 lg:h-9 lg:w-auto lg:px-3.5 dark:border-neutral-700 dark:text-red-400 dark:hover:bg-red-950/50"
      >
        <X size={17} className="lg:hidden" />
        <X size={15} className="hidden lg:block" />
        <span className="hidden lg:inline">Refuser</span>
      </button>

      {dialog === "approve" && (
        <ConfirmDialog
          title="Approuver la demande"
          message={`Une organisation sera créée pour ${request.company_name}. Ses identifiants de connexion vous seront affichés pour une remise manuelle.`}
          confirmLabel="Approuver"
          icon={Check}
          variant="primary"
          onConfirm={() => run(approveRequest, () => setDialog(null))}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "reject" && (
        <ConfirmDialog
          title="Refuser la demande"
          message={`Un email de refus sera envoyé à ${request.email}. La demande de ${request.company_name} sera marquée comme refusée.`}
          confirmLabel="Refuser"
          icon={X}
          onConfirm={() => run(rejectRequest, () => setDialog(null))}
          onClose={() => setDialog(null)}
        />
      )}
    </span>
  );
}

// ------------------------------------------------------------
// Suppression d'une demande traitée (jamais proposée « en attente »)
// ------------------------------------------------------------
function DeleteRequestButton({
  request,
  onResult,
}: {
  request: AdminRequest;
  onResult: (state: AdminActionState) => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <span className="flex justify-end">
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={`Supprimer la demande de ${request.company_name}`}
        title="Supprimer la demande"
        className="flex h-11 w-11 items-center justify-center rounded-xl text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-600 lg:h-9 lg:w-9 dark:text-neutral-400 dark:hover:bg-red-950/50 dark:hover:text-red-400"
      >
        <Trash2 size={17} />
      </button>

      {confirming && (
        <ConfirmDialog
          title="Supprimer la demande"
          message={`La demande de ${request.company_name} sera définitivement retirée de l'historique. L'organisation éventuellement créée n'est pas affectée.`}
          confirmLabel="Supprimer"
          icon={Trash2}
          onConfirm={async () => {
            const result = await deleteRequest(request.id);
            if (result.error) return { error: result.error };
            onResult(result);
            setConfirming(false);
          }}
          onClose={() => setConfirming(false)}
        />
      )}
    </span>
  );
}

// ------------------------------------------------------------
// Page
// ------------------------------------------------------------
export default function DemandesClient({
  requests,
}: {
  requests: AdminRequest[];
}) {
  const [filter, setFilter] = useState<FilterKey>("pending");
  const [lastResult, setLastResult] = useState<AdminActionState | null>(null);
  const [clearing, setClearing] = useState(false);

  const filtered = requests.filter((r) => r.status === filter);
  const processed = filter !== "pending";
  const countByFilter = (key: FilterKey) =>
    requests.filter((r) => r.status === key).length;

  const columns: Column<AdminRequest>[] = [
    {
      key: "company_name",
      header: "Société",
      render: (r) => <span className="font-bold">{r.company_name}</span>,
    },
    { key: "tax_id", header: "Matricule fiscal", render: (r) => r.tax_id },
    { key: "email", header: "Email", render: (r) => r.email },
    { key: "phone", header: "Téléphone", render: (r) => r.phone ?? "—" },
    {
      key: "created_at",
      header: "Date",
      render: (r) => formatDateWithYear(r.created_at),
    },
    {
      key: "status",
      header: "État",
      render: (r) => (
        <StatusBadge variant={STATUS_META[r.status].variant}>
          {STATUS_META[r.status].label}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      render: (r: AdminRequest) =>
        r.status === "pending" ? (
          <PendingActions request={r} onResult={setLastResult} />
        ) : (
          <DeleteRequestButton request={r} onResult={setLastResult} />
        ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl pb-20 lg:pb-0">
      {/* En-tête mobile (le titre bureau est dans la TopBar) */}
      <div className="mb-4 lg:hidden">
        <h1 className="text-2xl font-extrabold">Demandes</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Demandes d&apos;ajout d&apos;organisation
        </p>
      </div>

      {/* Filtres */}
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          const count = countByFilter(f.key);
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={active}
              className={`flex h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors lg:h-10 ${
                active
                  ? "bg-brand text-white"
                  : "bg-white text-neutral-600 shadow-sm shadow-neutral-900/5 hover:bg-neutral-50 dark:bg-card-dark dark:text-neutral-300 dark:hover:bg-neutral-800"
              }`}
            >
              {f.label}
              <span
                className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
                  active
                    ? "bg-white/20 text-white"
                    : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Résultat de la dernière action */}
      {lastResult?.success && (
        <p
          role="status"
          className="mb-4 flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
        >
          <CircleCheck size={18} className="mt-0.5 shrink-0" />
          {lastResult.success}
        </p>
      )}
      {lastResult?.error && (
        <p
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300"
        >
          <CircleAlert size={18} className="mt-0.5 shrink-0" />
          {lastResult.error}
        </p>
      )}

      {lastResult?.credentials && (
        <CredentialsModal
          credentials={lastResult.credentials}
          onClose={() =>
            setLastResult((prev) =>
              prev ? { ...prev, credentials: undefined } : prev
            )
          }
        />
      )}

      {/* Purge des demandes traitées du filtre courant */}
      {processed && filtered.length > 0 && (
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={() => setClearing(true)}
            className="flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-red-600 shadow-sm shadow-neutral-900/5 transition-colors hover:bg-red-50 lg:h-10 dark:bg-card-dark dark:text-red-400 dark:hover:bg-red-950/50"
          >
            <Trash2 size={16} />
            Tout effacer
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-sm text-neutral-500 shadow-sm shadow-neutral-900/5 dark:bg-card-dark dark:text-neutral-400">
          {filter === "pending"
            ? "Aucune demande en attente."
            : filter === "approved"
              ? "Aucune demande approuvée."
              : "Aucune demande refusée."}
        </p>
      ) : (
        <>
          {/* Bureau : tableau */}
          <div className="hidden lg:block">
            <DataTable columns={columns} rows={filtered} rowKey={(r) => r.id} />
          </div>

          {/* Mobile : cartes empilées (aucun défilement horizontal) */}
          <ul className="space-y-3 lg:hidden">
            {filtered.map((r) => (
              <li
                key={r.id}
                className="rounded-2xl bg-white p-4 shadow-sm shadow-neutral-900/5 dark:bg-card-dark"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{r.company_name}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {formatDateWithYear(r.created_at)}
                    </p>
                  </div>
                  <StatusBadge variant={STATUS_META[r.status].variant}>
                    {STATUS_META[r.status].label}
                  </StatusBadge>
                </div>

                <dl className="mt-3 space-y-1.5 border-t border-neutral-100 pt-3 text-sm dark:border-neutral-800">
                  {[
                    { label: "Matricule fiscal", value: r.tax_id },
                    { label: "Email", value: r.email },
                    { label: "Téléphone", value: r.phone ?? "—" },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between gap-3">
                      <dt className="shrink-0 text-neutral-500 dark:text-neutral-400">
                        {row.label}
                      </dt>
                      <dd className="min-w-0 truncate font-semibold">
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-3 border-t border-neutral-100 pt-3 dark:border-neutral-800">
                  {r.status === "pending" ? (
                    <PendingActions request={r} onResult={setLastResult} />
                  ) : (
                    <DeleteRequestButton request={r} onResult={setLastResult} />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {clearing && processed && (
        <ConfirmDialog
          title="Effacer les demandes traitées"
          message={`Les ${filtered.length} demande${filtered.length > 1 ? "s" : ""} ${
            filter === "approved" ? "approuvée" : "refusée"
          }${filtered.length > 1 ? "s" : ""} seront définitivement retirées de l'historique. Les organisations créées ne sont pas affectées.`}
          confirmLabel="Tout effacer"
          icon={Trash2}
          onConfirm={async () => {
            const result = await deleteProcessedRequests(
              filter as "approved" | "rejected"
            );
            if (result.error) return { error: result.error };
            setLastResult(result);
            setClearing(false);
          }}
          onClose={() => setClearing(false)}
        />
      )}
    </div>
  );
}
