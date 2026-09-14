/**
 * Where sitemap shards live, defined once.
 *
 * Three places have to agree: `buildSitemapDocuments` is told the shard paths to write into the
 * index, `middleware.ts` recognises those paths to route them, and `app/sitemap.xml/route.ts` reads
 * back which shard was asked for. Three copies of the same pattern is exactly the kind that drifts,
 * and the failure would be an index advertising URLs the app does not serve — visible only to a
 * crawler, which does not tell you.
 *
 * They are at the **root** because a sitemap may only contain URLs at or below its own location: a
 * shard served from `/sitemaps/1.xml` could not list `/about`.
 */

/** `/sitemap-1.xml`, `/sitemap-2.xml`, … 1-based, matching what `buildSitemapDocuments` expects. */
export function shardPath(index: number): string {
  return `/sitemap-${index}.xml`
}

const SHARD_PATH = /^\/sitemap-(\d+)\.xml$/

/** The shard a path names, or `null` if it names none. */
export function shardFromPath(pathname: string): string | null {
  return SHARD_PATH.exec(pathname)?.[1] ?? null
}
