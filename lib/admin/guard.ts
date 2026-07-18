import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Garde serveur de la zone /admin : le proxy protège déjà les routes,
// ceci revérifie le rôle dans chaque layout / Server Action.
export async function requireSuperAdmin(): Promise<{ userId: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");
  if (user.app_metadata?.role !== "super_admin") redirect("/");

  return { userId: user.id };
}
