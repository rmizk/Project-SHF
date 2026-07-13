import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PublicShell from "@/components/auth/PublicShell";
import ForgotForm from "./ForgotForm";

export const metadata: Metadata = {
  title: "Mot de passe oublié — Comptéo",
};

export default function MotDePasseOubliePage() {
  return (
    <PublicShell>
      <h1 className="text-2xl font-extrabold sm:text-3xl">
        Mot de passe oublié ?
      </h1>
      <p className="mt-2 text-neutral-500 dark:text-neutral-400">
        Saisissez l&apos;identifiant de votre organisation. Un lien de
        réinitialisation sera envoyé à l&apos;adresse email de contact de la
        société.
      </p>

      <div className="mt-8">
        <ForgotForm />
      </div>

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
