"use client";

import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wrench,
} from "lucide-react";
import MonthYearFilter from "@/components/MonthYearFilter";
import DataTable, { type Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import RowActionsMenu from "@/components/RowActionsMenu";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Fab } from "@/components/Fab";
import {
  formatShortDate,
  formatTND,
  formatVatRate,
  monthName,
} from "@/lib/format";
import AddAttachementModal from "./AddAttachementModal";
import PaymentModal from "./PaymentModal";
import { deleteAttachement } from "./actions";

export type Client = { id: string; name: string };

export type Deduction = { id: string; label: string; amount: number | string };

export type Attachement = {
  id: string;
  amount_ht: number | string;
  vat_rate: number | string;
  attachement_date: string;
  status: "pending" | "paid";
  paid_at: string | null;
  net_profit: number | string | null;
  client: { id: string; name: string };
  deductions: Deduction[];
};

function clientInitials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase();
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function ClientAvatar({ name }: { name: string }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-xs font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
      {clientInitials(name)}
    </span>
  );
}

function NetProfit({ attachement }: { attachement: Attachement }) {
  if (attachement.status === "paid" && attachement.net_profit !== null) {
    return (
      <span className="font-bold text-emerald-600 dark:text-emerald-400">
        {formatTND(attachement.net_profit)}
      </span>
    );
  }
  if (attachement.status === "paid") {
    return (
      <span className="font-bold text-neutral-400">Net à définir</span>
    );
  }
  return <span className="text-neutral-300 dark:text-neutral-600">—</span>;
}

// Menu « ⋮ » d'une ligne : paiement/retenues + modifier + supprimer,
// via le RowActionsMenu partagé (portal : jamais rogné par l'overflow).
function AttachementMenu({
  attachement,
  onRecordPayment,
  onEdit,
  onDelete,
}: {
  attachement: Attachement;
  onRecordPayment: (a: Attachement) => void;
  onEdit: (a: Attachement) => void;
  onDelete: (a: Attachement) => void;
}) {
  return (
    <RowActionsMenu
      label={`Actions pour ${attachement.client.name}`}
      actions={[
        {
          label:
            attachement.status === "pending"
              ? "Enregistrer le paiement"
              : "Modifier les retenues",
          icon: BadgeCheck,
          onSelect: () => onRecordPayment(attachement),
        },
        { label: "Modifier", icon: Pencil, onSelect: () => onEdit(attachement) },
        {
          label: "Supprimer",
          icon: Trash2,
          variant: "danger",
          onSelect: () => onDelete(attachement),
        },
      ]}
    />
  );
}

