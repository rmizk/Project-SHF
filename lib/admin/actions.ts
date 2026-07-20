"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/admin/guard";
import { sendEmail } from "@/lib/email";

export type AdminActionState = {
  error?: string;
  success?: string;
  // Identifiants créés à l'approbation, affichés dans un modal pour
  // remise manuelle (les emails Resend en mode test peuvent échouer).
  credentials?: { orgCode: string; password: string };
};

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/organisations");
  revalidatePath("/admin/demandes");
}

// Mot de passe provisoire lisible (sans caractères ambigus)
function generatePassword(length = 12): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from(crypto.randomBytes(length))
    .map((b) => alphabet[b % alphabet.length])
    .join("");
}

async function generateOrgCode(
  admin: ReturnType<typeof createAdminClient>
): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const code = `org-${1000 + crypto.randomInt(9000)}`;
    const { data } = await admin
      .from("organizations")
      .select("id")
      .eq("org_code", code)
      .maybeSingle();
    if (!data) return code;
  }
  throw new Error("Impossible de générer un org_code unique.");
}

const DEFAULT_EXPENSE_CATEGORIES = [
  "Restauration",
  "Transport",
  "Bureautique",
  "Relations",
  "Divers",
  "Loyer",
];

// ------------------------------------------------------------
// Approbation d'une demande : crée l'organisation + compte Auth,
// envoie les identifiants (équivalent de npm run approve-org).
// ------------------------------------------------------------
export async function approveRequest(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireSuperAdmin();
  const requestId = String(formData.get("request_id") ?? "");
  if (!requestId) return { error: "Demande introuvable." };

  const admin = createAdminClient();

  // Réservation atomique : seule une demande encore « pending » peut être
  // approuvée — impossible d'approuver deux fois.
  const { data: request, error: claimError } = await admin
    .from("organization_requests")
    .update({ status: "approved", processed_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();

  if (claimError) {
    return { error: "Impossible de traiter la demande. Réessayez." };
  }
  if (!request) {
    revalidateAdmin();
    return { error: "Cette demande a déjà été traitée." };
  }

  const revertClaim = () =>
    admin
      .from("organization_requests")
      .update({ status: "pending", processed_at: null })
      .eq("id", requestId);

  const orgCode = await generateOrgCode(admin);
  const password = generatePassword();

  // 1. Compte Supabase Auth (email technique interne, jamais affiché)
  const { data: userData, error: userError } = await admin.auth.admin.createUser(
    {
      email: `${orgCode}@app.interne`,
      password,
      email_confirm: true,
    }
  );
  if (userError || !userData.user) {
    await revertClaim();
    return { error: "Impossible de créer le compte de l'organisation." };
  }
  const userId = userData.user.id;

  try {
    // 2. Organisation
    const { data: org, error: orgError } = await admin
      .from("organizations")
      .insert({
        org_code: orgCode,
        name: request.company_name,
        tax_id: request.tax_id,
        email: request.email,
        phone: request.phone,
        auth_user_id: userId,
        must_change_password: true,
        // Conservé en clair tant que l'utilisateur n'a pas choisi son
        // propre mot de passe (remise manuelle par l'admin), puis NULL.
        temp_password: password,
      })
      .select("id")
      .single();
    if (orgError) throw orgError;

    // 3. Catégories de dépenses par défaut
    const { error: categoriesError } = await admin
      .from("expense_categories")
      .insert(
        DEFAULT_EXPENSE_CATEGORIES.map((name) => ({
          organization_id: org.id,
          name,
        }))
      );
    if (categoriesError) throw categoriesError;

    // 4. Claims du JWT (RLS + changement de mot de passe forcé)
    const { error: metaError } = await admin.auth.admin.updateUserById(userId, {
      app_metadata: {
        organization_id: org.id,
        org_code: orgCode,
        must_change_password: true,
      },
    });
    if (metaError) throw metaError;
  } catch (err) {
    // Nettoyage : ni compte Auth orphelin, ni demande bloquée
    console.error("Échec de l'approbation :", err);
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    await revertClaim();
    return { error: "L'approbation a échoué. Réessayez." };
  }

  // 5. Envoi des identifiants — un échec d'envoi n'annule pas l'approbation.
  // TODO : réactiver pleinement après vérification d'un domaine dans Resend
  // (en mode test, seule l'adresse du compte Resend peut recevoir des emails).
  await sendEmail({
    to: request.email,
    subject: "Comptéo — Vos identifiants de connexion",
    text: [
      `Bonjour ${request.company_name},`,
      "",
      "Votre organisation a été approuvée sur Comptéo. Voici vos identifiants :",
      "",
      `  Identifiant de l'organisation : ${orgCode}`,
      `  Mot de passe provisoire        : ${password}`,
      "",
      "À votre première connexion, vous devrez choisir un nouveau mot de passe.",
      `Connexion : ${siteUrl()}/connexion`,
    ].join("\n"),
  });

  revalidateAdmin();
  return {
    success: `Organisation ${orgCode} créée pour ${request.company_name}.`,
    credentials: { orgCode, password },
  };
}

// ------------------------------------------------------------
// Refus d'une demande (équivalent de npm run reject-org)
// ------------------------------------------------------------
export async function rejectRequest(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireSuperAdmin();
  const requestId = String(formData.get("request_id") ?? "");
  if (!requestId) return { error: "Demande introuvable." };

  const admin = createAdminClient();
  const { data: request, error } = await admin
    .from("organization_requests")
    .update({ status: "rejected", processed_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("status", "pending")
    .select("company_name, email")
    .maybeSingle();

  if (error) {
    return { error: "Impossible de traiter la demande. Réessayez." };
  }
  if (!request) {
    revalidateAdmin();
    return { error: "Cette demande a déjà été traitée." };
  }

  // Un échec d'envoi n'annule pas le refus.
  // TODO : réactiver pleinement après vérification d'un domaine dans Resend
  // (en mode test, seule l'adresse du compte Resend peut recevoir des emails).
  await sendEmail({
    to: request.email,
    subject: "Comptéo — Suite de votre demande d'inscription",
    text: [
      `Bonjour ${request.company_name},`,
      "",
      "Nous vous remercions de l'intérêt que vous portez à Comptéo.",
      "",
      "Après examen, nous ne sommes malheureusement pas en mesure de donner",
      "une suite favorable à votre demande d'inscription pour le moment.",
      "",
      "Si vous pensez qu'il s'agit d'une erreur ou si votre situation évolue,",
      "n'hésitez pas à soumettre une nouvelle demande.",
      "",
      "Cordialement,",
      "L'équipe Comptéo",
    ].join("\n"),
  });

  revalidateAdmin();
  return { success: `Demande de ${request.company_name} refusée.` };
}

// ------------------------------------------------------------
// Suppression de demandes traitées. Une demande « en attente » n'est
// jamais supprimable : le filtre sur le statut est appliqué en base.
// ------------------------------------------------------------
export async function deleteRequest(
  requestId: string
): Promise<AdminActionState> {
  await requireSuperAdmin();
  if (!requestId) return { error: "Demande introuvable." };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organization_requests")
    .delete()
    .eq("id", requestId)
    .in("status", ["approved", "rejected"])
    .select("company_name")
    .maybeSingle();

  if (error) return { error: "La suppression a échoué. Réessayez." };
  if (!data) {
    revalidateAdmin();
    return { error: "Seules les demandes traitées peuvent être supprimées." };
  }

  revalidateAdmin();
  return { success: `Demande de ${data.company_name} supprimée.` };
}

export async function deleteProcessedRequests(
  status: "approved" | "rejected"
): Promise<AdminActionState> {
  await requireSuperAdmin();
  if (status !== "approved" && status !== "rejected") {
    return { error: "Seules les demandes traitées peuvent être supprimées." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organization_requests")
    .delete()
    .eq("status", status)
    .select("id");

  if (error) return { error: "La suppression a échoué. Réessayez." };

  revalidateAdmin();
  const count = data?.length ?? 0;
  return {
    success: `${count} demande${count > 1 ? "s" : ""} ${
      status === "approved" ? "approuvée" : "refusée"
    }${count > 1 ? "s" : ""} supprimée${count > 1 ? "s" : ""}.`,
  };
}

// ------------------------------------------------------------
// Suspension / réactivation d'une organisation
// ------------------------------------------------------------
export async function setOrganizationStatus(
  organizationId: string,
  status: "active" | "suspended"
): Promise<AdminActionState> {
  await requireSuperAdmin();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organizations")
    .update({ status })
    .eq("id", organizationId)
    .select("org_code")
    .maybeSingle();

  if (error || !data) {
    return { error: "Impossible de modifier le statut. Réessayez." };
  }

  revalidateAdmin();
  return {
    success:
      status === "suspended"
        ? `Organisation ${data.org_code} suspendue.`
        : `Organisation ${data.org_code} réactivée.`,
  };
}

// ------------------------------------------------------------
// Suppression définitive : données, fichiers Storage et compte Auth.
// Le nom exact de l'organisation est exigé en confirmation.
// ------------------------------------------------------------
const STORAGE_BUCKETS = ["invoices", "expense-receipts", "logos"];

// Ordre de suppression : les enfants d'abord (pas de ON DELETE CASCADE
// sur organization_id ; attachement_deductions suit attachements en cascade).
const CHILD_TABLES = [
  "purchase_invoices",
  "attachements",
  "expenses",
  "accounting_payments",
  "vat_credits",
  "working_capital_history",
  "suppliers",
  "clients",
  "expense_categories",
];

export async function deleteOrganization(
  organizationId: string,
  confirmedName: string
): Promise<AdminActionState> {
  await requireSuperAdmin();

  const admin = createAdminClient();
  const { data: org, error: orgError } = await admin
    .from("organizations")
    .select("id, name, org_code, auth_user_id")
    .eq("id", organizationId)
    .maybeSingle();

  if (orgError || !org) {
    return { error: "Organisation introuvable." };
  }
  if (confirmedName.trim() !== org.name.trim()) {
    return { error: "Le nom saisi ne correspond pas au nom de l'organisation." };
  }

  // 1. Fichiers Storage ({organization_id}/{uuid}.{ext}, sans sous-dossiers)
  for (const bucket of STORAGE_BUCKETS) {
    const { data: files, error: listError } = await admin.storage
      .from(bucket)
      .list(org.id, { limit: 1000 });
    if (listError) {
      return { error: "Impossible de supprimer les fichiers. Réessayez." };
    }
    if (files && files.length > 0) {
      const { error: removeError } = await admin.storage
        .from(bucket)
        .remove(files.map((f) => `${org.id}/${f.name}`));
      if (removeError) {
        return { error: "Impossible de supprimer les fichiers. Réessayez." };
      }
    }
  }

  // 2. Données puis organisation
  for (const table of CHILD_TABLES) {
    const { error } = await admin
      .from(table)
      .delete()
      .eq("organization_id", org.id);
    if (error) {
      console.error(`Suppression ${table} :`, error);
      return { error: "La suppression des données a échoué. Réessayez." };
    }
  }
  const { error: deleteError } = await admin
    .from("organizations")
    .delete()
    .eq("id", org.id);
  if (deleteError) {
    return { error: "La suppression de l'organisation a échoué. Réessayez." };
  }

  // 3. Compte Auth
  await admin.auth.admin.deleteUser(org.auth_user_id).catch((err) => {
    console.error("Suppression du compte Auth :", err);
  });

  revalidateAdmin();
  return { success: `Organisation ${org.org_code} supprimée définitivement.` };
}
