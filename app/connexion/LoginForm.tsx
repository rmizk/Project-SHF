"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, Building2, Lock } from "lucide-react";
import { signIn, type AuthFormState } from "@/lib/auth/actions";
import InputField from "@/components/auth/InputField";
import SubmitButton from "@/components/auth/SubmitButton";
import FormMessage from "@/components/auth/FormMessage";

export default function LoginForm() {
  const [state, formAction] = useActionState<AuthFormState, FormData>(
    signIn,
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
      <InputField
        label="Mot de passe"
        name="password"
        icon={Lock}
        type="password"
        placeholder="••••••••"
        required
        autoComplete="current-password"
      />

      <div className="flex items-center justify-between gap-3">
        <label className="hidden cursor-pointer items-center gap-2 text-sm text-neutral-700 lg:flex dark:text-neutral-300">
          <input
            type="checkbox"
            name="remember"
            defaultChecked
            className="h-4 w-4 rounded border-neutral-300 accent-brand"
          />
          Rester connecté
        </label>
        <Link
          href="/mot-de-passe/oublie"
          className="ml-auto text-sm font-semibold text-brand hover:underline"
        >
          Mot de passe oublié ?
        </Link>
      </div>

      <SubmitButton icon={ArrowRight}>Se connecter</SubmitButton>
    </form>
  );
}
