#!/usr/bin/env node
// Builds seed/starter-kit-demo.bundle.json: the demo page, ready to import into an organization that
// has opted in to the ebitex starter kit.
//
//   node content/build-demo.mjs
//
// The bundle names the kit's Contracts and Templates so the page's references resolve, and marks each
// of them with the kit's realm key. On import, an item carrying that key is mapped onto the kit's own
// row by external id and is never written, so importing the demo never copies the kit into your
// realm. `content/kit.bundle.json` is the kit as ebitex ships it; refresh it when the kit changes.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compileModel, decompileBundle } from '@ebitex/content-sdk/model'

import { components, contracts, homePage, nodes } from './demo.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const KIT_REALM_KEY = 'platform-starter'

const kit = JSON.parse(readFileSync(join(here, 'kit.bundle.json'), 'utf8'))
const kitContracts = new Set(kit.items.contracts.map((c) => c.externalId))
const kitTemplates = new Set(kit.items.templates.map((t) => t.externalId))

const kitModel = decompileBundle(kit)
const model = {
  ...kitModel,
  contracts: [...(kitModel.contracts ?? []), ...contracts],
  components: [...components, homePage],
  nodes,
}

const bundle = compileModel(model, { exportedAtUtc: '2026-01-01T00:00:00.000Z' })

for (const contract of bundle.items.contracts) {
  if (kitContracts.has(contract.externalId)) contract.realmKey = KIT_REALM_KEY
}
for (const template of bundle.items.templates) {
  if (kitTemplates.has(template.externalId)) template.realmKey = KIT_REALM_KEY
}

const target = join(here, '..', 'seed', 'starter-kit-demo.bundle.json')
mkdirSync(dirname(target), { recursive: true })
writeFileSync(target, JSON.stringify(bundle, null, 2) + '\n')
console.log(`wrote ${target}: ${bundle.items.components.length} components, ${bundle.items.nodes.length} node(s), ${kitContracts.size} kit Contracts and ${kitTemplates.size} Templates referenced.`)
