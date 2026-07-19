"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient, SESSION_ONLY_COOKIE } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

export type AuthFormState = {
  error?: string;
  success?: string;
};

// Email technique interne : jamais affiché, sert uniquement à Supabase Auth.
function technicalEmail(orgCode: string): string {
  return `${orgCode}@app.interne`;
}

function normalizeOrgCode(raw: FormDataEntryValue | null): string {
  return String(raw ?? "").trim().toLowerCase();
}

// Destinataire des notifications de nouvelles demandes d'organisation.
const ADMIN_NOTIFICATION_EMAIL = "rmizkk@gmail.com";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

// ------------------------------------------------------------
// Connexion : org_code + mot de passe → email technique → Supabase Auth
// ------------------------------------------------------------
export async function signIn(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const orgCode = normalizeOrgCode(formData.get("org_code"));
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";

  if (!orgCode || !password) {
    return { error: "Saisissez votre identifiant d'organisation et votre mot de passe." };
  }

  // Marqueur « Rester connecté » : sans lui, les cookies d'auth sont des
  // cookies de session (supprimés à la fermeture du navigateur).
  const cookieStore = await cookies();
  if (remember) {
    cookieStore.delete(SESSION_ONLY_COOKIE);
  } else {
    cookieStore.set(SESSION_ONLY_COOKIE, "1");
  }

  const supabase = await createClient({ sessionOnly: !remember });
  const { data, error } = await supabase.auth.signInWithPassword({
    email: technicalEmail(orgCode),
    password,
  });

  if (error || !data.user) {
    return { error: "Identifiant d'organisation ou mot de passe incorrect." };
  }

  // Organisation suspendue : connexion refusée (vérifié via service role,
  // le JWT vient d'être émis mais la session est aussitôt fermée).
  const admin = createAdminClient();
  const { data: org, error: orgError } = await admin
    .from("organizations")
    .select("status")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();
  if (!orgError && org?.status === "suspended") {
    await supabase.auth.signOut();
    return {
      error:
        "Votre organisation est suspendue. Contactez l'administrateur pour réactiver votre accès.",
    };
  }

  if (data.user.app_metadata?.must_change_password === true) {
    redirect("/mot-de-passe/nouveau");
  }
  redirect("/");
}

// ------------------------------------------------------------
// Déconnexion
// ------------------------------------------------------------
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}

// ------------------------------------------------------------
// Connexion super admin (zone /admin) : email + mot de passe
// ------------------------------------------------------------
export async function adminSignIn(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Saisissez votre email et votre mot de passe." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: "Email ou mot de passe incorrect." };
  }
  if (data.user.app_metadata?.role !== "super_admin") {
    // Compte valide mais sans droits admin : on referme la session
    await supabase.auth.signOut();
    return { error: "Ce compte n'a pas accès à l'administration." };
  }

  redirect("/admin");
}

export async function adminSignOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// ------------------------------------------------------------
// Changement de mot de passe (forcé à la première connexion)
// ------------------------------------------------------------
export async function changePassword(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }
  if (password !== confirm) {
    return { error: "Les deux mots de passe ne correspondent pas." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/connexion");
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === "same_password") {
      return { error: "Le nouveau mot de passe doit être différent de l'ancien." };
    }
    return { error: "Impossible de mettre à jour le mot de passe. Réessayez." };
  }

  await clearMustChangePassword(user.id, user.app_metadata);

  // Rafraîchit le JWT pour que app_metadata.must_change_password soit à jour.
  await supabase.auth.refreshSession();
  redirect("/");
}

async function clearMustChangePassword(
  userId: string,
  appMetadata: Record<string, unknown>
) {
  const admin = createAdminClient();
  await admin.auth.admin.updateUserById(userId, {
    app_metadata: { ...appMetadata, must_change_password: false },
  });
  // temp_password : le mot de passe provisoire en clair n'est conservé
  // que tant qu'il est actif — effacé dès que l'utilisateur choisit le sien.
  await admin
    .from("organizations")
    .update({ must_change_password: false, temp_password: null })
    .eq("auth_user_id", userId);
}

