/**
 * The kit's vocabulary, as this renderer reads it.
 *
 * The kit's Contracts store *what* a section says. *How* it is shown (layout, width, background, appearance, tone, ...) is chosen
 * where the section is placed, so one Component can be reused in many places with different settings. Each of those choices is a
 * **category** from one of the kit's groups, so an organization can rename or add to them. The Delivery API hands a renderer a category
 * as a descriptor (`{ kind: 'category', path, value, groupExternalId, ... }`) and nothing more: the *key* in `path` is what this
 * renderer maps to its own tokens and classes, and the display `value` is for people. A key it does not know falls back to the
 * default and never breaks the page. Another renderer may read the same content with its own mapping.
 */

export const THEMES = ['default', 'dark', 'brand'] as const
export const APPEARANCES = ['muted', 'inverted', 'brand', 'highlight'] as const
export const LAYOUTS = ['stacked', 'split', 'split-reverse', 'centered'] as const
export const WIDTHS = ['standard', 'narrow', 'wide', 'full'] as const
export const BACKGROUNDS = ['none', 'muted', 'contrast', 'brand'] as const
export const ASPECTS = ['auto', 'square', 'landscape', 'portrait', 'wide'] as const
export const EMPHASES = ['default', 'featured', 'quiet'] as const
export const TONES = ['info', 'success', 'warning', 'critical'] as const
export const ACTION_STYLES = ['primary', 'secondary', 'link'] as const

export type Theme = (typeof THEMES)[number]
export type Appearance = (typeof APPEARANCES)[number]
export type Layout = (typeof LAYOUTS)[number]
export type Width = (typeof WIDTHS)[number]
export type Background = (typeof BACKGROUNDS)[number]
export type Aspect = (typeof ASPECTS)[number]
export type Emphasis = (typeof EMPHASES)[number]
export type Tone = (typeof TONES)[number]
export type ActionStyle = (typeof ACTION_STYLES)[number]

/**
 * The key a category value names, or `undefined` when there is none. Reads a delivered descriptor (`path`, the key inside its group)
 * and also a bare string, so a test or a hand-written page can say `'split'`.
 */
export function keyOf(value: unknown): string | undefined {
  if (typeof value === 'string') return value.trim() === '' ? undefined : value
  if (value && typeof value === 'object') {
    const descriptor = value as { path?: unknown; resolved?: unknown }
    if (descriptor.resolved === false) return undefined
    if (typeof descriptor.path === 'string' && descriptor.path !== '') return descriptor.path.split('/').pop()
  }
  return undefined
}

/** Narrows a category value to one of the known keys, or the first as the default. */
export function pick<T extends string>(value: unknown, allowed: readonly T[]): T {
  const key = keyOf(value)
  return key !== undefined && (allowed as readonly string[]).includes(key) ? (key as T) : allowed[0]
}

/** Like {@link pick} but `undefined` when nothing (or nothing known) was chosen: for an override, where empty means "inherit". */
export function pickOptional<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  const key = keyOf(value)
  return key !== undefined && (allowed as readonly string[]).includes(key) ? (key as T) : undefined
}

export const WIDTH_CLASS: Record<Width, string> = {
  narrow: 'max-w-2xl',
  standard: 'max-w-4xl',
  wide: 'max-w-6xl',
  full: 'max-w-none',
}

export const ASPECT_CLASS: Record<Aspect, string> = {
  auto: '',
  square: 'aspect-square',
  landscape: 'aspect-[4/3]',
  portrait: 'aspect-[3/4]',
  wide: 'aspect-video',
}

/** A whole number from an authored value, within bounds, or the fallback. */
export function whole(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === 'number' && Number.isInteger(value) ? Math.min(max, Math.max(min, value)) : fallback
}

export function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined
}
