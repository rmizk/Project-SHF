"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, type LucideIcon } from "lucide-react";

// Menu « ⋮ » réutilisable des lignes de tableau. Rendu via un portal en
// position fixe : jamais rogné par l'overflow du conteneur (bug historique
// de la dernière ligne dans Services), et ouvert vers le haut quand la place
// manque sous le bouton.

export type RowAction = {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  variant?: "default" | "danger";
};

const MENU_WIDTH = 240;
const ITEM_HEIGHT = 44;

type Position = { top: number; left: number };

export default function RowActionsMenu({
  label,
  actions,
}: {
  label: string; // aria-label du bouton (ex. « Actions pour FCT-0142 »)
  actions: RowAction[];
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const place = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const menuHeight = actions.length * ITEM_HEIGHT + 10;
    const openUp =
      rect.bottom + menuHeight + 6 > window.innerHeight &&
      rect.top - menuHeight - 6 > 0;
    const left = Math.max(
      8,
      Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8)
    );
    setPosition({
      top: openUp ? rect.top - menuHeight - 6 : rect.bottom + 6,
      left,
    });
  }, [actions.length]);

  const toggle = () => {
    if (!open) place();
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !triggerRef.current?.contains(t)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-11 w-11 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 lg:h-9 lg:w-9 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
      >
        <MoreVertical size={17} />
      </button>

      {open &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={label}
            style={{ top: position.top, left: position.left, width: MENU_WIDTH }}
            className="fixed z-[60] overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-xl shadow-neutral-900/10 dark:border-neutral-700 dark:bg-card-dark"
          >
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    action.onSelect();
                  }}
                  className={`flex h-11 w-full items-center gap-2.5 px-4 text-left text-sm font-semibold transition-colors ${
                    action.variant === "danger"
                      ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
                      : "hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  }`}
                >
                  <Icon
                    size={16}
                    className={
                      action.variant === "danger" ? "" : "text-neutral-400"
                    }
                  />
                  {action.label}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
