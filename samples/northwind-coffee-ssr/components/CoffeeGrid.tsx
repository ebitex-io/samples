'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SiteLink } from '@/components/SiteLink'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { ComponentListItem, StreamFacetValue } from '@ebitex/content-sdk'

import { CmsImage } from '@/components/CmsImage'
import { useLocale } from '@/lib/locale'
import { useCatalogueSeed } from '@/lib/catalogueSeed'
import { PAGE_SIZE, catalogueSignature, type CatalogueFacets } from '@/lib/catalogue'
import type { Coffee } from '@/types/content'
import { formatPrice } from '@/lib/format'

/**
 * The catalogue grid: one server-side query, not a client-side filter over everything.
 *
 * The distinction matters more than it looks. Fetching all eight coffees and filtering them in the
 * browser would work perfectly today and stop working at some size nobody will notice until a
 * customer does. A stream keeps the work on the server whatever the catalogue grows to, and gives
 * back facet counts that are actually true.
 *
 * Filter state lives in the URL, so a filtered view is a link someone can send.
 *
 * ---- The first page comes from the server ----
 *
 * This is a client component and cannot fetch on the server, so `app/[[...path]]/page.tsx` fetches
 * the first page for it and hands it down through context. Without that, the flagship browse page
 * delivered a search box and an empty list to anything that does not run JavaScript — as invisible
 * to a crawler as the static sample's, which is the one comparison this sample exists to make.
 *
 * Everything below still works with no seed at all: that is the path a filter change takes, and the
 * path the whole page takes if the prefetch failed.
 */
