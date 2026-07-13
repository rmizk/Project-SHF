import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SESSION_ONLY_COOKIE, stripPersistence } from "./cookies";

export { SESSION_ONLY_COOKIE } from "./cookies";

export async function createClient(opts?: { sessionOnly?: boolean }) {
  const cookieStore = await cookies();
  const sessionOnly =
    opts?.sessionOnly ?? cookieStore.get(SESSION_ONLY_COOKIE)?.value === "1";

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, stripPersistence(options, sessionOnly))
            );
          } catch {
            // Appelé depuis un Server Component : les cookies seront
            // rafraîchis par le proxy, on peut ignorer l'erreur.
          }
        },
      },
    }
  );
}
