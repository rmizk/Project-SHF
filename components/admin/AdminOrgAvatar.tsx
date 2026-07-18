// Avatar d'une organisation dans la zone admin : logo via la route signée
// admin si présent, sinon initiales (même rendu qu'OrgAvatar).
import { organizationInitials } from "@/lib/organization-utils";

export default function AdminOrgAvatar({
  name,
  logoPath,
  className,
}: {
  name: string;
  logoPath: string | null;
  className: string;
}) {
  if (logoPath) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- URL signée dynamique, pas d'optimisation Next
      <img
        src={`/admin/logo?path=${encodeURIComponent(logoPath)}`}
        alt={`Logo de ${name}`}
        className={`shrink-0 bg-white object-cover ${className}`}
      />
    );
  }
  return (
    <span
      className={`flex shrink-0 items-center justify-center bg-brand font-bold text-white ${className}`}
    >
      {organizationInitials(name)}
    </span>
  );
}
