// Libellés et icônes des 5 types de paiements de comptabilité, partagés
// entre le module Comptabilité et le tableau de bord (serveur et client).
// قباضة est rendu en RTL local au mot via <bdi>.

import {
  CreditCard,
  FileText,
  Home,
  Lock,
  ShieldCheck,
} from "lucide-react";

export type PaymentType =
  | "tva"
  | "accountant_fees"
  | "qabadha"
  | "cnss"
  | "site_insurance";

export const PAYMENT_TYPE_META: Record<
  PaymentType,
  { label: string; suffix?: string; icon: typeof CreditCard }
> = {
  tva: { label: "TVA", icon: CreditCard },
  accountant_fees: { label: "Frais de comptable", icon: FileText },
  qabadha: { label: "قباضة", suffix: "(recette)", icon: Home },
  cnss: { label: "CNSS", icon: ShieldCheck },
  site_insurance: { label: "Assurance chantier", icon: Lock },
};

export function PaymentTypeLabel({
  type,
  withSuffix = true,
}: {
  type: PaymentType;
  withSuffix?: boolean;
}) {
  const meta = PAYMENT_TYPE_META[type];
  return (
    <>
      <bdi dir={type === "qabadha" ? "rtl" : undefined}>{meta.label}</bdi>
      {withSuffix && meta.suffix ? ` ${meta.suffix}` : null}
    </>
  );
}
