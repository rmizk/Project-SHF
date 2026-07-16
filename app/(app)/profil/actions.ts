"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient as createBareClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganization } from "@/lib/organization";
import { parseAmount } from "@/lib/amounts";

export type ProfilFormState = {
  error?: string;
  success?: boolean;
};

// ------------------------------------------------------------
// Logo de l'organisation (bucket « logos », préfixe organisation)
// ------------------------------------------------------------
const LOGO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
};
const LOGO_MAX_SIZE = 2 * 1024 * 1024; // 2 Mo (limite affichée sur la maquette)

export async function uploadLogo(
  _prev: ProfilFormState,
  formData: FormData
): Promise<ProfilFormState> {
  const organization = await getCurrentOrganization();
  if (!organization) redirect("/connexion");

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Sélectionnez une image PNG ou JPG." };
  }
  const ext = LOGO_TYPES[file.type];
  if (!ext) {
    return { error: "Format non pris en charge : utilisez un PNG ou un JPG." };
  }
  if (file.size > LOGO_MAX_SIZE) {
    return { error: "Logo trop volumineux : 2 Mo maximum." };
  }

  const supabase = await createClient();
  const path = `${organization.id}/logo-${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("logos")
    .upload(path, file, { contentType: file.type });
  if (uploadError) {
    return { error: "L'envoi du logo a échoué. Réessayez." };
  }

  const { error: updateError } = await supabase
    .from("organizations")
    .update({ logo_path: path })
    .eq("id", organization.id);
  if (updateError) {
    await supabase.storage.from("logos").remove([path]);
    return { error: "L'enregistrement du logo a échoué. Réessayez." };
  }

  // Supprime l'ancien fichier devenu orphelin
  if (organization.logo_path) {
    await supabase.storage.from("logos").remove([organization.logo_path]);
  }

  revalidatePath("/", "layout");
  return { success: true };
}

// ------------------------------------------------------------
// Nom de la société
// ------------------------------------------------------------
export async function updateOrganizationName(
  _prev: ProfilFormState,
  formData: FormData
): Promise<ProfilFormState> {
  const organization = await getCurrentOrganization();
  if (!organization) redirect("/connexion");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Saisissez le nom de la société." };
  if (name.length > 120) return { error: "Nom trop long (120 caractères max)." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({ name })
    .eq("id", organization.id);
  if (error) {
    return { error: "L'enregistrement du nom a échoué. Réessayez." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

// ------------------------------------------------------------
// Changement de mot de passe depuis le profil : l'ancien mot de
// passe est vérifié via une connexion jetable (sans cookies).
// ------------------------------------------------------------
export async function changeOwnPassword(
  _prev: ProfilFormState,
  formData: FormData
): Promise<ProfilFormState> {
  const organization = await getCurrentOrganization();
  if (!organization) redirect("/connexion");

  const current = String(formData.get("current_password") ?? "");
  const password = String(formData.get("new_password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  if (!current) return { error: "Saisissez votre mot de passe actuel." };
  if (password.length < 8) {
    return { error: "Le nouveau mot de passe doit contenir au moins 8 caractères." };
  }
  if (password !== confirm) {
    return { error: "Les deux nouveaux mots de passe ne correspondent pas." };
  }

  const verifier = createBareClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { error: verifyError } = await verifier.auth.signInWithPassword({
    email: `${organization.org_code}@app.interne`,
    password: current,
  });
  if (verifyError) {
    return { error: "Mot de passe actuel incorrect." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === "same_password") {
      return { error: "Le nouveau mot de passe doit être différent de l'actuel." };
    }
    return { error: "Impossible de mettre à jour le mot de passe. Réessayez." };
  }

  return { success: true };
}

// ------------------------------------------------------------
// Fond de roulement : chaque mise à jour ajoute une ligne à
// l'historique (le montant actuel = dernière ligne).
// ------------------------------------------------------------
export async function updateWorkingCapital(
  _prev: ProfilFormState,
  formData: FormData
): Promise<ProfilFormState> {
  const organization = await getCurrentOrganization();
  if (!organization) redirect("/connexion");

  const amountRaw = String(formData.get("amount") ?? "").trim();
  const amount = amountRaw ? parseAmount(amountRaw) : null;
  if (amount === null) {
    return { error: "Montant invalide : utilisez un nombre positif (3 décimales max)." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("working_capital_history").insert({
    organization_id: organization.id,
    amount,
  });
  if (error) {
    return { error: "L'enregistrement du fond de roulement a échoué. Réessayez." };
  }

  revalidatePath("/profil");
  revalidatePath("/");
  return { success: true };
}

// ------------------------------------------------------------
// Catégories de dépenses : ajouter / renommer / supprimer
// ------------------------------------------------------------
export async function addExpenseCategory(
  _prev: ProfilFormState,
  formData: FormData
): Promise<ProfilFormState> {
  const organization = await getCurrentOrganization();
  if (!organization) redirect("/connexion");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Saisissez le nom de la catégorie." };
  if (name.length > 60) return { error: "Nom trop long (60 caractères max)." };

  const supabase = await createClient();
  const { error } = await supabase.from("expense_categories").insert({
    organization_id: organization.id,
    name,
  });
  if (error) {
    if (error.code === "23505") {
      return { error: `La catégorie « ${name} » existe déjà.` };
    }
    return { error: "L'ajout de la catégorie a échoué. Réessayez." };
  }

  revalidatePath("/profil");
  revalidatePath("/depenses");
  return { success: true };
}

export async function renameExpenseCategory(
  _prev: ProfilFormState,
  formData: FormData
): Promise<ProfilFormState> {
  const organization = await getCurrentOrganization();
  if (!organization) redirect("/connexion");

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id) return { error: "Catégorie introuvable. Rechargez la page." };
  if (!name) return { error: "Saisissez le nouveau nom de la catégorie." };
  if (name.length > 60) return { error: "Nom trop long (60 caractères max)." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expense_categories")
    .update({ name })
    .eq("id", id)
    .select("id");
  if (error) {
    if (error.code === "23505") {
      return { error: `La catégorie « ${name} » existe déjà.` };
    }
    return { error: "Le renommage de la catégorie a échoué. Réessayez." };
  }
  if (!data?.length) {
    return { error: "Catégorie introuvable. Rechargez la page." };
  }

  revalidatePath("/profil");
  revalidatePath("/depenses");
  return { success: true };
}

export async function deleteExpenseCategory(
  _prev: ProfilFormState,
  formData: FormData
): Promise<ProfilFormState> {
  const organization = await getCurrentOrganization();
  if (!organization) redirect("/connexion");

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Catégorie introuvable. Rechargez la page." };

  const supabase = await createClient();
  const { error } = await supabase.from("expense_categories").delete().eq("id", id);
  if (error) {
    // 23503 : la catégorie est référencée par des dépenses existantes
    if (error.code === "23503") {
      return {
        error:
          "Impossible de supprimer : des dépenses utilisent cette catégorie.",
      };
    }
    return { error: "La suppression de la catégorie a échoué. Réessayez." };
  }

  revalidatePath("/profil");
  revalidatePath("/depenses");
  return { success: true };
}
