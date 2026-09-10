import { Link } from 'react-router'

export function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60svh] max-w-2xl flex-col justify-center px-6 py-24">
      <p className="font-mono text-sm tracking-widest text-ink-muted uppercase">404</p>
      <h1 className="mt-3 font-display text-4xl text-ink">We could not find that page</h1>
      <p className="mt-4 text-lg text-ink-muted">
        It may have moved, or it may never have existed. Either way, the coffee is still where you
        left it.
      </p>
      <Link
        to="/"
        className="mt-8 self-start rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-ink"
      >
        Back to the front page
      </Link>
    </div>
  )
}

export default NotFound
