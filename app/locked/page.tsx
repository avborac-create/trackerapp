export default function LockedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6">
      <div className="max-w-sm text-center">
        <div
          className="mx-auto mb-5 grid h-12 w-12 grid-cols-2 grid-rows-2 gap-1 rounded-2xl bg-[var(--foreground)] p-2"
          aria-hidden
        >
          <span className="rounded-sm bg-violet-500" />
          <span className="rounded-sm bg-amber-400" />
          <span className="rounded-sm bg-rose-500" />
          <span className="rounded-sm bg-emerald-500" />
        </div>
        <h1 className="font-display text-lg text-[var(--foreground)]">
          Erişim linki gerekli
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Bu sayfayı açmak için sana verilen özel bağlantıyı kullan.
        </p>
      </div>
    </main>
  );
}
