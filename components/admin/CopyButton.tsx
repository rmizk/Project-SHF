"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

// Bouton « copier dans le presse-papiers » avec confirmation visuelle
// (l'icône devient une coche pendant 2 secondes).
export default function CopyButton({
  value,
  label,
}: Readonly<{
  value: string;
  label: string;
}>) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Presse-papiers indisponible (contexte non sécurisé) : rien à faire.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copié" : label}
      title={copied ? "Copié" : label}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
    >
      {copied ? (
        <Check size={16} className="text-emerald-600 dark:text-emerald-400" />
      ) : (
        <Copy size={16} />
      )}
    </button>
  );
}
