export function NotConfigured() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24">
      <h1 className="text-3xl font-semibold text-ink">Not configured yet</h1>
      <p className="mt-4 text-ink-muted">
        Copy <code className="rounded bg-muted px-1.5 py-0.5">.env.example</code> to <code className="rounded bg-muted px-1.5 py-0.5">.env</code> and set{' '}
        <code className="rounded bg-muted px-1.5 py-0.5">VITE_CONTENT_DELIVERY_KEY</code> to a delivery key from an organization that has opted in to the starter kit.
      </p>
    </main>
  )
}
