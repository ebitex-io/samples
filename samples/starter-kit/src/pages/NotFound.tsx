import { Link } from 'react-router'

export function NotFound() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24">
      <h1 className="text-3xl font-semibold text-ink">Page not found</h1>
      <p className="mt-4 text-ink-muted">Nothing is published at this address.</p>
      <Link to="/" className="mt-6 inline-block text-accent underline underline-offset-4">
        Back to the home page
      </Link>
    </main>
  )
}
