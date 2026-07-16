"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Plus, Search } from "lucide-react";
import { NAV_ITEMS, isActivePath } from "./navigation";
import { monthLabel } from "@/lib/format";
import ThemeToggle from "./ThemeToggle";
import { useOrganization } from "./OrganizationProvider";
import OrgAvatar from "./OrgAvatar";

function pageTitle(pathname: string): string {
  if (pathname.startsWith("/profil")) return "Profil";
  const item = NAV_ITEMS.find((i) => isActivePath(pathname, i.href));
  return item?.label ?? "Comptéo";
}

function pageSubtitle(pathname: string): string | undefined {
  if (pathname.startsWith("/profil")) return "Organisation";
  if (pathname === "/") {
    const now = new Date();
    return monthLabel(now.getMonth() + 1, now.getFullYear());
  }
  return NAV_ITEMS.find((i) => isActivePath(pathname, i.href))?.subtitle;
}

// Actions rapides du tableau de bord : ouvrent les modals des modules
// (pas de concept d'« écriture »).
const QUICK_ACTIONS = [
  { href: "/achats?ajouter=1", label: "Facture", primary: true },
  { href: "/services?ajouter=1", label: "Attachement", primary: false },
  { href: "/depenses?ajouter=1", label: "Dépense", primary: false },
] as const;

export default function TopBar() {
  const pathname = usePathname();
  const organization = useOrganization();

  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-card-dark">
      {/* Barre bureau */}
      <div className="hidden h-16 items-center gap-4 px-6 lg:flex">
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold">{pageTitle(pathname)}</h1>
          <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
            {organization.name} · {pageSubtitle(pathname) ?? organization.org_code}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <label className="relative hidden md:block">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="search"
              placeholder="Rechercher une écriture…"
              className="h-9 w-64 rounded-lg border border-neutral-200 bg-neutral-50 pl-9 pr-3 text-sm outline-none placeholder:text-neutral-400 focus:border-brand dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <button
            type="button"
            aria-label="Notifications"
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            <Bell size={18} />
          </button>
          {pathname === "/" &&
            QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={`flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-sm font-bold transition-colors ${
                  action.primary
                    ? "bg-brand text-white hover:bg-brand-hover"
                    : "border border-neutral-200 text-brand hover:bg-brand/5 dark:border-neutral-700"
                }`}
              >
                <Plus size={15} />
                {action.label}
              </Link>
            ))}
          <ThemeToggle />
          <Link href="/profil" aria-label="Profil de l'organisation">
            <OrgAvatar
              organization={organization}
              className="h-9 w-9 rounded-lg text-xs"
            />
          </Link>
        </div>
      </div>

      {/* Barre mobile */}
      <div className="flex h-14 items-center gap-2.5 px-4 lg:hidden">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
          <span className="h-2.5 w-2.5 rounded-full bg-sidebar" />
        </span>
        <span className="text-lg font-bold">Comptéo</span>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Notifications"
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            <Bell size={18} />
          </button>
          <ThemeToggle />
          <Link href="/profil" aria-label="Profil de l'organisation">
            <OrgAvatar
              organization={organization}
              className="h-9 w-9 rounded-lg text-xs"
            />
          </Link>
        </div>
      </div>
    </header>
  );
}
