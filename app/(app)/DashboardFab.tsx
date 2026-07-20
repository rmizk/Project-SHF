"use client";

import { useRouter } from "next/navigation";
import { DollarSign, Paperclip, ReceiptText } from "lucide-react";
import { SpeedDialFab } from "@/components/Fab";

// Actions rapides du tableau de bord (mobile) : chaque action ouvre le
// modal d'ajout du module concerné (paramètre ?ajouter=1).
export default function DashboardFab() {
  const router = useRouter();

  return (
    <SpeedDialFab
      label="Actions rapides"
      actions={[
        {
          label: "Nouvelle facture",
          icon: ReceiptText,
          onSelect: () => router.push("/achats?ajouter=1"),
        },
        {
          label: "Nouvel attachement",
          icon: Paperclip,
          onSelect: () => router.push("/services?ajouter=1"),
        },
        {
          label: "Nouvelle dépense",
          icon: DollarSign,
          onSelect: () => router.push("/depenses?ajouter=1"),
        },
      ]}
    />
  );
}
