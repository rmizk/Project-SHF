"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_ITEMS, isActiveAdminPath } from "./admin-navigation";

export default function AdminBottomNav({
  pendingCount,
}: {
  pendingCount: number;
}) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-neutral-800 dark:bg-card-dark lg:hidden">
      <ul className="flex">
        {ADMIN_NAV_ITEMS.map((item) => {
          const active = isActiveAdminPath(pathname, item.href);
          const Icon = item.icon;
          const showBadge = item.href === "/admin/demandes" && pendingCount > 0;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-1 py-2 text-[11px] font-medium ${
                  active ? "text-brand" : "text-neutral-400 dark:text-neutral-500"
                }`}
              >
                <span className="relative">
                  <Icon size={20} />
                  {showBadge && (
                    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                      {pendingCount}
                    </span>
                  )}
                </span>
                {item.shortLabel}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
