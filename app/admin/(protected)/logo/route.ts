import type { NextRequest } from "next/server";
import { requireSuperAdmin } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";

// Sert le logo d'une organisation (zone admin) via une URL signée temporaire.
export async function GET(request: NextRequest) {
  await requireSuperAdmin();

  const path = request.nextUrl.searchParams.get("path");
  // Chemin attendu : {organization_id}/{uuid}.{ext}, sans traversée
  if (!path || !/^[0-9a-f-]{36}\/[\w.-]+$/i.test(path)) {
    return new Response("Logo introuvable.", { status: 404 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("logos")
    .createSignedUrl(path, 60);

  if (error || !data) {
    return new Response("Impossible d'ouvrir le logo.", { status: 500 });
  }

  return Response.redirect(data.signedUrl, 307);
}
