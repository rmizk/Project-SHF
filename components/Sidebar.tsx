"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { NAV_ITEMS, isActivePath } from "./navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const profilActive = pathname.startsWith("/profil");

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-sidebar text-neutral-300 lg:flex">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 pb-6 pt-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
          <span className="h-2.5 w-2.5 rounded-full bg-sidebar" />
        </span>
        <span className="text-lg font-bold text-white">Comptéo</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
          Navigation
        </p>
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-brand text-white"
                      : "text-neutral-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Profil de l'organisation */}
      <div className="border-t border-white/10 p-3">
        <Link
          href="/profil"
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
            profilActive
              ? "bg-brand text-white"
              : "text-neutral-300 hover:bg-white/5 hover:text-white"
          }`}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-xs font-bold text-white">
            SM
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">
              SARL Meridian
            </span>
            <span
              className={`block text-xs ${profilActive ? "text-white/70" : "text-neutral-500"}`}
            >
              Organisation
            </span>
          </span>
          <ChevronRight size={16} className="shrink-0" />
        </Link>
      </div>
    </aside>
  );
}
