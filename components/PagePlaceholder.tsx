export default function PagePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="max-w-md rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center dark:border-neutral-700 dark:bg-card-dark">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          {description}
        </p>
      </div>
    </div>
  );
}
