import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import OrganisationsClient, { type AdminOrganization } from "./OrganisationsClient";

export const metadata: Metadata = {
  title: "Organisations — Administration Comptéo",
};

export default async function AdminOrganisationsPage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("organizations")
    .select(
      "id, org_code, name, tax_id, email, logo_path, status, created_at, temp_password"
    )
    .order("created_at", { ascending: false });

  return <OrganisationsClient organizations={(data ?? []) as AdminOrganization[]} />;
}
