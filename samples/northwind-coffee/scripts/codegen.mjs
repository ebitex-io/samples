#!/usr/bin/env node
// ---------------------------------------------------------------------------------------------
// Regenerates src/types/content.d.ts from the delivered schemas.
//
//   npm run codegen
//
// Until step 14 this project carried a hand-written types module: one interface per Contract,
// kept true by hand. It worked, and it was quietly wrong the whole time -- rename a field in the
// CMS and TypeScript happily keeps compiling against the old name, because nothing connects the
// two. Ten steps of that is enough to feel the problem, which is the point of having felt it.
//
// The Delivery API answers `GET /content/delivery/v1/schemas` with a JSON Schema bundle for every
// published Contract, and `content-sdk-codegen` (which ships in @ebitex/content-sdk) turns that
// into TypeScript. So the types are derived from the same thing the API actually serves, rather
// than from a second description of it that has to be maintained in parallel.
//
// ---- On the key ------------------------------------------------------------------------------
//
// CONTENT_DELIVERY_KEY, not VITE_CONTENT_DELIVERY_KEY -- the same distinction scripts/sitemap.mjs
// makes, for the same reason. This runs in a terminal, not a browser, so it uses a server-side
// key; and a browser-safe key would be refused anyway, since it is restricted by Origin and Node
// sends no Origin header.
//
// This one reads .env itself, where sitemap.mjs does not: a build step runs on a host that sets
// its own environment, and this runs on your laptop where .env is where your key already is.
// ---------------------------------------------------------------------------------------------

import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// Node 20.12+. Optional-called so an older 20.x still runs with the variables exported by hand.
const envFile = join(root, '.env')
if (existsSync(envFile)) process.loadEnvFile?.(envFile)

const apiKey = process.env.CONTENT_DELIVERY_KEY
if (!apiKey) {
  console.error(
    'codegen: set CONTENT_DELIVERY_KEY (a server-side delivery key -- see .env.example) and try again.',
  )
  process.exit(1)
}

const out = join(root, 'src', 'types', 'content.d.ts')
const cli = join(root, 'node_modules', '@ebitex', 'content-sdk', 'dist', 'cli', 'main.js')
const args = ['--key', apiKey, '--out', out]
if (process.env.CONTENT_API_BASE_URL) args.push('--url', process.env.CONTENT_API_BASE_URL)

const result = spawnSync(process.execPath, [cli, ...args], { stdio: 'inherit' })
process.exit(result.status ?? 1)
