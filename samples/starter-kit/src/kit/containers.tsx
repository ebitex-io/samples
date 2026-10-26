import { useId, useState } from 'react'
import type { ComponentValue } from '@ebitex/content-sdk'

import { Section } from '@/kit/Section'
import { text, whole } from '@/lib/vocab'

/** Tabs, Accordion and Grid all hold `items`: references to other presentations. */
export interface ContainerContent {
  items?: ReadonlyArray<ComponentValue | null>
  columns?: number
}

/** The per-item facts a container reads: they were set where the item is placed, so they arrive in the item's own content. */
interface ItemFacts {
  itemLabel?: string
  openByDefault?: boolean
  span?: number
  internalName?: string
  title?: string
  heading?: string
}

/** The content of an item that has been expanded; an unexpanded one has none, and gets a placeholder label until it resolves. */
function factsOf(item: ComponentValue | null): ItemFacts {
  return (item && 'content' in item && item.content ? (item.content as ItemFacts) : {}) as ItemFacts
}

/** The label an item shows in a tab or an accordion header: the placing edge's label, then the item's own name. */
function labelOf(item: ComponentValue | null, index: number): string {
  const facts = factsOf(item)
  return text(facts.itemLabel) ?? text(facts.internalName) ?? text(facts.title) ?? text(facts.heading) ?? `Item ${index + 1}`
}

function present(items: ContainerContent['items']): ComponentValue[] {
  return (items ?? []).filter((item): item is ComponentValue => item !== null && item !== undefined)
}

export function Tabs({ content }: { content: ContainerContent }) {
  const items = present(content.items)
  const [selected, setSelected] = useState(0)
  const id = useId()
  if (items.length === 0) return null
  const current = Math.min(selected, items.length - 1)

  return (
    <div>
      <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-line">
        {items.map((item, index) => (
          <button
            key={index}
            id={`${id}-tab-${index}`}
            role="tab"
            type="button"
            aria-selected={index === current}
            aria-controls={`${id}-panel-${index}`}
            tabIndex={index === current ? 0 : -1}
            onClick={() => setSelected(index)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight') setSelected((current + 1) % items.length)
              if (event.key === 'ArrowLeft') setSelected((current - 1 + items.length) % items.length)
            }}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium ${index === current ? 'border-accent text-accent' : 'border-transparent text-ink-muted hover:text-ink'}`}
          >
            {labelOf(item, index)}
          </button>
        ))}
      </div>
      {items.map((item, index) => (
        <div key={index} id={`${id}-panel-${index}`} role="tabpanel" aria-labelledby={`${id}-tab-${index}`} hidden={index !== current} className="pt-6">
          {index === current ? <Section value={item} nested /> : null}
        </div>
      ))}
    </div>
  )
}

export function Accordion({ content }: { content: ContainerContent }) {
  const items = present(content.items)
  const id = useId()
  if (items.length === 0) return null

  return (
    <div className="divide-y divide-line rounded-xl border border-line bg-raised">
      {items.map((item, index) => (
        <AccordionItem key={index} id={`${id}-${index}`} label={labelOf(item, index)} openByDefault={factsOf(item).openByDefault === true}>
          <Section value={item} nested />
        </AccordionItem>
      ))}
    </div>
  )
}

function AccordionItem({ id, label, openByDefault, children }: { id: string; label: string; openByDefault: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(openByDefault)
  return (
    <div>
      <h3>
        <button type="button" aria-expanded={open} aria-controls={`${id}-panel`} id={`${id}-button`} onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-medium text-ink">
          {label}
          <span aria-hidden className={`text-ink-muted transition ${open ? 'rotate-180' : ''}`}>
            ▾
          </span>
        </button>
      </h3>
      <div id={`${id}-panel`} role="region" aria-labelledby={`${id}-button`} hidden={!open} className="px-5 pb-5 text-ink-muted">
        {open ? children : null}
      </div>
    </div>
  )
}

const COLUMNS: Record<number, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
}
const SPANS: Record<number, string> = { 1: '', 2: 'sm:col-span-2', 3: 'sm:col-span-2 lg:col-span-3', 4: 'sm:col-span-2 lg:col-span-4' }

export function Grid({ content }: { content: ContainerContent }) {
  const items = present(content.items)
  if (items.length === 0) return null
  const columns = whole(content.columns, 3, 1, 4)

  return (
    <div className={`grid grid-cols-1 gap-6 ${COLUMNS[columns]}`}>
      {items.map((item, index) => {
        const span = Math.min(whole(factsOf(item).span, 1, 1, 4), columns)
        return (
          <div key={index} className={SPANS[span]}>
            <Section value={item} nested />
          </div>
        )
      })}
    </div>
  )
}
