import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 px-4 py-12">
      <div className="max-w-xl w-full rounded-3xl border border-zinc-800 bg-zinc-900 p-10 shadow-2xl">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-400 mb-4">Page introuvable</p>
        <h1 className="text-5xl font-semibold mb-6">404</h1>
        <p className="text-base leading-7 text-zinc-400 mb-8">
          La page que vous recherchez est introuvable ou n’existe plus.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
        >
          Retour à l’accueil
        </Link>
      </div>
    </main>
  );
}
