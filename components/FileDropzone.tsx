"use client";

import { useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";

const ACCEPTED_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "JPG",
  "image/png": "PNG",
};
const MAX_SIZE = 10 * 1024 * 1024; // 10 Mo

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
}

// Zone de dépôt partagée : PDF/JPG/PNG, 10 Mo max. Le fichier est porté par
// un <input type="file"> caché soumis avec le formulaire parent (ou celui
// désigné par formId si le formulaire est détaché).
export default function FileDropzone({
  name,
  formId,
}: {
  name: string;
  formId?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function acceptFile(candidate: File) {
    if (!ACCEPTED_TYPES[candidate.type]) {
      setError("Format non pris en charge : utilisez un fichier PDF, JPG ou PNG.");
      return;
    }
    if (candidate.size > MAX_SIZE) {
      setError("Fichier trop volumineux : 10 Mo maximum.");
      return;
    }
    setError(null);
    setFile(candidate);
    // Reporte le fichier dans l'input soumis avec le formulaire
    if (inputRef.current) {
      const dt = new DataTransfer();
      dt.items.add(candidate);
      inputRef.current.files = dt.files;
    }
  }

  function clear() {
    setFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        name={name}
        form={formId}
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) acceptFile(f);
        }}
      />

      {file ? (
        <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-neutral-800">
            <FileText size={20} className="text-brand" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{file.name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {ACCEPTED_TYPES[file.type]} · {formatSize(file.size)}
            </p>
          </div>
          <button
            type="button"
            onClick={clear}
            aria-label="Retirer le fichier"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-700"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) acceptFile(f);
          }}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
            dragging
              ? "border-brand bg-brand/5"
              : "border-neutral-200 bg-neutral-50 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900"
          }`}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-neutral-800">
            <Upload size={20} className="text-brand" />
          </span>
          <p className="mt-3 text-sm font-bold">
            Déposez le fichier ici ou{" "}
            <span className="text-brand">parcourez</span>
          </p>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            PDF, JPG ou PNG · 10 Mo max.
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
