import { getCurrentOrganization } from "@/lib/organization";
import { createClient } from "@/lib/supabase/server";

// Sert le logo de l'organisation courante via une URL signée temporaire.
export async function GET() {
  const organization = await getCurrentOrganization();
  if (!organization?.logo_path) {
    return new Response("Logo introuvable.", { status: 404 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("logos")
    .createSignedUrl(organization.logo_path, 60);

  if (error || !data) {
    return new Response("Impossible d'ouvrir le logo.", { status: 500 });
  }

  return Response.redirect(data.signedUrl, 307);
}
