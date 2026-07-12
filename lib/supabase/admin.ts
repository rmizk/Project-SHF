import { createClient } from "@supabase/supabase-js";

// Client avec la clé service role — à n'utiliser que côté serveur
// (Server Actions / Route Handlers), jamais importé dans un composant client.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
