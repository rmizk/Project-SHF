import type { Metadata } from "next";
import Link from "next/link";
import PublicShell from "@/components/auth/PublicShell";
import RequestForm from "./RequestForm";

export const metadata: Metadata = {
  title: "Demander l'ajout de mon organisation — Comptéo",
};

export default function DemandeOrganisationPage() {
  return (
    <PublicShell>
      <h1 className="text-2xl font-extrabold sm:text-3xl">
        Demander l&apos;ajout de mon organisation
      </h1>
      <p className="mt-2 text-neutral-500 dark:text-neutral-400">
        Renseignez les informations de votre société. Après approbation, vous
        recevrez vos identifiants de connexion par email.
      </p>

      <div className="mt-8">
        <RequestForm />
      </div>

      <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
        Déjà inscrit ?{" "}
        <Link href="/connexion" className="font-semibold text-brand hover:underline">
          Se connecter
        </Link>
      </p>
    </PublicShell>
  );
}
