"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganization } from "@/lib/organization";
import { fromMillimes, parseAmount, toMillimes } from "@/lib/amounts";

export type AttachementFormState = {
  error?: string;
  success?: boolean;
};

const VAT_RATES = [0, 7, 13, 19];

// ------------------------------------------------------------
// Ajout d'un attachement (client créé à la volée si besoin)
// ------------------------------------------------------------
export async function addAttachement(
  _prev: AttachementFormState,
  formData: FormData
): Promise<AttachementFormState> {
  const organization = await getCurrentOrganization();
  if (!organization) redirect("/connexion");

  const clientName = String(formData.get("client_name") ?? "").trim();
  const amountRaw = String(formData.get("amount_ht") ?? "").trim();
  const attachementDate = String(formData.get("attachement_date") ?? "");
  const vatRate = Number(formData.get("vat_rate"));
  const status = String(formData.get("status") ?? "pending");

  if (!clientName) return { error: "Saisissez le nom du client." };
  const amountHt = amountRaw ? parseAmount(amountRaw) : null;
  if (amountHt === null) {
    return { error: "Montant HT invalide : utilisez un nombre positif (3 décimales max)." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(attachementDate)) {
    return { error: "Saisissez la date de l'attachement." };
  }
  if (!VAT_RATES.includes(vatRate)) {
    return { error: "Sélectionnez un taux de TVA (0, 7, 13 ou 19 %)." };
  }
  if (status !== "pending" && status !== "paid") {
    return { error: "État invalide." };
  }

  const supabase = await createClient();

  // Client : réutilisé s'il existe, créé à la volée sinon
  let clientId: string;
  const { data: existingClient } = await supabase
    .from("clients")
    .select("id")
    .eq("organization_id", organization.id)
    .eq("name", clientName)
    .maybeSingle();

  if (existingClient) {
    clientId = existingClient.id;
  } else {
    const { data: created, error: clientError } = await supabase
      .from("clients")
      .insert({ organization_id: organization.id, name: clientName })
      .select("id")
      .single();
    if (clientError || !created) {
      return { error: "Impossible d'enregistrer le client. Réessayez." };
    }
    clientId = created.id;
  }

  const { error: insertError } = await supabase.from("attachements").insert({
    organization_id: organization.id,
    client_id: clientId,
    amount_ht: amountHt,
    vat_rate: vatRate,
    attachement_date: attachementDate,
    status,
    // Créé directement « Payé » : la date de paiement est celle de
    // l'attachement ; le bénéfice net reste à définir via la modal dédiée.
    paid_at: status === "paid" ? attachementDate : null,
  });

  if (insertError) {
    return { error: "L'enregistrement de l'attachement a échoué. Réessayez." };
  }

  revalidatePath("/services");
  return { success: true };
}

// ------------------------------------------------------------
// Enregistrement du paiement : retenues ligne par ligne, bénéfice net
// calculé CÔTÉ SERVEUR (règle métier n°5) en millimes entiers.
// ------------------------------------------------------------
export async function recordPayment(
  _prev: AttachementFormState,
  formData: FormData
): Promise<AttachementFormState> {
  const organization = await getCurrentOrganization();
  if (!organization) redirect("/connexion");

  const attachementId = String(formData.get("attachement_id") ?? "");
  const labels = formData.getAll("deduction_label").map(String);
  const amounts = formData.getAll("deduction_amount").map(String);

  if (!attachementId) return { error: "Attachement introuvable." };

  // Lignes de retenues : les lignes entièrement vides sont ignorées
  const deductions: { label: string; amount: string }[] = [];
  for (let i = 0; i < Math.max(labels.length, amounts.length); i++) {
    const label = (labels[i] ?? "").trim();
    const amountRaw = (amounts[i] ?? "").trim();
    if (!label && !amountRaw) continue;
    if (!label) {
      return { error: `Ligne ${i + 1} : saisissez le libellé de la retenue.` };
    }
    const amount = parseAmount(amountRaw);
    if (amount === null) {
      return {
        error: `Ligne « ${label} » : montant invalide (nombre positif, 3 décimales max).`,
      };
    }
    deductions.push({ label, amount });
  }

  const supabase = await createClient();
  const { data: attachement } = await supabase
    .from("attachements")
    .select("id, amount_ht, status, paid_at, attachement_date")
    .eq("id", attachementId)
    .maybeSingle();

  if (!attachement) return { error: "Attachement introuvable." };

  // Bénéfice net = montant HT − total des retenues (calcul serveur, millimes)
  const totalMillimes = deductions.reduce(
    (sum, d) => sum + toMillimes(d.amount),
    0
  );
  const htMillimes = toMillimes(attachement.amount_ht);
  if (totalMillimes > htMillimes) {
    return {
      error: "Le total des retenues dépasse le montant HT de l'attachement.",
    };
  }
  const netProfit = fromMillimes(htMillimes - totalMillimes);

  // Remplace les retenues existantes (modification incluse)
  const { error: deleteError } = await supabase
    .from("attachement_deductions")
    .delete()
    .eq("attachement_id", attachement.id);
  if (deleteError) {
    return { error: "L'enregistrement des retenues a échoué. Réessayez." };
  }

  if (deductions.length > 0) {
    const { error: insertError } = await supabase
      .from("attachement_deductions")
      .insert(
        deductions.map((d) => ({
          attachement_id: attachement.id,
          label: d.label,
          amount: d.amount,
        }))
      );
    if (insertError) {
      return { error: "L'enregistrement des retenues a échoué. Réessayez." };
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const { error: updateError } = await supabase
    .from("attachements")
    .update({
      status: "paid",
      // Un attachement déjà payé conserve sa date de paiement d'origine
      paid_at: attachement.status === "paid" ? attachement.paid_at : today,
      net_profit: netProfit,
    })
    .eq("id", attachement.id);

  if (updateError) {
    return { error: "L'enregistrement du paiement a échoué. Réessayez." };
  }

  revalidatePath("/services");
  return { success: true };
}
