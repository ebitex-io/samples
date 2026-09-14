#!/usr/bin/env node
// ---------------------------------------------------------------------------------------------
// Writes dist/sitemap.xml after the build.
//
// This is the clearest example in the sample of where the SDK stops and you start. It ships
// `buildSitemapDocuments` -- a pure function that knows the things worth knowing: reciprocal
// hreflang sets, that percent-encoding and XML-escaping are two separate required steps, and that a
// sitemap is capped at 50,000 URLs *and* 50 MB, so a site past either has to be split across an
// index plus shards. It does not ship a route, a handler or a CLI, because serving is hosting, and
// hosting is the one thing an SDK cannot know about. So the plumbing is thirty lines here, and it
// would be thirty different lines in a server-rendered app.
//
// Below the caps it returns exactly one document, byte-identical to what the older single-document
// `buildSitemapXml` produces -- so writing it this way costs nothing today and simply keeps working
// if this catalogue ever grows. Note the byte cap is the one that arrives first for a site with
// several locales, because every URL then carries the complete set of alternates (spec 699).
//
//   node scripts/sitemap.mjs
//
// Run automatically by `npm run build`.
//
// ---- On the key --------------------------------------------------------------------------
//
// This script reads CONTENT_DELIVERY_KEY, *not* VITE_CONTENT_DELIVERY_KEY, and that is the whole
// point of the difference. Vite inlines any variable named VITE_* into the browser bundle, so a
// deployed site's key is public by construction -- which is why it should be a browser-safe key,
// restricted to your own origins.
//
// A browser-safe key cannot be used from here. It is restricted by Origin, and Node sends no
// Origin header, so this request would be refused with `origin_denied`. A build step is a server,
// so it uses a server-side key, and that key must never acquire a VITE_ prefix.
// ---------------------------------------------------------------------------------------------

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createDeliveryClient } from '@ebitex/content-sdk'
import { buildSitemapDocuments } from '@ebitex/content-sdk/sitemap'

const apiKey = process.env.CONTENT_DELIVERY_KEY
const origin = process.env.SITE_ORIGIN
// Required here, unlike in the browser. The API works out which site you mean from the request's
// own hostname, and a build step has no hostname -- so it has to say. Find it in
// Content -> Configure -> Sites.
const site = process.env.CONTENT_SITE_ID

if (!apiKey || !origin || !site) {
  // Not an error. A reader running `npm run build` locally has none of these, and a sitemap is
  // not worth failing a build over -- but silence would be worse, so say what was skipped and why.
  console.log('sitemap: skipped (needs CONTENT_DELIVERY_KEY, CONTENT_SITE_ID and SITE_ORIGIN)')
  process.exit(0)
}

const client = createDeliveryClient({ apiKey, baseUrl: process.env.CONTENT_API_BASE_URL })
const result = await client.getSitemap({ site })

// Membership is already decided server-side: live pages with a real path, no redirects, no
// payload-less structural nodes. `exclude` is here for decisions about *this deployment* rather
// than about the content -- a staging-only section, say. Northwind has none, so it stays empty.
const documents = buildSitemapDocuments(result, { origin })

// Every document is written at exactly the path it carries. For a shard that is not advisory: it is
// the path the index wrote into its own <loc>, so putting it anywhere else produces an index full
// of 404s that nothing local would catch.
const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
for (const document of documents) {
  const out = join(dist, document.path)
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, document.xml, 'utf8')
}

const written = documents.map((document) => document.path).join(', ')
console.log(`sitemap: ${result.nodes.length} URLs written to ${written}`)
