"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { ADMIN_NAV_ITEMS, isActiveAdminPath } from "./admin-navigation";

// Sidebar de la zone /admin : mêmes styles que la Sidebar de l'application,
// avec le badge compteur des demandes en attente sur « Demandes ».
export default function AdminSidebar({
  pendingCount,
}: {
  pendingCount: number;
}) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-neutral-200 bg-white lg:flex dark:border-transparent dark:bg-sidebar dark:text-neutral-300">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 pb-6 pt-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
          <span className="h-2.5 w-2.5 rounded-full bg-sidebar" />
        </span>
        <span className="min-w-0">
          <span className="block text-lg font-bold leading-tight text-neutral-900 dark:text-white">
            Comptéo
          </span>
          <span className="block text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
            Administration
          </span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
          Navigation
        </p>
        <ul className="space-y-1">
          {ADMIN_NAV_ITEMS.map((item) => {
            const active = isActiveAdminPath(pathname, item.href);
            const Icon = item.icon;
            const showBadge = item.href === "/admin/demandes" && pendingCount > 0;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-brand text-white"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                  <span className="flex-1">{item.label}</span>
                  {showBadge && (
                    <span
                      className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
                        active ? "bg-white text-brand" : "bg-brand text-white"
                      }`}
                    >
                      {pendingCount}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Rappel du rôle */}
      <div className="border-t border-neutral-200 p-3 dark:border-white/10">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-neutral-700 dark:text-neutral-300">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <ShieldCheck size={16} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">
              Super admin
            </span>
            <span className="block text-xs text-neutral-400 dark:text-neutral-500">
              Accès complet
            </span>
          </span>
        </div>
      </div>
    </aside>
  );
}
