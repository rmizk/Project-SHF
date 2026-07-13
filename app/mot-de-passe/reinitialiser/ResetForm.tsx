"use client";

import { useActionState } from "react";
import { ArrowRight, Lock } from "lucide-react";
import { resetPassword, type AuthFormState } from "@/lib/auth/actions";
import InputField from "@/components/auth/InputField";
import SubmitButton from "@/components/auth/SubmitButton";
import FormMessage from "@/components/auth/FormMessage";

export default function ResetForm({ token }: { token: string }) {
  const [state, formAction] = useActionState<AuthFormState, FormData>(
    resetPassword,
    {}
  );

  return (
    <form action={formAction} className="space-y-5">
      <FormMessage state={state} />
      <input type="hidden" name="token" value={token} />

      <InputField
        label="Nouveau mot de passe"
        name="password"
        icon={Lock}
        type="password"
        placeholder="8 caractères minimum"
        required
        autoComplete="new-password"
      />
      <InputField
        label="Confirmer le mot de passe"
        name="confirm"
        icon={Lock}
        type="password"
        placeholder="••••••••"
        required
        autoComplete="new-password"
      />

      <SubmitButton icon={ArrowRight}>
        Réinitialiser le mot de passe
      </SubmitButton>
    </form>
  );
}
