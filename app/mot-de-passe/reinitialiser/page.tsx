import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CircleAlert } from "lucide-react";
import PublicShell from "@/components/auth/PublicShell";
import ResetForm from "./ResetForm";

export const metadata: Metadata = {
  title: "Réinitialiser le mot de passe — Comptéo",
};

export default async function ReinitialiserPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <PublicShell>
      <h1 className="text-2xl font-extrabold sm:text-3xl">
        Réinitialiser le mot de passe
      </h1>

      {token ? (
        <>
          <p className="mt-2 text-neutral-500 dark:text-neutral-400">
            Choisissez un nouveau mot de passe pour votre organisation.
          </p>
          <div className="mt-8">
            <ResetForm token={token} />
          </div>
        </>
      ) : (
        <p
          role="alert"
          className="mt-6 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300"
        >
          <CircleAlert size={18} className="mt-0.5 shrink-0" />
          Ce lien de réinitialisation est incomplet. Ouvrez le lien reçu par
          email, ou refaites une demande depuis « Mot de passe oublié ? ».
        </p>
      )}

      <p className="mt-6 text-center">
        <Link
          href="/connexion"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
        >
          <ArrowLeft size={16} />
          Retour à la connexion
        </Link>
      </p>
    </PublicShell>
  );
}
