"use client";

import { useFormStatus } from "react-dom";
import { Loader2, type LucideIcon } from "lucide-react";

export default function SubmitButton({
  children,
  icon: Icon,
}: Readonly<{ children: React.ReactNode; icon?: LucideIcon }>) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-bold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <>
          {children}
          {Icon && <Icon size={18} />}
        </>
      )}
    </button>
  );
}
