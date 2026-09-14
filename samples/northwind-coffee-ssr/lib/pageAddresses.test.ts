import { describe, expect, it } from 'vitest'
import type { NavigationNode, NavigationResult } from '@ebitex/content-sdk'

import { toPageAddresses } from './pageAddresses'

const ROOT = 'root-id'
const COFFEES = 'coffees-id'

function node(nodeId: string, depth: number, path: string | null): NavigationNode {
  return {
    nodeId,
    parentNodeId: depth === 0 ? null : ROOT,
    depth,
    path,
    slug: depth === 0 ? null : 'x',
    title: nodeId,
    titleSource: 'name',
    kind: 'presentation',
  }
}

function answer(localeSlot: string, anchorNodeId: string, nodes: NavigationNode[]): NavigationResult {
  return { site: { rootNodeId: ROOT, name: 'Northwind' }, localeSlot, anchorNodeId, nodes }
}

const COFFEES_IN_BOTH = [
  { code: 'en', label: 'English', result: answer('default', COFFEES, [node(ROOT, 0, '/'), node(COFFEES, 1, '/coffees')]) },
  { code: 'fr', label: 'Français', result: answer('fr', COFFEES, [node(ROOT, 0, '/fr'), node(COFFEES, 1, '/fr/cafes')]) },
]

/**
 * The switcher's links are the server's paths, verbatim. The property that matters is that nothing
 * here composes one -- `/fr/cafes` arrives as `/fr/cafes`, and a French address is never rebuilt
 * from the English one (which, for a page with a French slug, would be a 404).
 */
describe('toPageAddresses', () => {
  it('links each locale to the page itself, as the server addressed it', () => {
    expect(toPageAddresses('en', COFFEES_IN_BOTH).alternates).toEqual([
      { code: 'en', label: 'English', href: '/coffees' },
      { code: 'fr', label: 'Français', href: '/fr/cafes' },
    ])
  })

  it('takes the front page from the current locale', () => {
    expect(toPageAddresses('en', COFFEES_IN_BOTH).home).toBe('/')
    expect(toPageAddresses('fr', COFFEES_IN_BOTH).home).toBe('/fr')
  })

  it('falls back to that locale’s front page when the page has no path in it', () => {
    const addresses = toPageAddresses('en', [
      { code: 'fr', label: 'Français', result: answer('fr', COFFEES, [node(ROOT, 0, '/fr'), node(COFFEES, 1, null)]) },
    ])

    expect(addresses.alternates).toEqual([{ code: 'fr', label: 'Français', href: '/fr' }])
  })

  it('drops a locale that could not be read rather than guessing its address', () => {
    const addresses = toPageAddresses('en', [
      { code: 'en', label: 'English', result: answer('default', ROOT, [node(ROOT, 0, '/')]) },
      { code: 'fr', label: 'Français', result: undefined },
    ])

    expect(addresses.alternates).toEqual([{ code: 'en', label: 'English', href: '/' }])
  })

  it('keeps a working home link when nothing could be read at all', () => {
    expect(toPageAddresses('fr', [{ code: 'fr', label: 'Français', result: undefined }])).toEqual({
      home: '/',
      alternates: [],
    })
  })
})
