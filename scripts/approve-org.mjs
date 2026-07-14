// Approbation d'une demande d'organisation :
//   npm run approve-org <request_id>
// Crée le compte Supabase Auth (email technique interne), l'organisation,
// et « envoie » les identifiants par email (journalisés en v1).
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Variables d'environnement manquantes (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).\n" +
      "Lancez le script via : npm run approve-org <request_id>"
  );
  process.exit(1);
}

const requestId = process.argv[2];
if (!requestId) {
  console.error("Usage : npm run approve-org <request_id>");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Mot de passe provisoire lisible (sans caractères ambigus)
function generatePassword(length = 12) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from(crypto.randomBytes(length))
    .map((b) => alphabet[b % alphabet.length])
    .join("");
}

async function generateOrgCode() {
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

async function main() {
  const { data: request, error: requestError } = await admin
    .from("organization_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();

  if (requestError) throw requestError;
  if (!request) {
    console.error(`Aucune demande trouvée avec l'id ${requestId}.`);
    process.exit(1);
  }
  if (request.status !== "pending") {
    console.error(`Cette demande a déjà été traitée (statut : ${request.status}).`);
    process.exit(1);
  }

  const orgCode = await generateOrgCode();
  const password = generatePassword();
  const technicalEmail = `${orgCode}@app.interne`;

  // 1. Compte Supabase Auth (email technique interne, jamais affiché)
  const { data: userData, error: userError } =
    await admin.auth.admin.createUser({
      email: technicalEmail,
      password,
      email_confirm: true,
    });
  if (userError) throw userError;
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
      })
      .select("id")
      .single();
    if (orgError) throw orgError;

    // 3. Catégories de dépenses par défaut (modele-donnees.md)
    const DEFAULT_EXPENSE_CATEGORIES = [
      "Restauration",
      "Transport",
      "Bureautique",
      "Relations",
      "Divers",
      "Loyer",
    ];
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

    // 5. Demande approuvée
    const { error: statusError } = await admin
      .from("organization_requests")
      .update({ status: "approved", processed_at: new Date().toISOString() })
      .eq("id", requestId);
    if (statusError) throw statusError;
  } catch (err) {
    // Nettoyage : ne pas laisser un compte Auth orphelin
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    throw err;
  }

  // 6. « Envoi » des identifiants (v1 : journalisation, pas de SMTP)
  const emailBody = [
    `Bonjour ${request.company_name},`,
    "",
    "Votre organisation a été approuvée sur Comptéo. Voici vos identifiants :",
    "",
    `  Identifiant de l'organisation : ${orgCode}`,
    `  Mot de passe provisoire        : ${password}`,
    "",
    "À votre première connexion, vous devrez choisir un nouveau mot de passe.",
    `Connexion : ${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/connexion`,
  ].join("\n");

  console.log("\n=== EMAIL (simulation — aucun fournisseur configuré) ===");
  console.log(`À      : ${request.email}`);
  console.log("Sujet  : Comptéo — Vos identifiants de connexion");
  console.log("");
  console.log(emailBody);
  console.log("=========================================================");
  console.log("\n✔ Demande approuvée, organisation créée.");
}

main().catch((err) => {
  console.error("Échec de l'approbation :", err.message ?? err);
  process.exit(1);
});
