"use client";

import { Eye, EyeOff } from "lucide-react";
import { usePersistedBoolean } from "@/lib/use-persisted-boolean";

// Fond de roulement : masqué par défaut (●●●●●●), révélé par l'icône œil.
// La préférence est partagée entre la carte mobile et la carte bureau.
export default function WorkingCapitalAmount({
  amount,
  tone = "light",
}: Readonly<{ amount: string | null; tone?: "light" | "dark" }>) {
  const [visible, setVisible] = usePersistedBoolean(
    "compteo.fond-de-roulement.visible",
    false
  );

  const dark = tone === "dark";

  // Rien à masquer tant qu'aucun fond de roulement n'a été saisi
  if (amount === null) return <>—</>;

  return (
    <span className="flex items-center gap-2">
      <span aria-live="polite">
        {visible ? (
          <>
            {amount}
            <span
              className={`ml-1 text-sm font-bold text-neutral-400 ${dark ? "ml-1.5 text-base" : ""}`}
            >
              TND
            </span>
          </>
        ) : (
          <span className="tracking-widest">●●●●●●</span>
        )}
      </span>
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        aria-label={
          visible ? "Masquer le fond de roulement" : "Afficher le fond de roulement"
        }
        title={
          visible ? "Masquer le fond de roulement" : "Afficher le fond de roulement"
        }
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
          dark
            ? "text-neutral-400 hover:bg-white/10 hover:text-white"
            : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
        }`}
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </span>
  );
}
