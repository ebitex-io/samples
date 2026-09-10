#!/usr/bin/env node
// ---------------------------------------------------------------------------------------------
// INTERNAL TOOLING -- see api.mjs. The tutorial never asks you to run this; import a bundle from
// `seed/` instead. It is here because reading it, and diffing it between step tags, is the
// clearest view of a whole content model there is.
//
//   node content-model/apply.mjs \
//     --base https://api.ebitex.io \
//     --cookie-file ./session-cookie.txt \      # the Cookie header of a signed-in Content session
//     [--environment <authoring environment id>] \
//     [--delivery-environment <delivery environment id>] \
//     [--skip-publish] [--verbose]
//
// Every step is an upsert keyed on external id (or on name, for folders and the site), so running
// it twice is safe: the second run reports updates and changes nothing.
// ---------------------------------------------------------------------------------------------

import { readFileSync } from 'node:fs'
import { createContentApi } from './api.mjs'
import { applyModel, publishSite } from './applyModel.mjs'

function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith('--')) continue
    const key = arg.slice(2)
    const next = argv[i + 1]
    if (next === undefined || next.startsWith('--')) args[key] = true
    else {
      args[key] = next
      i++
    }
  }
  return args
}

const args = parseArgs(process.argv.slice(2))
if (!args.base || !(args.cookie || args['cookie-file'])) {
  console.error(
    'usage: apply.mjs --base <api url> (--cookie <header> | --cookie-file <path>) [--environment <id>] [--delivery-environment <id>] [--skip-publish] [--verbose]',
  )
  process.exit(2)
}

const cookie = args.cookie ?? readFileSync(args['cookie-file'], 'utf8').trim()
const api = createContentApi({
  baseUrl: args.base,
  cookie,
  environmentId: args.environment,
  deliveryEnvironmentId: args['delivery-environment'],
  log: args.verbose ? (line) => console.error(`  ${line}`) : undefined,
})

const applied = await applyModel(api)

if (!args['skip-publish']) {
  await publishSite(api, applied)
}

console.log(
  `\ndone: ${Object.keys(applied.contracts).length} contracts, ${Object.keys(applied.templates).length} templates, ${Object.keys(applied.components).length} components, ${Object.keys(applied.nodes).length} nodes`,
)
