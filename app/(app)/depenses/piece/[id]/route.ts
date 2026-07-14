import { createClient } from "@/lib/supabase/server";

// Ouvre la pièce jointe d'une dépense via une URL signée temporaire.
// La RLS garantit que seule l'organisation propriétaire y accède.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: expense } = await supabase
    .from("expenses")
    .select("attachment_path")
    .eq("id", id)
    .maybeSingle();

  if (!expense?.attachment_path) {
    return new Response("Pièce jointe introuvable.", { status: 404 });
  }

  const { data, error } = await supabase.storage
    .from("expense-receipts")
    .createSignedUrl(expense.attachment_path, 60);

  if (error || !data) {
    return new Response("Impossible d'ouvrir la pièce jointe.", { status: 500 });
  }

  return Response.redirect(data.signedUrl, 307);
}
