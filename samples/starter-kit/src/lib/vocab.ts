/**
 * The kit's contextual vocabulary.
 *
 * The kit's Contracts store *what* a section says. *How* it is shown (layout, width, background,
 * tone, ...) is supplied by whatever references the Component, so one Component can be reused in
 * many places with different settings. The kit declares those fields as free text, so the words
 * below are this renderer's convention, not something the CMS enforces: a value this renderer does
 * not know falls back to the default and never breaks the page. Another renderer may read the same
 * content with its own vocabulary.
 */

export type Width = 'narrow' | 'default' | 'wide' | 'full'
export type Background = 'default' | 'muted' | 'accent'
export type Tone = 'info' | 'success' | 'warning' | 'danger'
export type Emphasis = 'default' | 'high'
export type ActionStyle = 'primary' | 'secondary' | 'link'

/** Narrows an authored string to one of the known words, or the first as the default. */
export function pick<T extends string>(value: unknown, allowed: readonly T[]): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : allowed[0]
}

export const WIDTHS = ['default', 'narrow', 'wide', 'full'] as const satisfies readonly Width[]
export const BACKGROUNDS = ['default', 'muted', 'accent'] as const satisfies readonly Background[]
export const TONES = ['info', 'success', 'warning', 'danger'] as const satisfies readonly Tone[]
export const EMPHASES = ['default', 'high'] as const satisfies readonly Emphasis[]
export const ACTION_STYLES = ['primary', 'secondary', 'link'] as const satisfies readonly ActionStyle[]

export const WIDTH_CLASS: Record<Width, string> = {
  narrow: 'max-w-2xl',
  default: 'max-w-4xl',
  wide: 'max-w-6xl',
  full: 'max-w-none',
}

/** A whole number from an authored value, within bounds, or the fallback. */
export function whole(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === 'number' && Number.isInteger(value) ? Math.min(max, Math.max(min, value)) : fallback
}

export function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined
}
