"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Bouton flottant mobile, aligné à droite au-dessus de la bottom nav.
// Deux usages : une action directe (modules) ou un « speed dial » (tableau
// de bord). Masqué sur bureau, où les boutons « Ajouter … » restent visibles.

const FAB_POSITION =
  "fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-40 lg:hidden";
const FAB_SHAPE =
  "flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/30 transition-transform active:scale-95";

export function Fab({
  label,
  onClick,
}: Readonly<{ label: string; onClick: () => void }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`${FAB_POSITION} ${FAB_SHAPE}`}
    >
      <Plus size={26} />
    </button>
  );
}

export type SpeedDialAction = {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
};

export function SpeedDialFab({
  label,
  actions,
}: Readonly<{ label: string; actions: SpeedDialAction[] }>) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* Voile léger : un tap en dehors referme */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={`fixed inset-0 z-30 bg-neutral-950/30 transition-opacity duration-200 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Actions déployées, de bas en haut */}
      <div
        className={`${FAB_POSITION} mb-16 flex flex-col items-end gap-3 ${
          open ? "" : "pointer-events-none"
        }`}
      >
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              type="button"
              tabIndex={open ? 0 : -1}
              aria-hidden={!open}
              onClick={() => {
                setOpen(false);
                action.onSelect();
              }}
              style={{
                transitionDelay: `${open ? (actions.length - 1 - index) * 40 : index * 30}ms`,
              }}
              className={`flex h-12 items-center gap-2.5 rounded-full bg-white pl-4 pr-5 text-sm font-bold shadow-lg shadow-neutral-900/10 transition-all duration-200 dark:bg-card-dark ${
                open
                  ? "translate-y-0 scale-100 opacity-100"
                  : "translate-y-3 scale-95 opacity-0"
              }`}
            >
              <Icon size={18} className="text-brand" />
              {action.label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fermer les actions rapides" : label}
        aria-expanded={open}
        className={`${FAB_POSITION} ${FAB_SHAPE}`}
      >
        <Plus
          size={26}
          className={`transition-transform duration-200 ${open ? "rotate-45" : ""}`}
        />
      </button>
    </>
  );
}
