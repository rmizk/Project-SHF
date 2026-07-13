import {
  LayoutGrid,
  ShoppingCart,
  Wrench,
  FileText,
  DollarSign,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  shortLabel: string; // libellé de la bottom nav mobile
  icon: LucideIcon;
  subtitle?: string; // sous-titre affiché dans la TopBar bureau
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Tableau de bord", shortLabel: "Bord", icon: LayoutGrid },
  {
    href: "/achats",
    label: "Achats",
    shortLabel: "Achats",
    icon: ShoppingCart,
    subtitle: "Factures fournisseurs",
  },
  { href: "/services", label: "Services", shortLabel: "Services", icon: Wrench },
  { href: "/comptabilite", label: "Comptabilité", shortLabel: "Compta", icon: FileText },
  { href: "/depenses", label: "Dépenses", shortLabel: "Dépenses", icon: DollarSign },
];

export function isActivePath(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
