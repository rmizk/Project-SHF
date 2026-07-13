import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import PublicShell from "@/components/auth/PublicShell";
import ChangeForm from "./ChangeForm";

export const metadata: Metadata = {
  title: "Nouveau mot de passe — Comptéo",
};

export default function NouveauMotDePassePage() {
  return (
    <PublicShell>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10">
          <ShieldCheck size={22} className="text-brand" />
        </span>
        <h1 className="text-2xl font-extrabold sm:text-3xl">
          Sécurisez votre compte
        </h1>
      </div>
      <p className="text-neutral-500 dark:text-neutral-400">
        Première connexion : choisissez un nouveau mot de passe pour remplacer
        le mot de passe provisoire reçu par email.
      </p>

      <div className="mt-8">
        <ChangeForm />
      </div>
    </PublicShell>
  );
}
