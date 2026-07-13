import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check, Mail } from "lucide-react";
import PublicShell from "@/components/auth/PublicShell";

export const metadata: Metadata = {
  title: "Demande envoyée — Comptéo",
};

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <PublicShell>
      <div className="flex flex-col items-center text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/50">
          <Check size={36} className="text-emerald-600 dark:text-emerald-400" />
        </span>

        <h1 className="mt-6 text-2xl font-extrabold sm:text-3xl">
          Demande envoyée
        </h1>
        <p className="mt-3 max-w-md text-neutral-500 dark:text-neutral-400">
          Votre demande a bien été transmise. Vous recevrez vos identifiants de
          connexion par email après approbation de votre organisation.
        </p>

        {email && (
          <div className="mt-8 flex w-full items-center gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-left dark:border-neutral-700 dark:bg-neutral-900">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-neutral-800">
              <Mail size={20} className="text-brand" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                Un email de suivi a été envoyé à
              </p>
              <p className="truncate text-sm font-semibold text-brand">
                {email}
              </p>
            </div>
          </div>
        )}

        <Link
          href="/connexion"
          className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
        >
          <ArrowLeft size={16} />
          Retour à la connexion
        </Link>
      </div>
    </PublicShell>
  );
}
