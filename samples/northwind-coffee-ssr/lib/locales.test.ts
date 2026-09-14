import { describe, expect, it } from 'vitest'
import { DEFAULT_LOCALE, localePath, splitLocale } from './locales'

/**
 * The whole prefix scheme is these two functions, so they are worth testing directly: every link on
 * the site and every resolve goes through one of them, and the failure mode of getting either wrong
 * is a reader silently dropped back into English rather than anything that reports itself.
 */
describe('splitLocale', () => {
  it('reads a supported locale prefix and hands back the path the CMS should be asked for', () => {
    expect(splitLocale('/fr/guides')).toEqual({ locale: 'fr', path: '/guides' })
    expect(splitLocale('/fr')).toEqual({ locale: 'fr', path: '/' })
  })

  it('treats an unprefixed path as the default locale', () => {
    expect(splitLocale('/guides')).toEqual({ locale: DEFAULT_LOCALE, path: '/guides' })
    expect(splitLocale('/')).toEqual({ locale: DEFAULT_LOCALE, path: '/' })
  })

  it('does not read the default locale as a prefix', () => {
    // `/en/guides` is not an address this site serves. Treating it as one would give every page two
    // URLs, which is the thing the scheme exists to avoid.
    expect(splitLocale('/en/guides')).toEqual({ locale: DEFAULT_LOCALE, path: '/en/guides' })
  })

  it('leaves a first segment that merely looks like a locale alone', () => {
    // A page could legitimately be called /french or /fringe. Only an exact match is a prefix.
    expect(splitLocale('/french/press')).toEqual({ locale: DEFAULT_LOCALE, path: '/french/press' })
  })
})

describe('localePath', () => {
  it('prefixes a non-default locale and leaves the default alone', () => {
    expect(localePath('/guides', 'fr')).toBe('/fr/guides')
    expect(localePath('/guides', 'en')).toBe('/guides')
  })

  it('gives the front page a bare prefix rather than a trailing slash', () => {
    expect(localePath('/', 'fr')).toBe('/fr')
    expect(localePath('/', 'en')).toBe('/')
  })

  it('round-trips with splitLocale for every locale', () => {
    // The property that matters: the two are inverses, so a link built by one is read correctly by
    // the other. Asserted rather than assumed, because they are edited in different tasks.
    for (const locale of ['en', 'fr'] as const) {
      for (const path of ['/', '/guides', '/coffees/ethiopia-guji']) {
        expect(splitLocale(localePath(path, locale))).toEqual({ locale, path })
      }
    }
  })
})
