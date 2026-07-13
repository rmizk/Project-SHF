"use client";

import { useId, useState } from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";

type Props = {
  label: string;
  name: string;
  icon?: LucideIcon;
  type?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  defaultValue?: string;
};

// Champ de formulaire des écrans d'authentification : libellé en gras,
// icône à gauche, fond gris clair. `type="password"` ajoute l'œil
// d'affichage du mot de passe.
export default function InputField({
  label,
  name,
  icon: Icon,
  type = "text",
  placeholder,
  required,
  autoComplete,
  defaultValue,
}: Props) {
  const id = useId();
  const isPassword = type === "password";
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-neutral-900 dark:text-neutral-100"
      >
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
          />
        )}
        <input
          id={id}
          name={name}
          type={isPassword && visible ? "text" : type}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          defaultValue={defaultValue}
          className={`h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-brand focus:bg-white dark:border-neutral-700 dark:bg-neutral-900 dark:focus:bg-neutral-900 ${
            Icon ? "pl-10" : "pl-4"
          } ${isPassword ? "pr-11" : "pr-4"}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 transition-colors hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}
