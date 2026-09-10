import { useBuyerType } from '@/lib/visitor'

const OPTIONS = [
  { value: 'retail', label: 'At home' },
  { value: 'trade', label: 'For a café' },
] as const

/**
 * "Who are you buying for?" -- the one fact this site tells the CMS about its reader.
 *
 * It sits in the footer rather than the header because it is not navigation and almost nobody
 * needs it: the site reads perfectly well without ever touching it, which is what a *default*
 * value is for. A trade buyer normally arrives on a `?buyer=trade` link from a wholesale email and
 * never sees this control at all.
 *
 * Switching it re-resolves the page against the new context bag. Nothing is refetched by hand and
 * no renderer is involved -- the SDK re-resolves when the context changes, exactly as it does when
 * the path changes.
 */
export function BuyerSwitcher() {
  const [buyerType, setBuyerType] = useBuyerType()

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Who you are buying for">
      <span className="text-sm text-ink-muted">Buying</span>
      {OPTIONS.map((option) => {
        const active = option.value === buyerType
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setBuyerType(option.value)}
            aria-current={active ? 'true' : undefined}
            className={
              active
                ? 'rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent'
                : 'rounded-full px-3 py-1 text-sm text-ink-muted hover:text-ink'
            }
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
