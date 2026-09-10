/**
 * What a fresh clone shows before `.env` exists. Deliberately not a 404: the
 * site is fine, it just has nowhere to read content from yet, and saying so is
 * the difference between a two-minute fix and a bug report.
 */
export function NotConfigured() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24">
      <p className="font-mono text-sm tracking-widest text-ink-muted uppercase">Setup</p>
      <h1 className="mt-3 font-display text-4xl text-ink">No delivery key configured</h1>
      <p className="mt-4 text-lg text-ink-muted">
        This sample reads its content from an ebitex organization that you control. It needs a
        Content delivery key from that organization before it can show anything.
      </p>
      <ol className="mt-8 space-y-4 text-ink">
        <li>
          <span className="font-medium">1.</span> Import a seed bundle from{' '}
          <code className="rounded bg-sunken px-1.5 py-0.5 text-sm">seed/</code> into your
          organization, through Content &rarr; Configure &rarr; Transfer.
        </li>
        <li>
          <span className="font-medium">2.</span> Create a delivery key in Content &rarr; Configure
          &rarr; Delivery.
        </li>
        <li>
          <span className="font-medium">3.</span> Copy{' '}
          <code className="rounded bg-sunken px-1.5 py-0.5 text-sm">.env.example</code> to{' '}
          <code className="rounded bg-sunken px-1.5 py-0.5 text-sm">.env</code>, paste the key into{' '}
          <code className="rounded bg-sunken px-1.5 py-0.5 text-sm">VITE_CONTENT_DELIVERY_KEY</code>
          , and restart the dev server.
        </li>
      </ol>
      <p className="mt-8 text-sm text-ink-muted">
        The README walks through all three in more detail.
      </p>
    </div>
  )
}

export default NotConfigured
