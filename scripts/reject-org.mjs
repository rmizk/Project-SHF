// Refus d'une demande d'organisation :
//   npm run reject-org <request_id>
// Marque la demande refusée et envoie un email poli au demandeur (Resend).
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "./email.mjs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Variables d'environnement manquantes (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).\n" +
      "Lancez le script via : npm run reject-org <request_id>"
  );
  process.exit(1);
}

const requestId = process.argv[2];
if (!requestId) {
  console.error("Usage : npm run reject-org <request_id>");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

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

  const { error: statusError } = await admin
    .from("organization_requests")
    .update({ status: "rejected", processed_at: new Date().toISOString() })
    .eq("id", requestId);
  if (statusError) throw statusError;

  console.log(`\n✔ Demande de « ${request.company_name} » refusée.`);

  // Email au demandeur — échec non bloquant, la demande est déjà refusée.
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
}

main().catch((err) => {
  console.error("Échec du refus :", err.message ?? err);
  process.exit(1);
});
