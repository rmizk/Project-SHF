"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  PauseCircle,
  PlayCircle,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import RowActionsMenu, { type RowAction } from "@/components/RowActionsMenu";
import ConfirmDialog from "@/components/ConfirmDialog";
import Modal from "@/components/Modal";
import AdminOrgAvatar from "@/components/admin/AdminOrgAvatar";
import CopyButton from "@/components/admin/CopyButton";
import { formatShortDate } from "@/lib/format";
import {
  deleteOrganization,
  setOrganizationStatus,
} from "@/lib/admin/actions";

export type AdminOrganization = {
  id: string;
  org_code: string;
  name: string;
  tax_id: string;
  email: string | null;
  logo_path: string | null;
  status: "active" | "suspended";
  created_at: string;
  temp_password: string | null;
};

// ------------------------------------------------------------
// Mot de passe temporaire : masqué par défaut, œil pour afficher,
// bouton copier. NULL = l'utilisateur a déjà choisi le sien.
// ------------------------------------------------------------
function TempPasswordCell({ password }: { password: string | null }) {
  const [visible, setVisible] = useState(false);

  if (!password) {
    return (
      <span className="text-neutral-400 dark:text-neutral-500">
        Modifié par l&apos;utilisateur
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1">
      <span className="font-mono font-semibold">
        {visible ? password : "●●●●●●"}
      </span>
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={
          visible ? "Masquer le mot de passe" : "Afficher le mot de passe"
        }
        title={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
      <CopyButton value={password} label="Copier le mot de passe" />
    </span>
  );
}

// « 16 juil. 2026 » depuis un timestamp ISO
function formatDateWithYear(iso: string): string {
  return `${formatShortDate(iso)} ${iso.slice(0, 4)}`;
}

// ------------------------------------------------------------
// Suppression définitive : le nom exact doit être saisi
// ------------------------------------------------------------
function DeleteOrganizationModal({
  organization,
  onClose,
}: {
  organization: AdminOrganization;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameMatches = name.trim() === organization.name.trim();

  async function confirm() {
    setPending(true);
    setError(null);
    const result = await deleteOrganization(organization.id, name);
    if (result.error) {
      setError(result.error);
      setPending(false);
    } else {
      onClose();
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Supprimer définitivement"
      subtitle={`${organization.name} · ${organization.org_code}`}
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="h-12 flex-1 rounded-xl border border-neutral-200 text-sm font-bold transition-colors hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={!nameMatches || pending}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
            Supprimer définitivement
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <p className="flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
          <TriangleAlert size={18} className="mt-0.5 shrink-0" />
          Cette action est irréversible : toutes les données financières de
          l&apos;organisation (factures, attachements, dépenses, paiements,
          fichiers) seront effacées, et son compte de connexion supprimé.
        </p>

        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <div>
          <label
            htmlFor="confirm-name"
            className="mb-2 block text-sm font-semibold text-neutral-900 dark:text-neutral-100"
          >
            Pour confirmer, saisissez le nom exact de l&apos;organisation :{" "}
            <span className="font-extrabold">{organization.name}</span>
          </label>
          <input
            id="confirm-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={organization.name}
            autoFocus
            className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-red-500 focus:bg-white dark:border-neutral-700 dark:bg-neutral-900 dark:focus:bg-neutral-900"
          />
        </div>
      </div>
    </Modal>
  );
}

// ------------------------------------------------------------
// Ligne : menu ⋮ + dialogues
// ------------------------------------------------------------
function RowActions({ organization }: { organization: AdminOrganization }) {
  const [dialog, setDialog] = useState<"toggle" | "delete" | null>(null);
  const suspended = organization.status === "suspended";

  const actions: RowAction[] = [
    {
      label: suspended ? "Réactiver" : "Suspendre",
      icon: suspended ? PlayCircle : PauseCircle,
      onSelect: () => setDialog("toggle"),
    },
    {
      label: "Supprimer définitivement",
      icon: Trash2,
      variant: "danger",
      onSelect: () => setDialog("delete"),
    },
  ];

  return (
    <>
      <RowActionsMenu
        label={`Actions pour ${organization.name}`}
        actions={actions}
      />
      {dialog === "toggle" && (
        <ConfirmDialog
          title={suspended ? "Réactiver l'organisation" : "Suspendre l'organisation"}
          message={
            suspended
              ? `${organization.name} pourra de nouveau se connecter et utiliser l'application.`
              : `${organization.name} ne pourra plus se connecter tant qu'elle est suspendue. Ses données sont conservées.`
          }
          confirmLabel={suspended ? "Réactiver" : "Suspendre"}
          icon={suspended ? PlayCircle : PauseCircle}
          variant={suspended ? "primary" : "danger"}
          onConfirm={async () => {
            const result = await setOrganizationStatus(
              organization.id,
              suspended ? "active" : "suspended"
            );
            if (result.error) return { error: result.error };
            setDialog(null);
          }}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "delete" && (
        <DeleteOrganizationModal
          organization={organization}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  );
}

// ------------------------------------------------------------
// Page
// ------------------------------------------------------------
export default function OrganisationsClient({
  organizations,
}: {
  organizations: AdminOrganization[];
}) {
  // Après revalidation serveur, les props changent : rien à synchroniser ici.
  const columns: Column<AdminOrganization>[] = [
    {
      key: "name",
      header: "Organisation",
      render: (org) => (
        <span className="flex items-center gap-3">
          <AdminOrgAvatar
            name={org.name}
            logoPath={org.logo_path}
            className="h-9 w-9 rounded-lg text-xs"
          />
          <span className="font-bold">{org.name}</span>
        </span>
      ),
    },
    {
      key: "org_code",
      header: "Org ID",
      render: (org) => (
        <span className="font-semibold text-neutral-500 dark:text-neutral-400">
          {org.org_code}
        </span>
      ),
    },
    { key: "tax_id", header: "Matricule fiscal", render: (org) => org.tax_id },
    {
      key: "email",
      header: "Email",
      render: (org) => org.email ?? "—",
    },
    {
      key: "temp_password",
      header: "Mot de passe temporaire",
      render: (org) => <TempPasswordCell password={org.temp_password} />,
    },
    {
      key: "created_at",
      header: "Création",
      render: (org) => formatDateWithYear(org.created_at),
    },
    {
      key: "status",
      header: "Statut",
      render: (org) => (
        <StatusBadge variant={org.status === "suspended" ? "warning" : "success"}>
          {org.status === "suspended" ? "Suspendu" : "Actif"}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "w-12 text-right",
      render: (org) => <RowActions organization={org} />,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl pb-20 lg:pb-0">
      {/* En-tête mobile (le titre bureau est dans la TopBar) */}
      <div className="mb-4 lg:hidden">
        <h1 className="text-2xl font-extrabold">Organisations</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {organizations.length} organisation{organizations.length > 1 ? "s" : ""}
        </p>
      </div>

      {organizations.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-sm text-neutral-500 shadow-sm shadow-neutral-900/5 dark:bg-card-dark dark:text-neutral-400">
          Aucune organisation : approuvez une demande pour créer la première.
        </p>
      ) : (
        <>
          {/* Bureau : tableau */}
          <div className="hidden lg:block">
            <DataTable
              columns={columns}
              rows={organizations}
              rowKey={(org) => org.id}
            />
          </div>

          {/* Mobile : cartes empilées (aucun défilement horizontal) */}
          <ul className="space-y-3 lg:hidden">
            {organizations.map((org) => (
              <li
                key={org.id}
                className="rounded-2xl bg-white p-4 shadow-sm shadow-neutral-900/5 dark:bg-card-dark"
              >
                <div className="flex items-center gap-3">
                  <AdminOrgAvatar
                    name={org.name}
                    logoPath={org.logo_path}
                    className="h-10 w-10 rounded-xl text-xs"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{org.name}</p>
                    <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">
                      {org.org_code} · {formatDateWithYear(org.created_at)}
                    </p>
                  </div>
                  <StatusBadge
                    variant={org.status === "suspended" ? "warning" : "success"}
                  >
                    {org.status === "suspended" ? "Suspendu" : "Actif"}
                  </StatusBadge>
                  <RowActions organization={org} />
                </div>

                <dl className="mt-3 space-y-1.5 border-t border-neutral-100 pt-3 text-sm dark:border-neutral-800">
                  <div className="flex justify-between gap-3">
                    <dt className="shrink-0 text-neutral-500 dark:text-neutral-400">
                      Matricule fiscal
                    </dt>
                    <dd className="min-w-0 truncate font-semibold">
                      {org.tax_id}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="shrink-0 text-neutral-500 dark:text-neutral-400">
                      Email
                    </dt>
                    <dd className="min-w-0 truncate font-semibold">
                      {org.email ?? "—"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="shrink-0 text-neutral-500 dark:text-neutral-400">
                      Mot de passe
                    </dt>
                    <dd className="min-w-0">
                      <TempPasswordCell password={org.temp_password} />
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
