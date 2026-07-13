import AuthLogo from "./AuthLogo";

// Coquille des pages publiques (formulaire d'ajout, confirmation,
// réinitialisation…) : carte centrée avec bandeau sombre Comptéo.
export default function PublicShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="flex min-h-screen items-start justify-center px-4 py-8 sm:items-center sm:py-12">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-xl shadow-neutral-900/5 dark:bg-card-dark">
        <div className="relative overflow-hidden bg-sidebar px-8 py-9">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-24 h-56 w-56 rounded-full bg-accent/15 blur-3xl"
          />
          <AuthLogo />
        </div>
        <div className="px-6 py-8 sm:px-10 sm:py-10">{children}</div>
      </div>
    </main>
  );
}
