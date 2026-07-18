"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { monthLabel } from "@/lib/format";

// Date picker maison (le calendrier natif casse le design) : bouton affichant
// JJ/MM/AAAA + calendrier français en popover. La valeur ISO est portée par un
// <input type="hidden"> soumis avec le formulaire (prop formId si détaché).
// Le popover est rendu via un portal en position fixe : jamais rogné par les
// conteneurs à overflow, et ouvert vers le haut si la place manque en bas.

const WEEKDAYS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"] as const;

const POPOVER_WIDTH = 296;
const POPOVER_HEIGHT = 352;

function toDisplay(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

type Position = { top: number; left: number; openUp: boolean };

export default function DatePicker({
  id,
  name,
  formId,
  defaultValue,
  required,
}: {
  id?: string;
  name: string;
  formId?: string;
  defaultValue?: string; // ISO « 2026-07-18 »
  required?: boolean;
}) {
  const initial = defaultValue && /^\d{4}-\d{2}-\d{2}$/.test(defaultValue)
    ? defaultValue
    : todayIso();
  const [value, setValue] = useState(initial);
  const [open, setOpen] = useState(false);
  // Mois affiché dans le calendrier (1-12)
  const [viewYear, setViewYear] = useState(Number(initial.slice(0, 4)));
  const [viewMonth, setViewMonth] = useState(Number(initial.slice(5, 7)));
  const [position, setPosition] = useState<Position | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const place = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const openUp =
      rect.bottom + POPOVER_HEIGHT + 8 > window.innerHeight &&
      rect.top - POPOVER_HEIGHT - 8 > 0;
    const left = Math.max(
      8,
      Math.min(rect.left, window.innerWidth - POPOVER_WIDTH - 8)
    );
    setPosition({
      top: openUp ? rect.top - POPOVER_HEIGHT - 8 : rect.bottom + 8,
      left,
      openUp,
    });
  }, []);

  const toggle = () => {
    if (!open) {
      setViewYear(Number(value.slice(0, 4)));
      setViewMonth(Number(value.slice(5, 7)));
      place();
    }
    setOpen((o) => !o);
  };

  // Fermeture : clic extérieur, Échap, redimensionnement / défilement
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!popoverRef.current?.contains(t) && !triggerRef.current?.contains(t)) {
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
    const onScroll = (e: Event) => {
      if (popoverRef.current?.contains(e.target as Node)) return;
      place();
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, place]);

  const previousMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };
  const nextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Grille du mois : lundi en premier
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstWeekday = (new Date(viewYear, viewMonth - 1, 1).getDay() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const today = todayIso();

  return (
    <div>
      <input
        type="hidden"
        name={name}
        value={value}
        form={formId}
        required={required}
      />
      <button
        ref={triggerRef}
        id={id}
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex h-12 w-full items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-left text-sm outline-none transition-colors focus:border-brand focus:bg-white dark:border-neutral-700 dark:bg-neutral-900 dark:focus:bg-neutral-900"
      >
        <CalendarDays size={17} className="shrink-0 text-neutral-400" />
        <span className="flex-1 font-semibold">{toDisplay(value)}</span>
      </button>

      {open &&
        position &&
        createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label="Choisir une date"
            style={{ top: position.top, left: position.left, width: POPOVER_WIDTH }}
            className="fixed z-[60] rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl shadow-neutral-900/10 dark:border-neutral-700 dark:bg-card-dark"
          >
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={previousMonth}
                aria-label="Mois précédent"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                <ChevronLeft size={17} />
              </button>
              <span className="text-sm font-bold">
                {monthLabel(viewMonth, viewYear)}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                aria-label="Mois suivant"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                <ChevronRight size={17} />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-7 gap-1">
              {WEEKDAYS.map((day) => (
                <span
                  key={day}
                  className="flex h-8 items-center justify-center text-[11px] font-bold uppercase text-neutral-400"
                >
                  {day}
                </span>
              ))}
              {cells.map((day, index) => {
                if (day === null) {
                  return <span key={`v-${index}`} />;
                }
                const iso = `${viewYear}-${pad(viewMonth)}-${pad(day)}`;
                const selected = iso === value;
                const isToday = iso === today;
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => {
                      setValue(iso);
                      setOpen(false);
                      triggerRef.current?.focus();
                    }}
                    aria-pressed={selected}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                      selected
                        ? "bg-brand text-white"
                        : isToday
                          ? "bg-brand/10 text-brand hover:bg-brand/20"
                          : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                setValue(today);
                setOpen(false);
                triggerRef.current?.focus();
              }}
              className="mt-3 flex h-10 w-full items-center justify-center rounded-xl border border-neutral-200 text-sm font-bold text-brand transition-colors hover:bg-brand/5 dark:border-neutral-700"
            >
              Aujourd&apos;hui
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}
