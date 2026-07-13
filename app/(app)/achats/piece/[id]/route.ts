import { createClient } from "@/lib/supabase/server";

// Ouvre la pièce jointe d'une facture via une URL signée temporaire.
// La RLS garantit que seule l'organisation propriétaire y accède.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("purchase_invoices")
    .select("attachment_path")
    .eq("id", id)
    .maybeSingle();

  if (!invoice?.attachment_path) {
    return new Response("Pièce jointe introuvable.", { status: 404 });
  }

  const { data, error } = await supabase.storage
    .from("invoices")
    .createSignedUrl(invoice.attachment_path, 60);

  if (error || !data) {
    return new Response("Impossible d'ouvrir la pièce jointe.", { status: 500 });
  }

  return Response.redirect(data.signedUrl, 307);
}
