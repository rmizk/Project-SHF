// Création d'un compte super admin :
//   npm run create-super-admin <email> <mot_de_passe>
// Crée un utilisateur Supabase Auth avec app_metadata.role = 'super_admin',
// qui donne accès à la zone /admin de l'application.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Variables d'environnement manquantes (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).\n" +
      "Lancez le script via : npm run create-super-admin <email> <mot_de_passe>"
  );
  process.exit(1);
}

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("Usage : npm run create-super-admin <email> <mot_de_passe>");
  process.exit(1);
}
if (password.length < 8) {
  console.error("Le mot de passe doit contenir au moins 8 caractères.");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "super_admin" },
  });
  if (error) {
    if (error.code === "email_exists") {
      console.error(`Un compte existe déjà avec l'adresse ${email}.`);
      process.exit(1);
    }
    throw error;
  }

  console.log(`\n✔ Super admin créé : ${email} (id ${data.user.id}).`);
  console.log(
    `Connexion : ${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/admin/login`
  );
}

main().catch((err) => {
  console.error("Échec de la création :", err.message ?? err);
  process.exit(1);
});
