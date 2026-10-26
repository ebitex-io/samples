import type { ReactNode } from 'react'
import type { BlobValue, RichTextValue } from '@ebitex/content-sdk'
import { RichText } from '@ebitex/content-sdk/react'

import { Action, hrefOf, type ActionContent } from '@/kit/Action'
import { Media } from '@/kit/Media'
import { EMPHASES, pick, text, TONES, type Tone } from '@/lib/vocab'

type Inline = { content: ActionContent } | undefined

/** What each kit Contract delivers. Optional wherever the Contract does not make the field mandatory. */
export interface HeroContent { heading: string; lead?: RichTextValue; media?: BlobValue; primaryAction?: Inline; secondaryAction?: Inline; layout?: string }
export interface RichTextContent { body: RichTextValue }
export interface MediaContent { media: BlobValue; alt?: string; caption?: string; aspect?: string }
export interface CardContent { title: string; summary?: string; media?: BlobValue; action?: Inline; emphasis?: string }
export interface FeatureContent { icon?: string; title: string; body?: string }
export interface BannerContent { message: RichTextValue; action?: Inline; tone?: string }
export interface CtaContent { heading: string; body?: string; primaryAction?: Inline; secondaryAction?: Inline }

export function Hero({ content }: { content: HeroContent }) {
  const split = content.layout === 'split' && content.media
  return (
    <div className={split ? 'grid items-center gap-10 md:grid-cols-2' : 'text-center'}>
      <div>
        <h1 className="text-4xl leading-tight font-semibold tracking-tight text-ink sm:text-5xl">{content.heading}</h1>
        {content.lead ? (
          <div className={`mt-5 text-lg text-ink-muted ${split ? '' : 'mx-auto max-w-2xl'}`}>
            <RichText fragments={content.lead} />
          </div>
        ) : null}
        <Actions className={split ? '' : 'justify-center'}>
          <Action action={content.primaryAction} />
          <Action action={content.secondaryAction} fallbackStyle="secondary" />
        </Actions>
      </div>
      {content.media ? (
        <div className={split ? '' : 'mx-auto mt-10 max-w-3xl'}>
          <Media blob={content.media} aspect="16:9" />
        </div>
      ) : null}
    </div>
  )
}

export function RichTextBlock({ content }: { content: RichTextContent }) {
  return (
    <div className="text-ink-muted">
      <RichText fragments={content.body} />
    </div>
  )
}

export function MediaBlock({ content }: { content: MediaContent }) {
  return (
    <figure>
      <Media blob={content.media} alt={content.alt} aspect={content.aspect} />
      {text(content.caption) ? <figcaption className="mt-3 text-center text-sm text-ink-muted">{content.caption}</figcaption> : null}
    </figure>
  )
}

export function Card({ content }: { content: CardContent }) {
  const high = pick(content.emphasis, EMPHASES) === 'high'
  return (
    <article className={`flex h-full flex-col overflow-hidden rounded-2xl border bg-raised ${high ? 'border-accent ring-2 ring-accent/30' : 'border-line'}`}>
      {content.media ? <Media blob={content.media} aspect="16:9" className="rounded-none" /> : null}
      <div className="flex flex-1 flex-col gap-3 p-6">
        <h3 className="text-xl font-semibold text-ink">{content.title}</h3>
        {text(content.summary) ? <p className="text-ink-muted">{content.summary}</p> : null}
        {content.action ? (
          <div className="mt-auto pt-2">
            <Action action={content.action} fallbackStyle="link" />
          </div>
        ) : null}
      </div>
    </article>
  )
}

export function Feature({ content }: { content: FeatureContent }) {
  return (
    <div className="flex gap-4">
      {text(content.icon) ? (
        <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-xl text-accent">
          {content.icon}
        </span>
      ) : null}
      <div>
        <h3 className="font-semibold text-ink">{content.title}</h3>
        {text(content.body) ? <p className="mt-1 text-ink-muted">{content.body}</p> : null}
      </div>
    </div>
  )
}

const TONE_CLASS: Record<Tone, string> = {
  info: 'border-info/40 bg-info-soft text-info',
  success: 'border-success/40 bg-success-soft text-success',
  warning: 'border-warning/40 bg-warning-soft text-warning',
  danger: 'border-danger/40 bg-danger-soft text-danger',
}

export function Banner({ content }: { content: BannerContent }) {
  const tone = pick(content.tone, TONES)
  return (
    <div role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'} className={`flex flex-wrap items-center justify-between gap-4 rounded-xl border px-5 py-4 ${TONE_CLASS[tone]}`}>
      <div className="font-medium">
        <RichText fragments={content.message} />
      </div>
      <Action action={content.action} fallbackStyle="link" />
    </div>
  )
}

export function Cta({ content }: { content: CtaContent }) {
  return (
    <div className="rounded-3xl bg-accent px-8 py-14 text-center text-accent-ink">
      <h2 className="text-3xl font-semibold tracking-tight">{content.heading}</h2>
      {text(content.body) ? <p className="mx-auto mt-4 max-w-xl opacity-90">{content.body}</p> : null}
      <Actions className="justify-center">
        {/* On the accent surface the actions invert, so they stay readable in both themes. */}
        <InvertedAction action={content.primaryAction} />
        <InvertedAction action={content.secondaryAction} outline />
      </Actions>
    </div>
  )
}

function InvertedAction({ action, outline = false }: { action: Inline; outline?: boolean }) {
  const label = text(action?.content.label)
  const href = hrefOf(action?.content.href)
  if (!label || !href) return null
  return (
    <a href={href} className={`inline-flex items-center rounded-full px-5 py-2.5 text-sm font-medium ${outline ? 'border border-current' : 'bg-accent-ink text-accent'}`}>
      {label}
    </a>
  )
}

function Actions({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mt-8 flex flex-wrap items-center gap-3 empty:hidden ${className}`}>{children}</div>
}
