import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import AdminLoginForm from "./AdminLoginForm";

export const metadata: Metadata = {
  title: "Connexion admin — Comptéo",
};

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl shadow-neutral-900/10 sm:p-10 dark:bg-card-dark">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <ShieldCheck size={22} />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
              Comptéo · Administration
            </p>
            <h1 className="text-2xl font-extrabold">Connexion admin</h1>
          </div>
        </div>
        <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
          Espace réservé à la gestion des organisations et des demandes.
        </p>
        <div className="mt-7">
          <AdminLoginForm />
        </div>
      </div>
    </main>
  );
}
