import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import DemandesClient, { type AdminRequest } from "./DemandesClient";

export const metadata: Metadata = {
  title: "Demandes — Administration Comptéo",
};

export default async function AdminDemandesPage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("organization_requests")
    .select("id, company_name, tax_id, email, phone, status, created_at")
    .order("created_at", { ascending: false });

  return <DemandesClient requests={(data ?? []) as AdminRequest[]} />;
}
