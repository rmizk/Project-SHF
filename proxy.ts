import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_ONLY_COOKIE, stripPersistence } from "@/lib/supabase/cookies";

// Routes accessibles sans session
const PUBLIC_PATHS = [
  "/connexion",
  "/demande-organisation",
  "/mot-de-passe/oublie",
  "/mot-de-passe/reinitialiser",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export default async function proxy(request: NextRequest) {
  const sessionOnly = request.cookies.get(SESSION_ONLY_COOKIE)?.value === "1";
  let cookiesToSet: {
    name: string;
    value: string;
    options?: Parameters<NextResponse["cookies"]["set"]>[2];
  }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          cookiesToSet = cookies.map(({ name, value, options }) => ({
            name,
            value,
            options: stripPersistence(options, sessionOnly),
          }));
          cookies.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = isPublicPath(pathname);
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const isSuperAdmin = user?.app_metadata?.role === "super_admin";

  const applyCookies = (response: NextResponse) => {
    cookiesToSet.forEach(({ name, value, options }) =>
      response.cookies.set(name, value, options)
    );
    return response;
  };
  const redirectTo = (path: string) =>
    applyCookies(NextResponse.redirect(new URL(path, request.url)));

  // Zone /admin : réservée au rôle super_admin
  if (isAdminPath) {
    if (pathname === "/admin/login") {
      // Déjà connecté en super admin : direction le tableau de bord admin
      if (isSuperAdmin) return redirectTo("/admin");
      return applyCookies(NextResponse.next({ request }));
    }
    if (!user) return redirectTo("/admin/login");
    // Une organisation connectée n'a rien à faire ici
    if (!isSuperAdmin) return redirectTo("/");
    return applyCookies(NextResponse.next({ request }));
  }

  // Un super admin n'a pas d'organisation : tout le reste le renvoie vers /admin
  if (isSuperAdmin) {
    return redirectTo("/admin");
  }

  // Pas de session : tout sauf les routes publiques exige une connexion
  if (!user) {
    if (!isPublic) return redirectTo("/connexion");
    return applyCookies(NextResponse.next({ request }));
  }

  const mustChangePassword = user.app_metadata?.must_change_password === true;
  const organizationId = user.app_metadata?.organization_id as
    | string
    | undefined;

  // Changement de mot de passe forcé : tant qu'il n'est pas fait,
  // seule la page dédiée est accessible (et la réinitialisation par email).
  if (mustChangePassword) {
    if (
      pathname !== "/mot-de-passe/nouveau" &&
      !pathname.startsWith("/mot-de-passe/reinitialiser")
    ) {
      return redirectTo("/mot-de-passe/nouveau");
    }
  } else if (pathname === "/connexion" || pathname === "/mot-de-passe/nouveau") {
    // Déjà connecté : inutile de revoir la page de connexion
    return redirectTo("/");
  }

  // Injecte l'organisation courante pour les Server Components / Actions
  const requestHeaders = new Headers(request.headers);
  if (organizationId) {
    requestHeaders.set("x-organization-id", organizationId);
  }

  return applyCookies(
    NextResponse.next({ request: { headers: requestHeaders } })
  );
}

export const config = {
  matcher: [
    // Tout sauf les fichiers statiques Next et les assets
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
