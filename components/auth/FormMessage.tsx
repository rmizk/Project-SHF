import { CircleAlert, CircleCheck } from "lucide-react";
import type { AuthFormState } from "@/lib/auth/actions";

// Affiche le message d'erreur ou de succès renvoyé par une Server Action.
export default function FormMessage({ state }: { state: AuthFormState }) {
  if (state.error) {
    return (
      <p
        role="alert"
        className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300"
      >
        <CircleAlert size={18} className="mt-0.5 shrink-0" />
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p
        role="status"
        className="flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
      >
        <CircleCheck size={18} className="mt-0.5 shrink-0" />
        {state.success}
      </p>
    );
  }
  return null;
}
