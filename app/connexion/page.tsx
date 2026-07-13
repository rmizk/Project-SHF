import type { Metadata } from "next";
import Link from "next/link";
import AuthLogo from "@/components/auth/AuthLogo";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Connexion — Comptéo",
};

function NewCompanyLink() {
  return (
    <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
      Votre société n&apos;est pas encore inscrite ?{" "}
      <Link
        href="/demande-organisation"
        className="block font-semibold text-brand hover:underline sm:inline"
      >
        Demander l&apos;ajout de mon organisation
      </Link>
    </p>
  );
}

export default function ConnexionPage() {
  return (
    <main className="min-h-screen lg:flex lg:items-center lg:justify-center lg:p-10">
      <div className="w-full lg:grid lg:max-w-6xl lg:min-h-[640px] lg:grid-cols-2 lg:overflow-hidden lg:rounded-3xl lg:shadow-xl lg:shadow-neutral-900/10">
        {/* Panneau sombre : héros mobile / moitié gauche bureau */}
        <section className="relative overflow-hidden bg-sidebar px-6 pb-12 pt-8 text-white lg:flex lg:flex-col lg:p-10">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-accent/15 blur-3xl"
          />
          <AuthLogo />

          <div className="mt-8 lg:my-auto lg:pb-16">
            <span className="mb-5 hidden rounded-full bg-white/10 px-4 py-1.5 text-sm text-neutral-300 lg:inline-flex">
              Plateforme de gestion financière
            </span>
            <h2 className="text-3xl font-extrabold leading-tight lg:text-4xl">
              La comptabilité de votre société, maîtrisée.
            </h2>
            <p className="mt-4 hidden max-w-sm text-neutral-400 lg:block">
              Suivez votre trésorerie, votre TVA et vos dépenses en temps réel,
              en toute conformité.
            </p>
          </div>

          <div className="hidden items-center gap-6 lg:flex">
            <div>
              <p className="text-2xl font-extrabold">1 240+</p>
              <p className="text-sm text-neutral-400">sociétés</p>
            </div>
            <div className="h-10 w-px bg-white/15" />
            <div>
              <p className="text-2xl font-extrabold">99,9 %</p>
              <p className="text-sm text-neutral-400">disponibilité</p>
            </div>
          </div>
        </section>

        {/* Formulaire : carte flottante en mobile / moitié droite en bureau */}
        <section className="px-4 pb-10 lg:flex lg:flex-col lg:justify-center lg:bg-white lg:p-14 lg:dark:bg-card-dark">
          <div className="mx-auto -mt-6 w-full max-w-md rounded-2xl bg-white p-6 shadow-lg shadow-neutral-900/5 sm:p-8 lg:mt-0 lg:max-w-none lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none dark:bg-card-dark lg:dark:bg-transparent">
            <h1 className="text-2xl font-extrabold lg:text-3xl">Connexion</h1>
            <p className="mt-1.5 text-neutral-500 dark:text-neutral-400">
              Accédez à l&apos;espace de votre organisation.
            </p>
            <div className="mt-7">
              <LoginForm />
            </div>

            {/* Bureau : séparateur + lien dans le panneau */}
            <div className="hidden lg:block">
              <div className="my-8 flex items-center gap-4">
                <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
                <span className="text-sm text-neutral-400">nouvelle société ?</span>
                <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
              </div>
              <NewCompanyLink />
            </div>
          </div>

          {/* Mobile : lien sous la carte */}
          <div className="mt-10 lg:hidden">
            <NewCompanyLink />
          </div>
        </section>
      </div>
    </main>
  );
}
