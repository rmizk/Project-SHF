"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { monthLabel, monthName } from "@/lib/format";

// Filtre mois/année commun aux 4 modules : pilote les paramètres
// d'URL ?mois=&annee= (le Server Component refait la requête).
export default function MonthYearFilter({
  month,
  year,
}: {
  month: number;
  year: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [panelYear, setPanelYear] = useState(year);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => setPanelYear(year), [year, open]);

  // Fermeture au clic extérieur / Échap
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function select(m: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("mois", String(m));
    params.set("annee", String(panelYear));
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex h-12 items-center gap-2.5 rounded-xl bg-white px-4 text-sm font-bold shadow-sm shadow-neutral-900/5 transition-colors hover:bg-neutral-50 dark:bg-card-dark dark:hover:bg-neutral-800"
      >
        <Calendar size={17} className="text-neutral-400" />
        {monthLabel(month, year)}
        <ChevronDown
          size={16}
          className={`text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-2 w-72 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl shadow-neutral-900/10 dark:border-neutral-700 dark:bg-card-dark">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPanelYear((y) => y - 1)}
              aria-label="Année précédente"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-bold">{panelYear}</span>
            <button
              type="button"
              onClick={() => setPanelYear((y) => y + 1)}
              aria-label="Année suivante"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
              const active = m === month && panelYear === year;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => select(m)}
                  className={`rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-brand text-white"
                      : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  }`}
                >
                  {monthName(m).slice(0, 4)}
                  {monthName(m).length > 4 ? "." : ""}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
