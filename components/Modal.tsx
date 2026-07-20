"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

// Modal partagée : plein écran arrondi en mobile, carte centrée en bureau.
// Le contenu défile, l'en-tête et le pied restent visibles.
export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  footer,
  children,
}: Readonly<{
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}>) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-950/50 sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[85vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl sm:max-h-[calc(100vh-3rem)] sm:max-w-xl sm:rounded-3xl dark:bg-card-dark"
      >
        {/* En-tête et pied fixes : seul le contenu central défile */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-neutral-100 px-6 py-5 sm:px-8 dark:border-neutral-800">
          <div>
            <h2 className="text-xl font-extrabold">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          {children}
        </div>

        {footer && (
          <div className="shrink-0 border-t border-neutral-100 px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8 sm:pb-4 dark:border-neutral-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
