"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganization } from "@/lib/organization";
import { parseAmount } from "@/lib/amounts";

export type PaymentFormState = {
  error?: string;
  success?: boolean;
};

const PAYMENT_TYPES = [
  "tva",
  "accountant_fees",
  "qabadha",
  "cnss",
  "site_insurance",
] as const;
const PAYMENT_STATUSES = ["to_pay", "paid"] as const;

export async function addAccountingPayment(
  _prev: PaymentFormState,
  formData: FormData
): Promise<PaymentFormState> {
  const organization = await getCurrentOrganization();
  if (!organization) redirect("/connexion");

  const type = String(formData.get("type") ?? "");
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const paymentDate = String(formData.get("payment_date") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!(PAYMENT_TYPES as readonly string[]).includes(type)) {
    return { error: "Sélectionnez un type de paiement." };
  }
  const amount = amountRaw ? parseAmount(amountRaw) : null;
  if (amount === null) {
    return { error: "Montant invalide : utilisez un nombre positif (3 décimales max)." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) {
    return { error: "Saisissez la date du paiement." };
  }
  if (!(PAYMENT_STATUSES as readonly string[]).includes(status)) {
    return { error: "Sélectionnez l'état du paiement (À payer ou Payé)." };
  }

  const supabase = await createClient();
  const { error: insertError } = await supabase.from("accounting_payments").insert({
    organization_id: organization.id,
    type,
    amount,
    payment_date: paymentDate,
    status,
  });

  if (insertError) {
    return { error: "L'enregistrement du paiement a échoué. Réessayez." };
  }

  revalidatePath("/comptabilite");
  return { success: true };
}

export type VatCreditState = {
  error?: string;
  success?: boolean;
};

// Crédit de TVA saisi manuellement, unique par mois (upsert sur la période).
export async function saveVatCredit(
  _prev: VatCreditState,
  formData: FormData
): Promise<VatCreditState> {
  const organization = await getCurrentOrganization();
  if (!organization) redirect("/connexion");

  const month = Number(formData.get("month"));
  const year = Number(formData.get("year"));
  const amountRaw = String(formData.get("amount") ?? "").trim();

  if (
    !Number.isInteger(month) || month < 1 || month > 12 ||
    !Number.isInteger(year) || year < 2000 || year > 2100
  ) {
    return { error: "Période invalide." };
  }
  // Champ vidé = crédit à zéro
  const amount = amountRaw === "" ? "0.000" : parseAmount(amountRaw);
  if (amount === null) {
    return { error: "Crédit de TVA invalide : utilisez un nombre positif (3 décimales max)." };
  }

  const period = `${year}-${String(month).padStart(2, "0")}-01`;
  const supabase = await createClient();
  const { error: upsertError } = await supabase
    .from("vat_credits")
    .upsert(
      { organization_id: organization.id, period, amount },
      { onConflict: "organization_id,period" }
    );

  if (upsertError) {
    return { error: "L'enregistrement du crédit de TVA a échoué. Réessayez." };
  }

  revalidatePath("/comptabilite");
  return { success: true };
}