// ------------------------------------------------------------
// Mot de passe oublié : envoie un lien de réinitialisation à
// l'adresse email de contact de l'organisation.
// ------------------------------------------------------------
export async function requestPasswordReset(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const orgCode = normalizeOrgCode(formData.get("org_code"));
  if (!orgCode) {
    return { error: "Saisissez votre identifiant d'organisation." };
  }

  // Réponse générique dans tous les cas pour ne pas révéler
  // l'existence d'une organisation.
  const genericSuccess =
    "Si cette organisation existe, un email de réinitialisation a été envoyé à l'adresse de contact associée.";

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("id, org_code, name, email")
    .eq("org_code", orgCode)
    .maybeSingle();

  if (org?.email) {
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: technicalEmail(org.org_code),
    });
    if (!error && data.properties?.hashed_token) {
      const url = `${siteUrl()}/mot-de-passe/reinitialiser?token=${encodeURIComponent(
        data.properties.hashed_token
      )}`;
      await sendEmail({
        to: org.email,
        subject: "Comptéo — Réinitialisation de votre mot de passe",
        text: [
          `Bonjour ${org.name},`,
          "",
          `Une réinitialisation du mot de passe a été demandée pour l'organisation ${org.org_code}.`,
          "Pour choisir un nouveau mot de passe, ouvrez ce lien (valable 1 heure) :",
          "",
          url,
          "",
          "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.",
        ].join("\n"),
      });
    }
  }

  return { success: genericSuccess };
}

// ------------------------------------------------------------
// Réinitialisation effective depuis le lien reçu par email
// ------------------------------------------------------------
export async function resetPassword(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!token) {
    return { error: "Lien de réinitialisation invalide. Refaites une demande." };
  }
  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }
  if (password !== confirm) {
    return { error: "Les deux mots de passe ne correspondent pas." };
  }

  const supabase = await createClient();
  const { data: verified, error: verifyError } = await supabase.auth.verifyOtp({
    type: "recovery",
    token_hash: token,
  });
  if (verifyError || !verified.user) {
    return {
      error: "Ce lien de réinitialisation est invalide ou a expiré. Refaites une demande.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: "Impossible de mettre à jour le mot de passe. Réessayez." };
  }

  // L'utilisateur vient de choisir son propre mot de passe : plus besoin
  // du changement forcé.
  await clearMustChangePassword(verified.user.id, verified.user.app_metadata);
  await supabase.auth.refreshSession();
  redirect("/");
}

// ------------------------------------------------------------
// Formulaire public « Demander l'ajout de mon organisation »
// ------------------------------------------------------------
export async function submitOrganizationRequest(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const companyName = String(formData.get("company_name") ?? "").trim();
  const taxId = String(formData.get("tax_id") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!companyName || !taxId || !email) {
    return { error: "Renseignez le nom de la société, le matricule fiscal et l'email." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Adresse email invalide." };
  }

  // Client admin : la RLS n'autorise le SELECT (retour de l'id) qu'au
  // service role sur organization_requests.
  const admin = createAdminClient();
  const { data: request, error } = await admin
    .from("organization_requests")
    .insert({
      company_name: companyName,
      tax_id: taxId,
      email,
      phone: phone || null,
    })
    .select("id")
    .single();

  if (error || !request) {
    return { error: "L'envoi de la demande a échoué. Réessayez dans un instant." };
  }

  // Notification à l'administrateur — un échec d'envoi n'annule pas la demande.
  await sendEmail({
    to: ADMIN_NOTIFICATION_EMAIL,
    subject: `Comptéo — Nouvelle demande d'organisation : ${companyName}`,
    text: [
      "Une nouvelle demande d'organisation vient d'être soumise :",
      "",
      `  Société          : ${companyName}`,
      `  Matricule fiscal : ${taxId}`,
      `  Email            : ${email}`,
      `  Téléphone        : ${phone || "—"}`,
      "",
      `ID de la demande : ${request.id}`,
    ].join("\n"),
  });

  redirect(`/demande-organisation/confirmation?email=${encodeURIComponent(email)}`);
}
