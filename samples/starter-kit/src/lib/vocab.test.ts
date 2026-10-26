import { describe, expect, it } from 'vitest'

import { keyOf, pick, pickOptional, THEMES, WIDTHS } from '@/lib/vocab'

// The shape is the Delivery API's own: `path` carries the group and the key (`ebitex-width/wide`), as the captured fixture shows.
const descriptor = (path: string, resolved = true) => ({ key: 'guid', kind: 'category', provider: 'core', groupExternalId: path.split('/')[0], path, value: 'Wide', resolved })

describe('the kit vocabulary', () => {
  it('reads the key of a delivered category descriptor, not its group or its display value', () => {
    expect(keyOf(descriptor('ebitex-width/wide'))).toBe('wide')
    expect(keyOf(descriptor('ebitex-layout/split-reverse'))).toBe('split-reverse')
  })

  it('reads a bare string, and nothing from an empty, missing or unresolved value', () => {
    expect(keyOf('narrow')).toBe('narrow')
    expect(keyOf('')).toBeUndefined()
    expect(keyOf(undefined)).toBeUndefined()
    expect(keyOf(descriptor('ebitex-width/wide', false))).toBeUndefined()
    expect(keyOf({ kind: 'category' })).toBeUndefined()
  })

  it('falls back to the first (default) word for an unknown key, and to nothing for an override', () => {
    expect(pick(descriptor('ebitex-width/wide'), WIDTHS)).toBe('wide')
    expect(pick(descriptor('ebitex-width/gigantic'), WIDTHS)).toBe('standard')
    expect(pick(undefined, THEMES)).toBe('default')
    expect(pickOptional(descriptor('ebitex-appearance/neon'), ['muted'] as const)).toBeUndefined()
    expect(pickOptional(undefined, ['muted'] as const)).toBeUndefined()
  })
})
