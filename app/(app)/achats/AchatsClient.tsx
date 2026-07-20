"use client";

import { useMemo, useState } from "react";
import { FileText, Paperclip, Pencil, Plus, Search, Trash2 } from "lucide-react";
import MonthYearFilter from "@/components/MonthYearFilter";
import DataTable, { type Column } from "@/components/DataTable";
import RowActionsMenu from "@/components/RowActionsMenu";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Fab } from "@/components/Fab";
import {
  formatShortDate,
  formatTND,
  formatVatRate,
  monthName,
} from "@/lib/format";
import AddInvoiceModal from "./AddInvoiceModal";
import { deletePurchaseInvoice } from "./actions";

export type Supplier = { id: string; name: string };

export type Invoice = {
  id: string;
  invoice_number: string;
  invoice_date: string;
  amount_ht: number | string;
  vat_rate: number | string;
  amount_ttc: number | string;
  attachment_path: string | null;
  supplier: { id: string; name: string };
};

function supplierInitials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase();
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function SupplierAvatar({ name }: { name: string }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-xs font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
      {supplierInitials(name)}
    </span>
  );
}

function AttachmentButton({ invoice }: { invoice: Invoice }) {
  if (!invoice.attachment_path) {
    return (
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-100 text-neutral-400 lg:h-9 lg:w-9 dark:bg-neutral-800">
        —
      </span>
    );
  }
  return (
    <a
      href={`/achats/piece/${invoice.id}`}
      target="_blank"
      rel="noopener"
      aria-label={`Pièce jointe de la facture ${invoice.invoice_number}`}
      className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand/10 text-brand transition-colors hover:bg-brand/20 lg:h-9 lg:w-9"
    >
      <Paperclip size={16} />
    </a>
  );
}

