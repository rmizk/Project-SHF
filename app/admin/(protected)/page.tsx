import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  Inbox,
  PauseCircle,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatShortDate } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import AdminOrgAvatar from "@/components/admin/AdminOrgAvatar";

export const metadata: Metadata = {
  title: "Administration — Comptéo",
};

// « 16 juil. 2026 » depuis un timestamp ISO
function formatDateWithYear(iso: string): string {
  return `${formatShortDate(iso)} ${iso.slice(0, 4)}`;
}

export default async function AdminDashboardPage() {
  const admin = createAdminClient();
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const [active, pending, thisMonth, suspended, latest] = await Promise.all([
    admin
      .from("organizations")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    admin
      .from("organization_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    admin
      .from("organization_requests")
      .select("id", { count: "exact", head: true })
      .gte("created_at", monthStart.toISOString()),
    admin
      .from("organizations")
      .select("id", { count: "exact", head: true })
      .eq("status", "suspended"),
    admin
      .from("organizations")
      .select("id, org_code, name, logo_path, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const cardClass =
    "rounded-2xl bg-white p-5 shadow-sm shadow-neutral-900/5 dark:bg-card-dark";
  const cardTitle = "text-sm font-semibold text-neutral-500 dark:text-neutral-400";

  const cards = [
    {
      key: "actives",
      title: "Organisations actives",
      value: active.count ?? 0,
      icon: Building2,
      iconClass: "bg-brand/10 text-brand",
    },
    {
      key: "en-attente",
      title: "Demandes en attente",
      value: pending.count ?? 0,
      icon: Inbox,
      iconClass: "bg-orange-50 text-orange-500 dark:bg-orange-950/50",
      href: "/admin/demandes",
    },
    {
      key: "ce-mois",
      title: "Demandes reçues ce mois",
      value: thisMonth.count ?? 0,
      icon: CalendarClock,
      iconClass:
        "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
    },
    {
      key: "suspendues",
      title: "Organisations suspendues",
      value: suspended.count ?? 0,
      icon: PauseCircle,
      iconClass: "bg-red-50 text-red-500 dark:bg-red-950/50 dark:text-red-400",
    },
  ] as const;

  return (
    <div className="mx-auto max-w-6xl pb-20 lg:pb-0">
      {/* En-tête mobile (le titre bureau est dans la TopBar) */}
      <div className="mb-4 lg:hidden">
        <h1 className="text-2xl font-extrabold">Tableau de bord</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Administration de la plateforme
        </p>
      </div>

      {/* Les 4 cartes */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const body = (
            <>
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.iconClass}`}
                >
                  <Icon size={19} />
                </span>
                {"href" in card && (
                  <span className="flex items-center gap-1 text-xs font-bold text-brand">
                    Traiter
                    <ArrowRight size={13} />
                  </span>
                )}
              </div>
              <p className={`mt-4 ${cardTitle}`}>{card.title}</p>
              <p className="mt-1 text-2xl font-extrabold tracking-tight">
                {card.value}
              </p>
            </>
          );
          return "href" in card ? (
            <Link
              key={card.key}
              href={card.href}
              className={`${cardClass} transition-shadow hover:shadow-md`}
            >
              {body}
            </Link>
          ) : (
            <section key={card.key} className={cardClass}>
              {body}
            </section>
          );
        })}
      </div>

      {/* 5 dernières organisations créées */}
      <section className="mt-4 rounded-2xl bg-white shadow-sm shadow-neutral-900/5 lg:mt-5 dark:bg-card-dark">
        <div className="flex items-center justify-between gap-3 px-5 pt-5 lg:px-6">
          <h2 className="text-lg font-extrabold">Dernières organisations</h2>
          <Link
            href="/admin/organisations"
            className="flex items-center gap-1 text-sm font-bold text-brand hover:underline"
          >
            Tout voir
            <ArrowRight size={14} />
          </Link>
        </div>
        {!latest.data || latest.data.length === 0 ? (
          <p className="px-5 pb-6 pt-3 text-sm text-neutral-500 lg:px-6 dark:text-neutral-400">
            Aucune organisation créée pour l&apos;instant.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-neutral-100 px-5 pb-2 lg:px-6 dark:divide-neutral-800">
            {latest.data.map((org) => (
              <li key={org.id} className="flex items-center gap-3 py-3.5">
                <AdminOrgAvatar
                  name={org.name}
                  logoPath={org.logo_path}
                  className="h-10 w-10 rounded-xl text-xs"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{org.name}</span>
                  <span className="block text-sm text-neutral-500 dark:text-neutral-400">
                    {org.org_code} · créée le {formatDateWithYear(org.created_at)}
                  </span>
                </span>
                <StatusBadge
                  variant={org.status === "suspended" ? "warning" : "success"}
                >
                  {org.status === "suspended" ? "Suspendu" : "Actif"}
                </StatusBadge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