export default function ServicesClient({
  attachements,
  clients,
  month,
  year,
  initialAddOpen = false,
}: {
  attachements: Attachement[];
  clients: Client[];
  month: number;
  year: number;
  initialAddOpen?: boolean;
}) {
  const [search, setSearch] = useState("");
  // Ouvert d'emblée depuis les actions rapides du tableau de bord (?ajouter=1)
  const [addOpen, setAddOpen] = useState(initialAddOpen);
  const [paymentFor, setPaymentFor] = useState<Attachement | null>(null);
  const [editing, setEditing] = useState<Attachement | null>(null);
  const [deleting, setDeleting] = useState<Attachement | null>(null);

  const filtered = useMemo(() => {
    const q = normalize(search.trim());
    if (!q) return attachements;
    return attachements.filter((a) => normalize(a.client.name).includes(q));
  }, [attachements, search]);

  const columns: Column<Attachement>[] = [
    {
      key: "client",
      header: "Client",
      render: (a) => (
        <span className="flex items-center gap-3">
          <ClientAvatar name={a.client.name} />
          <span className="font-bold">{a.client.name}</span>
        </span>
      ),
    },
    {
      key: "ht",
      header: "Montant HT",
      headerClassName: "text-right",
      className: "text-right font-bold",
      render: (a) => formatTND(a.amount_ht),
    },
    {
      key: "vat",
      header: "TVA",
      headerClassName: "text-right",
      className: "text-right text-neutral-500 dark:text-neutral-400",
      render: (a) => formatVatRate(a.vat_rate),
    },
    {
      key: "date",
      header: "Date",
      className: "text-neutral-500 dark:text-neutral-400",
      render: (a) => formatShortDate(a.attachement_date),
    },
    {
      key: "status",
      header: "État",
      render: (a) =>
        a.status === "paid" ? (
          <StatusBadge variant="success">Payé</StatusBadge>
        ) : (
          <StatusBadge variant="warning">En attente</StatusBadge>
        ),
    },
    {
      key: "net",
      header: "Bénéfice net",
      headerClassName: "text-right",
      className: "text-right",
      render: (a) => <NetProfit attachement={a} />,
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      render: (a) => (
        <AttachementMenu
          attachement={a}
          onRecordPayment={setPaymentFor}
          onEdit={setEditing}
          onDelete={setDeleting}
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
            placeholder="Rechercher un client…"
            className="h-12 w-full rounded-xl bg-white pl-11 pr-4 text-sm shadow-sm shadow-neutral-900/5 outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-brand/40 dark:bg-card-dark"
          />
        </label>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="hidden h-12 shrink-0 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white transition-colors hover:bg-brand-hover lg:flex"
        >
          <Plus size={18} />
          Ajouter un attachement
        </button>
      </div>

      {/* Liste — pb-20 : le bouton flottant mobile ne recouvre pas la dernière ligne */}
      <div className="mt-4 pb-20 lg:pb-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-16 text-center shadow-sm shadow-neutral-900/5 dark:bg-card-dark">
            <span className="flex h-24 w-24 items-center justify-center rounded-3xl bg-neutral-100 dark:bg-neutral-800">
              <Wrench size={36} className="text-neutral-400" />
            </span>
            {emptySearch ? (
              <>
                <h2 className="mt-6 text-xl font-extrabold">Aucun résultat</h2>
                <p className="mt-2 max-w-md text-neutral-500 dark:text-neutral-400">
                  Aucun attachement ne correspond à «&nbsp;{search.trim()}&nbsp;»
                  pour ce mois.
                </p>
              </>
            ) : (
              <>
                <h2 className="mt-6 text-xl font-extrabold">
                  Aucun attachement ce mois
                </h2>
                <p className="mt-2 max-w-md text-neutral-500 dark:text-neutral-400">
                  Aucun attachement client n&apos;a été enregistré pour{" "}
                  {monthName(month).toLowerCase()} {year}. Ajoutez-en un pour
                  suivre vos prestations.
                </p>
                <button
                  type="button"
                  onClick={() => setAddOpen(true)}
                  className="mt-7 flex h-12 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white transition-colors hover:bg-brand-hover"
                >
                  <Plus size={18} />
                  Ajouter un attachement
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
                rowKey={(a) => a.id}
              />
            </div>

            {/* Mobile : cartes */}
            <ul className="space-y-3 lg:hidden">
              {filtered.map((a) => (
                <li
                  key={a.id}
                  className="rounded-2xl bg-white p-4 shadow-sm shadow-neutral-900/5 dark:bg-card-dark"
                >
                  <div className="flex items-center gap-3">
                    <ClientAvatar name={a.client.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{a.client.name}</p>
                      <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">
                        {formatShortDate(a.attachement_date)} · TVA{" "}
                        {formatVatRate(a.vat_rate)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPaymentFor(a)}
                      aria-label={
                        a.status === "pending"
                          ? `Enregistrer le paiement de ${a.client.name}`
                          : `Modifier les retenues de ${a.client.name}`
                      }
                    >
                      {a.status === "paid" ? (
                        <StatusBadge variant="success">Payé</StatusBadge>
                      ) : (
                        <StatusBadge variant="warning">En attente</StatusBadge>
                      )}
                    </button>
                    <AttachementMenu
                      attachement={a}
                      onRecordPayment={setPaymentFor}
                      onEdit={setEditing}
                      onDelete={setDeleting}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800">
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      HT {formatTND(a.amount_ht)}
                    </p>
                    <p className="text-sm">
                      {a.status === "paid" && a.net_profit !== null ? (
                        <>
                          <span className="text-neutral-400">Net </span>
                          <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                            {formatTND(a.net_profit)}
                          </span>
                        </>
                      ) : (
                        <span className="font-bold text-neutral-400">
                          Net à définir
                        </span>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Mobile : FAB d'ajout au-dessus de la bottom nav */}
      <Fab label="Ajouter un attachement" onClick={() => setAddOpen(true)} />
      {addOpen && (
        <AddAttachementModal
          clients={clients}
          month={month}
          year={year}
          onClose={() => setAddOpen(false)}
        />
      )}
      {paymentFor && (
        <PaymentModal
          attachement={paymentFor}
          onClose={() => setPaymentFor(null)}
        />
      )}
      {editing && (
        <AddAttachementModal
          clients={clients}
          month={month}
          year={year}
          attachement={editing}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title={`Supprimer l'attachement de ${deleting.client.name} ?`}
          message={`L'attachement du ${formatShortDate(deleting.attachement_date)} (${formatTND(deleting.amount_ht)} TND HT) et ses retenues seront définitivement supprimés. Cette action est irréversible.`}
          onConfirm={async () => {
            const result = await deleteAttachement(deleting.id);
            if (!result.error) setDeleting(null);
            return result;
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
