import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Organization } from "@/lib/organization-utils";

export type { Organization } from "@/lib/organization-utils";

// Organisation de la session courante (RLS : chaque compte ne voit que la sienne).
// `cache` : une seule requête par rendu, même si plusieurs composants l'appellent.
export const getCurrentOrganization = cache(
  async (): Promise<Organization | null> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("organizations")
      .select(
        "id, org_code, name, tax_id, email, phone, logo_path, must_change_password"
      )
      .eq("auth_user_id", user.id)
      .maybeSingle();

    return data;
  }
);
