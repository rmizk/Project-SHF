// Badge d'état partagé : pastille + libellé sur fond teinté.

const VARIANTS = {
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  warning: "bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400",
  neutral: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
} as const;

const DOTS = {
  success: "bg-emerald-500",
  warning: "bg-orange-500",
  neutral: "bg-neutral-400",
} as const;

export type StatusVariant = keyof typeof VARIANTS;

export default function StatusBadge({
  variant,
  children,
}: Readonly<{ variant: StatusVariant; children: React.ReactNode }>) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold sm:px-3 sm:py-1.5 sm:text-sm ${VARIANTS[variant]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOTS[variant]}`} />
      {children}
    </span>
  );
}
