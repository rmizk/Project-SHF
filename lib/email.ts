// Envoi d'email — v1 : aucun fournisseur SMTP configuré.
// On journalise le contenu côté serveur ; à remplacer par un vrai
// fournisseur (Resend, SES…) quand une clé sera disponible.
export async function sendEmail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}) {
  console.log(
    [
      "",
      "=== EMAIL (simulation — aucun fournisseur configuré) ===",
      `À      : ${to}`,
      `Sujet  : ${subject}`,
      "",
      text,
      "=========================================================",
      "",
    ].join("\n")
  );
}
