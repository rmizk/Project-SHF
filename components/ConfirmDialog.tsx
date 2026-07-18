"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2, type LucideIcon } from "lucide-react";

// Boîte de confirmation partagée : onConfirm renvoie une erreur éventuelle
// (affichée sur place) ; la boîte se ferme d'elle-même en cas de succès via
// le démontage par le parent. Destructive (rouge) par défaut ; `variant`
// « primary » et `icon` permettent les confirmations non destructives.
export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Supprimer",
  icon: Icon = Trash2,
  variant = "danger",
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  icon?: LucideIcon;
  variant?: "danger" | "primary";
  onConfirm: () => Promise<{ error?: string } | void>;
  onClose: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  async function confirm() {
    setPending(true);
    setError(null);
    const result = await onConfirm();
    if (result?.error) {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 p-4 sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !pending) onClose();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl sm:p-7 dark:bg-card-dark"
      >
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
            variant === "danger"
              ? "bg-red-50 text-red-500 dark:bg-red-950/50 dark:text-red-400"
              : "bg-brand/10 text-brand"
          }`}
        >
          <Icon size={20} />
        </span>
        <h2 className="mt-4 text-lg font-extrabold">{title}</h2>
        <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          {message}
        </p>
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="h-12 flex-1 rounded-xl border border-neutral-200 text-sm font-bold transition-colors hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={pending}
            className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              variant === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-brand hover:bg-brand-hover"
            }`}
          >
            {pending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Icon size={16} />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
