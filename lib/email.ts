// Envoi d'email via Resend (https://resend.com).
// Expéditeur onboarding@resend.dev tant qu'aucun domaine n'est vérifié.
// Sans RESEND_API_KEY : simulation journalisée (utile en développement).
// Ne lève jamais : un échec d'envoi ne doit pas faire échouer l'action
// principale (enregistrement, approbation…) — il est journalisé.

const FROM = "Comptéo <onboarding@resend.dev>";

export async function sendEmail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(
      [
        "",
        "=== EMAIL (simulation — RESEND_API_KEY absente) ===",
        `À      : ${to}`,
        `Sujet  : ${subject}`,
        "",
        text,
        "===================================================",
        "",
      ].join("\n")
    );
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to: [to], subject, text }),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(
        `Échec de l'envoi de l'email « ${subject} » à ${to} : ${response.status} ${body}`
      );
    }
  } catch (err) {
    console.error(`Échec de l'envoi de l'email « ${subject} » à ${to} :`, err);
  }
}
