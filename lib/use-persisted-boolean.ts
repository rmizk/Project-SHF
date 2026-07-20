"use client";

import { useCallback, useEffect, useState } from "react";

// Préférence d'affichage booléenne mémorisée en localStorage.
// La valeur de repli est utilisée au premier rendu (serveur puis hydratation),
// la valeur stockée est appliquée juste après le montage.
export function usePersistedBoolean(
  key: string,
  fallback: boolean
): readonly [boolean, (next: boolean) => void] {
  const [value, setValue] = useState(fallback);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) setValue(stored === "1");
    } catch {
      // Stockage indisponible (mode privé) : on garde la valeur par défaut.
    }
  }, [key]);

  const update = useCallback(
    (next: boolean) => {
      setValue(next);
      try {
        window.localStorage.setItem(key, next ? "1" : "0");
      } catch {
        // Ignoré : la préférence ne sera simplement pas mémorisée.
      }
    },
    [key]
  );

  return [value, update] as const;
}
