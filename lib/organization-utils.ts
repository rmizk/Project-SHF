// Utilitaires d'organisation partagés client/serveur (sans dépendance serveur).

export type Organization = {
  id: string;
  org_code: string;
  name: string;
  tax_id: string;
  email: string | null;
  phone: string | null;
  logo_path: string | null;
  must_change_password: boolean;
};

// Initiales affichées dans l'avatar (ex. « SARL Meridian » → « SM »)
export function organizationInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("");
}
