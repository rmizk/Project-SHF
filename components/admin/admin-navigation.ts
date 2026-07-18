import { Building2, Inbox, LayoutGrid, type LucideIcon } from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  subtitle?: string;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin", label: "Tableau de bord", shortLabel: "Bord", icon: LayoutGrid },
  {
    href: "/admin/organisations",
    label: "Organisations",
    shortLabel: "Orgs",
    icon: Building2,
    subtitle: "Comptes clients",
  },
  {
    href: "/admin/demandes",
    label: "Demandes",
    shortLabel: "Demandes",
    icon: Inbox,
    subtitle: "Demandes d'ajout",
  },
];

export function isActiveAdminPath(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}
