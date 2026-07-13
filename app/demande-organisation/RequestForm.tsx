"use client";

import { useActionState } from "react";
import { Building2, FileText, Mail, Phone, Send } from "lucide-react";
import {
  submitOrganizationRequest,
  type AuthFormState,
} from "@/lib/auth/actions";
import InputField from "@/components/auth/InputField";
import SubmitButton from "@/components/auth/SubmitButton";
import FormMessage from "@/components/auth/FormMessage";

export default function RequestForm() {
  const [state, formAction] = useActionState<AuthFormState, FormData>(
    submitOrganizationRequest,
    {}
  );

  return (
    <form action={formAction} className="space-y-5">
      <FormMessage state={state} />

      <InputField
        label="Nom de la société"
        name="company_name"
        icon={Building2}
        placeholder="SARL Meridian"
        required
        autoComplete="organization"
      />
      <InputField
        label="Matricule fiscal"
        name="tax_id"
        icon={FileText}
        placeholder="1234567/A/M/000"
        required
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <InputField
          label="Email"
          name="email"
          icon={Mail}
          type="email"
          placeholder="contact@meridian.tn"
          required
          autoComplete="email"
        />
        <InputField
          label="Téléphone"
          name="phone"
          icon={Phone}
          type="tel"
          placeholder="+216 71 234 567"
          autoComplete="tel"
        />
      </div>

      <SubmitButton icon={Send}>Envoyer la demande</SubmitButton>
    </form>
  );
}
