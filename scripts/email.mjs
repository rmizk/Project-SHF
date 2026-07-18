// Envoi d'email via Resend pour les scripts d'administration.
// Sans RESEND_API_KEY : simulation journalisée. Ne lève jamais —
// un échec d'envoi ne doit pas faire échouer l'action principale.

const FROM = "Comptéo <onboarding@resend.dev>";

export async function sendEmail({ to, subject, text }) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log("\n=== EMAIL (simulation — RESEND_API_KEY absente) ===");
    console.log(`À      : ${to}`);
    console.log(`Sujet  : ${subject}`);
    console.log("");
    console.log(text);
    console.log("===================================================\n");
    return false;
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
        `⚠ Échec de l'envoi de l'email à ${to} : ${response.status} ${body}`
      );
      return false;
    }
    console.log(`✔ Email envoyé à ${to} (« ${subject} »).`);
    return true;
  } catch (err) {
    console.error(`⚠ Échec de l'envoi de l'email à ${to} :`, err?.message ?? err);
    return false;
  }
}
