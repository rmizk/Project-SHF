"use client";

import { useActionState } from "react";
import { Building2, Send } from "lucide-react";
import { requestPasswordReset, type AuthFormState } from "@/lib/auth/actions";
import InputField from "@/components/auth/InputField";
import SubmitButton from "@/components/auth/SubmitButton";
import FormMessage from "@/components/auth/FormMessage";

export default function ForgotForm() {
  const [state, formAction] = useActionState<AuthFormState, FormData>(
    requestPasswordReset,
    {}
  );

  return (
    <form action={formAction} className="space-y-5">
      <FormMessage state={state} />

      <InputField
        label="Identifiant de l'organisation"
        name="org_code"
        icon={Building2}
        placeholder="org-2841"
        required
        autoComplete="username"
      />

      <SubmitButton icon={Send}>Envoyer le lien de réinitialisation</SubmitButton>
    </form>
  );
}
