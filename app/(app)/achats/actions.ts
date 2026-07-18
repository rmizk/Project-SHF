"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganization } from "@/lib/organization";
import { parseAmount } from "@/lib/amounts";

export type InvoiceFormState = {
  error?: string;
  success?: boolean;
};

const VAT_RATES = [0, 7, 13, 19];
const ACCEPTED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};
const MAX_SIZE = 10 * 1024 * 1024; // 10 Mo

export async function addPurchaseInvoice(
  _prev: InvoiceFormState,
  formData: FormData
): Promise<InvoiceFormState> {
  const organization = await getCurrentOrganization();
  if (!organization) redirect("/connexion");

  const supplierName = String(formData.get("supplier_name") ?? "").trim();
  const invoiceNumber = String(formData.get("invoice_number") ?? "").trim();
  const invoiceDate = String(formData.get("invoice_date") ?? "");
  const amountRaw = String(formData.get("amount_ht") ?? "").trim();
  const vatRate = Number(formData.get("vat_rate"));
  const file = formData.get("attachment");

  if (!supplierName) return { error: "Saisissez le nom du fournisseur." };
  if (!invoiceNumber) return { error: "Saisissez le numéro de la facture." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(invoiceDate)) {
    return { error: "Saisissez la date de la facture." };
  }
  const amountHt = amountRaw ? parseAmount(amountRaw) : null;
  if (amountHt === null) {
    return { error: "Montant HT invalide : utilisez un nombre positif (3 décimales max)." };
  }
  if (!VAT_RATES.includes(vatRate)) {
    return { error: "Sélectionnez un taux de TVA (0, 7, 13 ou 19 %)." };
  }

  const attachment = file instanceof File && file.size > 0 ? file : null;
  if (attachment) {
    if (!ACCEPTED_TYPES[attachment.type]) {
      return { error: "Pièce jointe : format non pris en charge (PDF, JPG ou PNG)." };
    }
    if (attachment.size > MAX_SIZE) {
      return { error: "Pièce jointe trop volumineuse : 10 Mo maximum." };
    }
  }

  const supabase = await createClient();

  // Fournisseur : réutilisé s'il existe, créé à la volée sinon
  let supplierId: string;
  const { data: existingSupplier } = await supabase
    .from("suppliers")
    .select("id")
    .eq("organization_id", organization.id)
    .eq("name", supplierName)
    .maybeSingle();

  if (existingSupplier) {
    supplierId = existingSupplier.id;
  } else {
    const { data: created, error: supplierError } = await supabase
      .from("suppliers")
      .insert({ organization_id: organization.id, name: supplierName })
      .select("id")
      .single();
    if (supplierError || !created) {
      return { error: "Impossible d'enregistrer le fournisseur. Réessayez." };
    }
    supplierId = created.id;
  }

  // Doublon : même fournisseur + même n° de facture
  const { data: duplicate } = await supabase
    .from("purchase_invoices")
    .select("id")
    .eq("organization_id", organization.id)
    .eq("supplier_id", supplierId)
    .eq("invoice_number", invoiceNumber)
    .maybeSingle();
  if (duplicate) {
    return {
      error: `La facture n° ${invoiceNumber} existe déjà pour ${supplierName}.`,
    };
  }

  // Pièce jointe : upload vers le bucket « invoices », préfixe organisation
  let attachmentPath: string | null = null;
  if (attachment) {
    const ext = ACCEPTED_TYPES[attachment.type];
    attachmentPath = `${organization.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("invoices")
      .upload(attachmentPath, attachment, { contentType: attachment.type });
    if (uploadError) {
      return { error: "L'envoi de la pièce jointe a échoué. Réessayez." };
    }
  }

  const { error: insertError } = await supabase.from("purchase_invoices").insert({
    organization_id: organization.id,
    supplier_id: supplierId,
    invoice_number: invoiceNumber,
    invoice_date: invoiceDate,
    amount_ht: amountHt,
    vat_rate: vatRate,
    attachment_path: attachmentPath,
  });

  if (insertError) {
    // Nettoyage du fichier orphelin si l'insertion échoue
    if (attachmentPath) {
      await supabase.storage.from("invoices").remove([attachmentPath]);
    }
    if (insertError.code === "23505") {
      return {
        error: `La facture n° ${invoiceNumber} existe déjà pour ${supplierName}.`,
      };
    }
    return { error: "L'enregistrement de la facture a échoué. Réessayez." };
  }

  revalidatePath("/achats");
  return { success: true };
}

// ------------------------------------------------------------
// Modification d'une facture (pièce jointe remplacée si un
// nouveau fichier est fourni, conservée sinon)
// ------------------------------------------------------------
export async function updatePurchaseInvoice(
  _prev: InvoiceFormState,
  formData: FormData
): Promise<InvoiceFormState> {
  const organization = await getCurrentOrganization();
  if (!organization) redirect("/connexion");

  const invoiceId = String(formData.get("invoice_id") ?? "");
  const supplierName = String(formData.get("supplier_name") ?? "").trim();
  const invoiceNumber = String(formData.get("invoice_number") ?? "").trim();
  const invoiceDate = String(formData.get("invoice_date") ?? "");
  const amountRaw = String(formData.get("amount_ht") ?? "").trim();
  const vatRate = Number(formData.get("vat_rate"));
  const file = formData.get("attachment");

  if (!invoiceId) return { error: "Facture introuvable. Rechargez la page." };
  if (!supplierName) return { error: "Saisissez le nom du fournisseur." };
  if (!invoiceNumber) return { error: "Saisissez le numéro de la facture." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(invoiceDate)) {
    return { error: "Saisissez la date de la facture." };
  }
  const amountHt = amountRaw ? parseAmount(amountRaw) : null;
  if (amountHt === null) {
    return { error: "Montant HT invalide : utilisez un nombre positif (3 décimales max)." };
  }
  if (!VAT_RATES.includes(vatRate)) {
    return { error: "Sélectionnez un taux de TVA (0, 7, 13 ou 19 %)." };
  }

  const attachment = file instanceof File && file.size > 0 ? file : null;
  if (attachment) {
    if (!ACCEPTED_TYPES[attachment.type]) {
      return { error: "Pièce jointe : format non pris en charge (PDF, JPG ou PNG)." };
    }
    if (attachment.size > MAX_SIZE) {
      return { error: "Pièce jointe trop volumineuse : 10 Mo maximum." };
    }
  }

  const supabase = await createClient();

  // La facture doit appartenir à l'organisation (la RLS filtre déjà)
  const { data: existing } = await supabase
    .from("purchase_invoices")
    .select("id, attachment_path")
    .eq("id", invoiceId)
    .eq("organization_id", organization.id)
    .maybeSingle();
  if (!existing) return { error: "Facture introuvable. Rechargez la page." };

  // Fournisseur : réutilisé s'il existe, créé à la volée sinon
  let supplierId: string;
  const { data: existingSupplier } = await supabase
    .from("suppliers")
    .select("id")
    .eq("organization_id", organization.id)
    .eq("name", supplierName)
    .maybeSingle();

  if (existingSupplier) {
    supplierId = existingSupplier.id;
  } else {
    const { data: created, error: supplierError } = await supabase
      .from("suppliers")
      .insert({ organization_id: organization.id, name: supplierName })
      .select("id")
      .single();
    if (supplierError || !created) {
      return { error: "Impossible d'enregistrer le fournisseur. Réessayez." };
    }
    supplierId = created.id;
  }

  // Doublon : même fournisseur + même n° de facture, hors facture éditée
  const { data: duplicate } = await supabase
    .from("purchase_invoices")
    .select("id")
    .eq("organization_id", organization.id)
    .eq("supplier_id", supplierId)
    .eq("invoice_number", invoiceNumber)
    .neq("id", invoiceId)
    .maybeSingle();
  if (duplicate) {
    return {
      error: `La facture n° ${invoiceNumber} existe déjà pour ${supplierName}.`,
    };
  }

  // Nouvelle pièce jointe : upload avant mise à jour, l'ancienne est
  // supprimée après succès
  let attachmentPath = existing.attachment_path;
  if (attachment) {
    const ext = ACCEPTED_TYPES[attachment.type];
    attachmentPath = `${organization.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("invoices")
      .upload(attachmentPath, attachment, { contentType: attachment.type });
    if (uploadError) {
      return { error: "L'envoi de la pièce jointe a échoué. Réessayez." };
    }
  }

  const { error: updateError } = await supabase
    .from("purchase_invoices")
    .update({
      supplier_id: supplierId,
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate,
      amount_ht: amountHt,
      vat_rate: vatRate,
      attachment_path: attachmentPath,
    })
    .eq("id", invoiceId)
    .eq("organization_id", organization.id);

  if (updateError) {
    if (attachment && attachmentPath) {
      await supabase.storage.from("invoices").remove([attachmentPath]);
    }
    if (updateError.code === "23505") {
      return {
        error: `La facture n° ${invoiceNumber} existe déjà pour ${supplierName}.`,
      };
    }
    return { error: "L'enregistrement de la facture a échoué. Réessayez." };
  }

  // L'ancienne pièce remplacée devient orpheline : suppression
  if (attachment && existing.attachment_path) {
    await supabase.storage.from("invoices").remove([existing.attachment_path]);
  }

  revalidatePath("/achats");
  return { success: true };
}

// ------------------------------------------------------------
// Suppression d'une facture (avec sa pièce jointe du Storage)
// ------------------------------------------------------------
export async function deletePurchaseInvoice(
  invoiceId: string
): Promise<{ error?: string }> {
  const organization = await getCurrentOrganization();
  if (!organization) redirect("/connexion");

  const supabase = await createClient();
  const { data: invoice } = await supabase
    .from("purchase_invoices")
    .select("id, attachment_path")
    .eq("id", invoiceId)
    .eq("organization_id", organization.id)
    .maybeSingle();
  if (!invoice) return { error: "Facture introuvable. Rechargez la page." };

  const { error: deleteError } = await supabase
    .from("purchase_invoices")
    .delete()
    .eq("id", invoiceId)
    .eq("organization_id", organization.id);
  if (deleteError) {
    return { error: "La suppression de la facture a échoué. Réessayez." };
  }

  if (invoice.attachment_path) {
    await supabase.storage.from("invoices").remove([invoice.attachment_path]);
  }

  revalidatePath("/achats");
  return {};
}
