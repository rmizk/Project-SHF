"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganization } from "@/lib/organization";
import { parseAmount } from "@/lib/amounts";

export type ExpenseFormState = {
  error?: string;
  success?: boolean;
};

const EXPENSE_TYPES = ["with_invoice", "without_invoice", "personal"] as const;

const ACCEPTED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};
const MAX_SIZE = 10 * 1024 * 1024; // 10 Mo

export async function addExpense(
  _prev: ExpenseFormState,
  formData: FormData
): Promise<ExpenseFormState> {
  const organization = await getCurrentOrganization();
  if (!organization) redirect("/connexion");

  const type = String(formData.get("type") ?? "");
  const categoryId = String(formData.get("category_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const expenseDate = String(formData.get("expense_date") ?? "");
  const file = formData.get("attachment");

  if (!(EXPENSE_TYPES as readonly string[]).includes(type)) {
    return { error: "Sélectionnez un type de dépense." };
  }
  if (!categoryId) return { error: "Sélectionnez une catégorie." };
  if (!name) return { error: "Saisissez le nom de la dépense." };
  const amount = amountRaw ? parseAmount(amountRaw) : null;
  if (amount === null) {
    return { error: "Montant invalide : utilisez un nombre positif (3 décimales max)." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)) {
    return { error: "Saisissez la date de la dépense." };
  }

  // Pièce jointe : obligatoire pour « avec facture », ignorée sinon
  const attachment =
    type === "with_invoice" && file instanceof File && file.size > 0
      ? file
      : null;
  if (type === "with_invoice") {
    if (!attachment) {
      return {
        error:
          "La pièce jointe est obligatoire pour une dépense avec facture.",
      };
    }
    if (!ACCEPTED_TYPES[attachment.type]) {
      return { error: "Pièce jointe : format non pris en charge (PDF, JPG ou PNG)." };
    }
    if (attachment.size > MAX_SIZE) {
      return { error: "Pièce jointe trop volumineuse : 10 Mo maximum." };
    }
  }

  const supabase = await createClient();

  // La catégorie doit appartenir à l'organisation (la RLS filtre déjà)
  const { data: category } = await supabase
    .from("expense_categories")
    .select("id")
    .eq("id", categoryId)
    .maybeSingle();
  if (!category) return { error: "Catégorie introuvable. Rechargez la page." };

  // Upload vers le bucket « expense-receipts », préfixe organisation
  let attachmentPath: string | null = null;
  if (attachment) {
    const ext = ACCEPTED_TYPES[attachment.type];
    attachmentPath = `${organization.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("expense-receipts")
      .upload(attachmentPath, attachment, { contentType: attachment.type });
    if (uploadError) {
      return { error: "L'envoi de la pièce jointe a échoué. Réessayez." };
    }
  }

  const { error: insertError } = await supabase.from("expenses").insert({
    organization_id: organization.id,
    type,
    category_id: categoryId,
    name,
    amount,
    expense_date: expenseDate,
    attachment_path: attachmentPath,
  });

  if (insertError) {
    // Nettoyage du fichier orphelin si l'insertion échoue
    if (attachmentPath) {
      await supabase.storage.from("expense-receipts").remove([attachmentPath]);
    }
    return { error: "L'enregistrement de la dépense a échoué. Réessayez." };
  }

  revalidatePath("/depenses");
  return { success: true };
}

// ------------------------------------------------------------
// Modification d'une dépense. Pièce jointe : remplacée si un nouveau
// fichier est fourni ; requise si la dépense passe « avec facture » sans
// pièce existante ; supprimée si le type quitte « avec facture ».
// ------------------------------------------------------------
export async function updateExpense(
  _prev: ExpenseFormState,
  formData: FormData
): Promise<ExpenseFormState> {
  const organization = await getCurrentOrganization();
  if (!organization) redirect("/connexion");

  const expenseId = String(formData.get("expense_id") ?? "");
  const type = String(formData.get("type") ?? "");
  const categoryId = String(formData.get("category_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const expenseDate = String(formData.get("expense_date") ?? "");
  const file = formData.get("attachment");

  if (!expenseId) return { error: "Dépense introuvable. Rechargez la page." };
  if (!(EXPENSE_TYPES as readonly string[]).includes(type)) {
    return { error: "Sélectionnez un type de dépense." };
  }
  if (!categoryId) return { error: "Sélectionnez une catégorie." };
  if (!name) return { error: "Saisissez le nom de la dépense." };
  const amount = amountRaw ? parseAmount(amountRaw) : null;
  if (amount === null) {
    return { error: "Montant invalide : utilisez un nombre positif (3 décimales max)." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)) {
    return { error: "Saisissez la date de la dépense." };
  }

  const supabase = await createClient();

  // La dépense doit appartenir à l'organisation (la RLS filtre déjà)
  const { data: existing } = await supabase
    .from("expenses")
    .select("id, attachment_path")
    .eq("id", expenseId)
    .eq("organization_id", organization.id)
    .maybeSingle();
  if (!existing) return { error: "Dépense introuvable. Rechargez la page." };

  const { data: category } = await supabase
    .from("expense_categories")
    .select("id")
    .eq("id", categoryId)
    .maybeSingle();
  if (!category) return { error: "Catégorie introuvable. Rechargez la page." };

  const attachment =
    type === "with_invoice" && file instanceof File && file.size > 0
      ? file
      : null;
  if (type === "with_invoice") {
    if (!attachment && !existing.attachment_path) {
      return {
        error: "La pièce jointe est obligatoire pour une dépense avec facture.",
      };
    }
    if (attachment) {
      if (!ACCEPTED_TYPES[attachment.type]) {
        return { error: "Pièce jointe : format non pris en charge (PDF, JPG ou PNG)." };
      }
      if (attachment.size > MAX_SIZE) {
        return { error: "Pièce jointe trop volumineuse : 10 Mo maximum." };
      }
    }
  }

  // Nouvelle pièce : upload avant mise à jour ; l'ancienne (remplacée ou
  // devenue inutile hors « avec facture ») est supprimée après succès
  let attachmentPath = type === "with_invoice" ? existing.attachment_path : null;
  if (attachment) {
    const ext = ACCEPTED_TYPES[attachment.type];
    attachmentPath = `${organization.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("expense-receipts")
      .upload(attachmentPath, attachment, { contentType: attachment.type });
    if (uploadError) {
      return { error: "L'envoi de la pièce jointe a échoué. Réessayez." };
    }
  }

  const { error: updateError } = await supabase
    .from("expenses")
    .update({
      type,
      category_id: categoryId,
      name,
      amount,
      expense_date: expenseDate,
      attachment_path: attachmentPath,
    })
    .eq("id", expenseId)
    .eq("organization_id", organization.id);

  if (updateError) {
    if (attachment && attachmentPath) {
      await supabase.storage.from("expense-receipts").remove([attachmentPath]);
    }
    return { error: "L'enregistrement de la dépense a échoué. Réessayez." };
  }

  if (existing.attachment_path && existing.attachment_path !== attachmentPath) {
    await supabase.storage
      .from("expense-receipts")
      .remove([existing.attachment_path]);
  }

  revalidatePath("/depenses");
  return { success: true };
}

// ------------------------------------------------------------
// Suppression d'une dépense (avec sa pièce jointe du Storage)
// ------------------------------------------------------------
export async function deleteExpense(
  expenseId: string
): Promise<{ error?: string }> {
  const organization = await getCurrentOrganization();
  if (!organization) redirect("/connexion");

  const supabase = await createClient();
  const { data: expense } = await supabase
    .from("expenses")
    .select("id, attachment_path")
    .eq("id", expenseId)
    .eq("organization_id", organization.id)
    .maybeSingle();
  if (!expense) return { error: "Dépense introuvable. Rechargez la page." };

  const { error: deleteError } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId)
    .eq("organization_id", organization.id);
  if (deleteError) {
    return { error: "La suppression de la dépense a échoué. Réessayez." };
  }

  if (expense.attachment_path) {
    await supabase.storage
      .from("expense-receipts")
      .remove([expense.attachment_path]);
  }

  revalidatePath("/depenses");
  return {};
}
