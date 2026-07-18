"use client";

import { useTransition } from "react";
import { usePathname } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { adminSignOut } from "@/lib/auth/actions";
import { ADMIN_NAV_ITEMS, isActiveAdminPath } from "./admin-navigation";
import ThemeToggle from "@/components/ThemeToggle";

function pageTitle(pathname: string): string {
  const item = ADMIN_NAV_ITEMS.find((i) => isActiveAdminPath(pathname, i.href));
  return item?.label ?? "Administration";
}

export default function AdminTopBar() {
  const pathname = usePathname();
  const [isSigningOut, startSignOut] = useTransition();

  const signOutButton = (
    <button
      type="button"
      disabled={isSigningOut}
      onClick={() => startSignOut(() => adminSignOut())}
      className="flex h-11 items-center gap-2 rounded-xl px-3.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950/50"
    >
      {isSigningOut ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <LogOut size={16} />
      )}
      <span className="hidden sm:inline">Se déconnecter</span>
    </button>
  );

  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-card-dark">
      {/* Barre bureau */}
      <div className="hidden h-16 items-center gap-4 px-6 lg:flex">
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold">{pageTitle(pathname)}</h1>
          <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
            Administration ·{" "}
            {ADMIN_NAV_ITEMS.find((i) => isActiveAdminPath(pathname, i.href))
              ?.subtitle ?? "Gestion de la plateforme"}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {signOutButton}
        </div>
      </div>

      {/* Barre mobile */}
      <div className="flex h-14 items-center gap-2.5 px-4 lg:hidden">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
          <span className="h-2.5 w-2.5 rounded-full bg-sidebar" />
        </span>
        <span className="min-w-0">
          <span className="block text-lg font-bold leading-tight">Comptéo</span>
          <span className="block text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
            Admin
          </span>
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
          {signOutButton}
        </div>
      </div>
    </header>
  );
}
