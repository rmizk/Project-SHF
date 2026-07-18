"use client";

import { useActionState } from "react";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { adminSignIn, type AuthFormState } from "@/lib/auth/actions";
import InputField from "@/components/auth/InputField";
import SubmitButton from "@/components/auth/SubmitButton";
import FormMessage from "@/components/auth/FormMessage";

export default function AdminLoginForm() {
  const [state, formAction] = useActionState<AuthFormState, FormData>(
    adminSignIn,
    {}
  );

  return (
    <form action={formAction} className="space-y-5">
      <FormMessage state={state} />

      <InputField
        label="Email"
        name="email"
        icon={Mail}
        type="email"
        placeholder="admin@exemple.com"
        required
        autoComplete="username"
      />
      <InputField
        label="Mot de passe"
        name="password"
        icon={Lock}
        type="password"
        placeholder="••••••••"
        required
        autoComplete="current-password"
      />

      <SubmitButton icon={ArrowRight}>Se connecter</SubmitButton>
    </form>
  );
}