export default function AchatsClient({
  invoices,
  suppliers,
  month,
  year,
  initialModalOpen = false,
}: {
  invoices: Invoice[];
  suppliers: Supplier[];
  month: number;
  year: number;
  initialModalOpen?: boolean;
}) {
  const [search, setSearch] = useState("");
  // Ouvert d'emblée depuis les actions rapides du tableau de bord (?ajouter=1)
  const [modalOpen, setModalOpen] = useState(initialModalOpen);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [deleting, setDeleting] = useState<Invoice | null>(null);

  const filtered = useMemo(() => {
    const q = normalize(search.trim());
    if (!q) return invoices;
    return invoices.filter(
      (inv) =>
        normalize(inv.supplier.name).includes(q) ||
        normalize(inv.invoice_number).includes(q)
    );
  }, [invoices, search]);

  const columns: Column<Invoice>[] = [
    {
      key: "supplier",
      header: "Fournisseur",
      render: (inv) => (
        <span className="flex items-center gap-3">
          <SupplierAvatar name={inv.supplier.name} />
          <span className="font-bold">{inv.supplier.name}</span>
        </span>
      ),
    },
    {
      key: "number",
      header: "N° facture",
      className: "font-semibold",
      render: (inv) => inv.invoice_number,
    },
    {
      key: "date",
      header: "Date",
      className: "text-neutral-500 dark:text-neutral-400",
      render: (inv) => formatShortDate(inv.invoice_date),
    },
    {
      key: "ht",
      header: "Montant HT",
      headerClassName: "text-right",
      className: "text-right font-bold",
      render: (inv) => formatTND(inv.amount_ht),
    },
    {
      key: "vat",
      header: "TVA",
      headerClassName: "text-right",
      className: "text-right text-neutral-500 dark:text-neutral-400",
      render: (inv) => formatVatRate(inv.vat_rate),
    },
    {
      key: "ttc",
      header: "TTC",
      headerClassName: "text-right",
      className: "text-right font-bold",
      render: (inv) => formatTND(inv.amount_ttc),
    },
    {
      key: "attachment",
      header: "Pièce",
      render: (inv) => <AttachmentButton invoice={inv} />,
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      render: (inv) => (
        <RowActionsMenu
          label={`Actions pour la facture ${inv.invoice_number}`}
          actions={[
            { label: "Modifier", icon: Pencil, onSelect: () => setEditing(inv) },
            {
              label: "Supprimer",
              icon: Trash2,
              variant: "danger",
              onSelect: () => setDeleting(inv),
            },
          ]}
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
            placeholder="Rechercher un fournisseur, un n° de facture…"
            className="h-12 w-full rounded-xl bg-white pl-11 pr-4 text-sm shadow-sm shadow-neutral-900/5 outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-brand/40 dark:bg-card-dark"
          />
        </label>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="hidden h-12 shrink-0 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white transition-colors hover:bg-brand-hover lg:flex"
        >
          <Plus size={18} />
          Ajouter une facture
        </button>
      </div>

      {/* Liste — pb-20 : le bouton flottant mobile ne recouvre pas la dernière ligne */}
      <div className="mt-4 pb-20 lg:pb-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-16 text-center shadow-sm shadow-neutral-900/5 dark:bg-card-dark">
            <span className="flex h-24 w-24 items-center justify-center rounded-3xl bg-neutral-100 dark:bg-neutral-800">
              <FileText size={36} className="text-neutral-400" />
            </span>
            {emptySearch ? (
              <>
                <h2 className="mt-6 text-xl font-extrabold">Aucun résultat</h2>
                <p className="mt-2 max-w-md text-neutral-500 dark:text-neutral-400">
                  Aucune facture ne correspond à «&nbsp;{search.trim()}&nbsp;»
                  pour ce mois.
                </p>
              </>
            ) : (
              <>
                <h2 className="mt-6 text-xl font-extrabold">
                  Aucune facture ce mois
                </h2>
                <p className="mt-2 max-w-md text-neutral-500 dark:text-neutral-400">
                  Aucune facture fournisseur n&apos;a été enregistrée pour{" "}
                  {monthName(month).toLowerCase()} {year}. Ajoutez-en une pour
                  commencer votre suivi.
                </p>
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="mt-7 flex h-12 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white transition-colors hover:bg-brand-hover"
                >
                  <Plus size={18} />
                  Ajouter une facture
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
                rowKey={(inv) => inv.id}
              />
            </div>

            {/* Mobile : cartes */}
            <ul className="space-y-3 lg:hidden">
              {filtered.map((inv) => (
                <li
                  key={inv.id}
                  className="rounded-2xl bg-white p-4 shadow-sm shadow-neutral-900/5 dark:bg-card-dark"
                >
                  <div className="flex items-center gap-3">
                    <SupplierAvatar name={inv.supplier.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{inv.supplier.name}</p>
                      <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">
                        {inv.invoice_number} · {formatShortDate(inv.invoice_date)}
                      </p>
                    </div>
                    {inv.attachment_path && <AttachmentButton invoice={inv} />}
                    <RowActionsMenu
                      label={`Actions pour la facture ${inv.invoice_number}`}
                      actions={[
                        {
                          label: "Modifier",
                          icon: Pencil,
                          onSelect: () => setEditing(inv),
                        },
                        {
                          label: "Supprimer",
                          icon: Trash2,
                          variant: "danger",
                          onSelect: () => setDeleting(inv),
                        },
                      ]}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800">
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      HT {formatTND(inv.amount_ht)} · TVA{" "}
                      {formatVatRate(inv.vat_rate)}
                    </p>
                    <p className="font-bold">{formatTND(inv.amount_ttc)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Mobile : FAB d'ajout au-dessus de la bottom nav */}
      <Fab label="Ajouter une facture" onClick={() => setModalOpen(true)} />
      {modalOpen && (
        <AddInvoiceModal
          suppliers={suppliers}
          month={month}
          year={year}
          onClose={() => setModalOpen(false)}
        />
      )}
      {editing && (
        <AddInvoiceModal
          suppliers={suppliers}
          month={month}
          year={year}
          invoice={editing}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title={`Supprimer la facture ${deleting.invoice_number} ?`}
          message={`La facture de ${deleting.supplier.name} et sa pièce jointe éventuelle seront définitivement supprimées. Cette action est irréversible.`}
          onConfirm={async () => {
            const result = await deletePurchaseInvoice(deleting.id);
            if (!result.error) setDeleting(null);
            return result;
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
