import type { CookieOptions } from "@supabase/ssr";

// Nom du cookie marqueur : présent (valeur "1") quand l'utilisateur n'a PAS
// coché « Rester connecté » — les cookies d'auth deviennent des cookies de
// session (supprimés à la fermeture du navigateur).
export const SESSION_ONLY_COOKIE = "compteo-session-only";

export function stripPersistence(
  options: CookieOptions | undefined,
  sessionOnly: boolean
): CookieOptions | undefined {
  if (!sessionOnly || !options) return options;
  const { maxAge: _maxAge, expires: _expires, ...rest } = options;
  return rest;
}
