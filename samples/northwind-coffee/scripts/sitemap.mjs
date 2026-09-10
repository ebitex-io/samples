#!/usr/bin/env node
// ---------------------------------------------------------------------------------------------
// Writes dist/sitemap.xml after the build.
//
// This is the clearest example in the sample of where the SDK stops and you start. It ships
// `buildSitemapXml` -- a pure function that knows the things worth knowing: reciprocal hreflang
// sets, that percent-encoding and XML-escaping are two separate required steps, that 50,000 URLs
// is the limit. It does not ship a route, a handler or a CLI, because serving is hosting, and
// hosting is the one thing an SDK cannot know about. So the plumbing is thirty lines here, and it
// would be thirty different lines in a server-rendered app.
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
import { buildSitemapXml } from '@ebitex/content-sdk/sitemap'

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
const xml = buildSitemapXml(result, { origin })

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'sitemap.xml')
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, xml, 'utf8')
console.log(`sitemap: ${result.nodes.length} URLs written to dist/sitemap.xml`)
