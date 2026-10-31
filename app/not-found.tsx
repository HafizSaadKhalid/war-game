import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-ink px-5 text-paper">
      <div className="max-w-md border border-line bg-panel p-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-signal">404 / No territory found</p>
        <h1 className="mt-4 font-display text-4xl">This page is off the map.</h1>
        <Link href="/" className="mt-7 inline-block bg-signal px-5 py-3 text-sm font-bold text-ink">Return to registration</Link>
      </div>
    </main>
  );
}