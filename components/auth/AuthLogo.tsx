export default function AuthLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
        <span className="h-2.5 w-2.5 rounded-full bg-sidebar" />
      </span>
      <span className="text-lg font-bold text-white">Comptéo</span>
    </div>
  );
}
