export default function LockedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-6 dark:bg-neutral-950">
      <div className="max-w-sm text-center">
        <h1 className="text-lg font-medium text-neutral-800 dark:text-neutral-100">
          Erişim linki gerekli
        </h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Bu sayfayı açmak için sana verilen özel bağlantıyı kullan.
        </p>
      </div>
    </main>
  );
}