export function CoffeeGrid() {
  const locale = useLocale()
  const seed = useCatalogueSeed()
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  // next/navigation's useSearchParams is read-only, unlike react-router's tuple — a write is a
  // navigation. Same behaviour, expressed as the router call it always was underneath.
  const setParams = useCallback(
    (next: URLSearchParams) => {
      const query = next.toString()
      router.replace(`${pathname}${query ? `?${query}` : ''}`)
    },
    [router, pathname],
  )
  const roast = params.get('roast') ?? undefined
  const origin = params.get('origin') ?? undefined
  const q = params.get('q') ?? ''

  const [search, setSearch] = useState(q)

  // Every request carries the *same* active filters. The facets endpoint excludes a facet's own
  // dimension server-side, so asking for roast counts while a roast is selected still returns
  // every roast -- which is what lets someone switch selection rather than having to clear first.
  const filters = useMemo(() => {
    const f: Record<string, string> = {}
    if (roast) f.roast = roast
    if (origin) f.origin = origin
    if (q) f.q = q
    return f
  }, [roast, origin, q])

  // The question being asked right now, as one string. Compared against the seed's own, because a
  // reader can arrive at /coffees?roast=light with a seed the server built for exactly that.
  const signature = catalogueSignature(filters, locale)
  const seeded = seed !== undefined && seed.signature === signature

  const [items, setItems] = useState<ComponentListItem[]>(seeded ? seed.items : [])
  const [cursor, setCursor] = useState<string | null>(seeded ? seed.nextCursor : null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(seeded ? 'ready' : 'loading')
  const [facets, setFacets] = useState<CatalogueFacets>(
    seeded ? seed.facets : { roast: [], origin: [] },
  )

  // Which question the data in state currently answers.
  //
  // This is deliberately *not* a "have I mounted yet?" flag, and the difference is the whole reason
  // the server's work survives. A first-render flag stops being true one render later, so the effect
  // below would fetch anyway and replace an already-rendered grid with a loading state -- the exact
  // shape of bug spec 601 was filed for. Asking "do I already have data for this?" instead stays
  // correct for as long as it should: it survives React's double-invoked effects in development,
  // and it goes stale the moment a filter changes, including a change back to the seeded one.
  const answered = useRef<string | null>(seeded ? signature : null)

  // The static sample calls the Delivery API directly here, with a browser-safe key. This sample's
  // key is server-side only, so the browser asks *this site* instead -- see app/api/coffees/route.ts
  // for what that buys and what it costs. The three parallel requests became one, because a server
  // can fan out on the client's behalf.
  useEffect(() => {
    if (answered.current === signature) return

    const controller = new AbortController()
    setStatus('loading')
    fetch(`/api/coffees?${query(filters, locale)}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((data) => {
        answered.current = signature
        setItems(data.items)
        setCursor(data.nextCursor ?? null)
        // Both facets arrive already scoped: the `roast` declared filter names the Category Group
        // it speaks for (`groupExternalId`), which is what keeps a `coffee` carrying both a roast
        // and a process from answering either facet with the other group's values.
        if (data.facets) setFacets({ roast: data.facets.roast, origin: data.facets.origin })
        setStatus('ready')
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        console.error(error)
        setStatus('error')
      })
    return () => controller.abort()
  }, [filters, locale, signature])

  const setFilter = useCallback(
    (key: string, value: string | undefined) => {
      const next = new URLSearchParams(params)
      if (value === undefined || next.get(key) === value) next.delete(key)
      else next.set(key, value)
      setParams(next)
    },
    [params, setParams],
  )

  // The search box is debounced into the URL rather than fired on every keystroke.
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const onSearch = (value: string) => {
    setSearch(value)
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => setFilter('q', value.trim() || undefined), 250)
  }

  const loadMore = async () => {
    if (!cursor) return
    const response = await fetch(`/api/coffees?${query(filters, locale, cursor)}`)
    if (!response.ok) return
    const data = await response.json()
    setItems((current) => [...current, ...data.items])
    setCursor(data.nextCursor ?? null)
  }

  const hasFilters = Boolean(roast || origin || q)

  return (
    <div>
      <div className="flex flex-col gap-4 border-y border-line py-5">
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search tasting notes, producers, origins…"
          aria-label="Search coffees"
          className="w-full rounded-full border border-line bg-raised px-5 py-2.5 text-ink placeholder:text-ink-muted"
        />
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <FacetChips
            label="Roast"
            values={facets.roast}
            selected={roast}
            onSelect={(v) => setFilter('roast', v)}
          />
          <FacetChips
            label="Origin"
            values={facets.origin}
            selected={origin}
            onSelect={(v) => setFilter('origin', v)}
          />
        </div>
      </div>

      {status === 'error' ? (
        <p className="py-16 text-center text-ink-muted">
          We could not load the catalogue just now. Please try again.
        </p>
      ) : items.length === 0 && status === 'ready' ? (
        <div className="py-16 text-center">
          <p className="text-ink-muted">Nothing matches that.</p>
          {hasFilters ? (
            <button
              type="button"
              onClick={() => setParams(new URLSearchParams())}
              className="mt-3 text-accent underline underline-offset-4"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      ) : (
        <ul className="grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <CoffeeCard key={item.key} item={item} />
          ))}
        </ul>
      )}

      {cursor ? (
        <p className="pb-12 text-center">
          <button
            type="button"
            onClick={loadMore}
            className="rounded-full border border-line px-5 py-2.5 text-sm text-ink"
          >
            Load more
          </button>
        </p>
      ) : null}
    </div>
  )
}

function FacetChips({
  label,
  values,
  selected,
  onSelect,
}: {
  label: string
  values: StreamFacetValue[]
  selected: string | undefined
  onSelect: (value: string) => void
}) {
  if (values.length === 0) return null
  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="sr-only">{label}</legend>
      <span className="font-mono text-xs tracking-widest text-ink-muted uppercase">{label}</span>
      {values.map((v) => (
        <button
          key={v.value}
          type="button"
          aria-pressed={selected === v.value}
          onClick={() => onSelect(v.value)}
          className={
            selected === v.value
              ? 'rounded-full bg-accent px-3 py-1 text-sm text-accent-ink'
              : 'rounded-full border border-line px-3 py-1 text-sm text-ink-muted'
          }
        >
          {v.label ?? v.value}{' '}
          <span className={selected === v.value ? 'opacity-70' : 'text-ink-muted/70'}>
            {v.count}
          </span>
        </button>
      ))}
    </fieldset>
  )
}

/**
 * One card. `paths` comes from the stream itself -- the published path of the node this coffee is
 * bound to -- so the link is a fact rather than a URL built out of the coffee's name. A coffee
 * with no published page is not linkable and is skipped: a card has to go somewhere.
 */
function CoffeeCard({ item }: { item: ComponentListItem }) {
  const content = item.content as Coffee | undefined
  const path = item.paths?.[0]?.path
  if (!content || !path) return null

  return (
    <li className="group">
      <SiteLink href={path} className="block">
        <div className="overflow-hidden rounded-2xl border border-line bg-sunken">
          {content.image?.content ? (
            <CmsImage
              file={content.image.content.file}
              alt={content.image.content.alt}
              className="aspect-4/3 w-full object-cover"
            />
          ) : (
            <div className="aspect-4/3 w-full" />
          )}
        </div>
        <h2 className="mt-4 font-display text-xl text-ink group-hover:text-accent">
          {item.title ?? content.name}
        </h2>
        {content['tasting-notes']?.length ? (
          <p className="mt-1 text-sm text-ink-muted">{content['tasting-notes'].join(' · ')}</p>
        ) : null}
        {content.price !== undefined ? (
          <p className="mt-2 text-ink">{formatPrice(content.price)}</p>
        ) : null}
      </SiteLink>
    </li>
  )
}

/** Filters plus locale (and an optional cursor) as this site's own query string. */
function query(filters: Record<string, string>, locale: string, cursor?: string): string {
  const params = new URLSearchParams(filters)
  params.set('locale', locale)
  params.set('limit', String(PAGE_SIZE))
  if (cursor) params.set('cursor', cursor)
  return params.toString()
}
