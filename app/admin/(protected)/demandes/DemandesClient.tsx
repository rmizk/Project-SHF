"use client";

import { useState } from "react";
import { Check, CircleAlert, CircleCheck, X } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable";
import StatusBadge, { type StatusVariant } from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import { formatShortDate } from "@/lib/format";
import {
  approveRequest,
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
      <button
        type="button"
        onClick={() => setDialog("approve")}
        className="flex h-11 items-center gap-1.5 rounded-xl bg-brand px-3.5 text-sm font-bold text-white transition-colors hover:bg-brand-hover lg:h-9"
      >
        <Check size={15} />
        Approuver
      </button>
      <button
        type="button"
        onClick={() => setDialog("reject")}
        className="flex h-11 items-center gap-1.5 rounded-xl border border-neutral-200 px-3.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-50 lg:h-9 dark:border-neutral-700 dark:text-red-400 dark:hover:bg-red-950/50"
      >
        <X size={15} />
        Refuser
      </button>

      {dialog === "approve" && (
        <ConfirmDialog
          title="Approuver la demande"
          message={`Une organisation sera créée pour ${request.company_name} et ses identifiants de connexion seront envoyés à ${request.email}.`}
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
// Page
// ------------------------------------------------------------
export default function DemandesClient({
  requests,
}: {
  requests: AdminRequest[];
}) {
  const [filter, setFilter] = useState<FilterKey>("pending");
  const [lastResult, setLastResult] = useState<AdminActionState | null>(null);

  const filtered = requests.filter((r) => r.status === filter);
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
    ...(filter === "pending"
      ? [
          {
            key: "actions",
            header: <span className="sr-only">Actions</span>,
            className: "text-right",
            render: (r: AdminRequest) => (
              <PendingActions request={r} onResult={setLastResult} />
            ),
          } satisfies Column<AdminRequest>,
        ]
      : []),
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

      {filtered.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-sm text-neutral-500 shadow-sm shadow-neutral-900/5 dark:bg-card-dark dark:text-neutral-400">
          {filter === "pending"
            ? "Aucune demande en attente."
            : filter === "approved"
              ? "Aucune demande approuvée."
              : "Aucune demande refusée."}
        </p>
      ) : (
        <DataTable columns={columns} rows={filtered} rowKey={(r) => r.id} />
      )}
    </div>
  );
}
