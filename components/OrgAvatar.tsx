// Avatar de l'organisation : logo uploadé si présent, sinon initiales.
// Le paramètre « v » (chemin unique par upload) invalide le cache navigateur.

import {
  organizationInitials,
  type Organization,
} from "@/lib/organization-utils";

export default function OrgAvatar({
  organization,
  className,
}: {
  organization: Pick<Organization, "name" | "logo_path">;
  className: string;
}) {
  if (organization.logo_path) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- URL signée dynamique, pas d'optimisation Next
      <img
        src={`/profil/logo?v=${encodeURIComponent(organization.logo_path)}`}
        alt={`Logo de ${organization.name}`}
        className={`shrink-0 bg-white object-cover ${className}`}
      />
    );
  }
  return (
    <span
      className={`flex shrink-0 items-center justify-center bg-brand font-bold text-white ${className}`}
    >
      {organizationInitials(organization.name)}
    </span>
  );
}
