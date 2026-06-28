'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error;
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        <h1 className="text-3xl font-semibold mb-4">Erreur inattendue</h1>
        <p className="text-sm text-zinc-400 mb-6">Une erreur est survenue. Essayez de recharger la page.</p>
        <pre className="whitespace-pre-wrap break-words rounded-xl bg-zinc-950 p-4 text-xs text-zinc-300">{error.message}</pre>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
