// ---------------------------------------------------------------------------------------------
// The engine behind apply.mjs: walks model.mjs in dependency order and upserts every piece.
//
//   contracts -> templates -> (contracts again, for template constraints)
//   -> taxonomy -> folders -> blobs -> components -> site -> nodes -> streams
//
// The order is not arbitrary. A Contract's `presentation` field names the Templates it will
// accept, and a Template names the Contracts it can render, so the two reference each other and
// one of them has to be created first and completed second. That second pass is the only subtle
// thing in this file.
// ---------------------------------------------------------------------------------------------

import { CONTRACTS, TEMPLATES, FOLDERS, COMPONENTS, SITE, NODES, L } from './model.mjs'

/**
 * Drops `null`/`undefined` keys. An optional field is *absent* from a stored document, never
 * `null` -- a component/link/presentation value's compiled schema rejects `null` outright.
 */
export function compact(document) {
  return Object.fromEntries(
    Object.entries(document).filter(([, value]) => value !== null && value !== undefined),
  )
}

export function inline(contract, document) {
  return {
    mode: 'inline',
    contract: contract.id,
    contractVersion: contract.latestVersion.versionNumber,
    document: compact(document),
  }
}

export function reference(component) {
  return { mode: 'reference', provider: 'core', key: component.id }
}

export function templateVersion(template) {
  return template.latestVersionNumber ?? template.latestVersion?.versionNumber
}

export function presentation(template, component, settings = {}) {
  return { template: template.id, templateVersion: templateVersion(template), component, settings }
}

export async function applyModel(api, { log = console.log } = {}) {
  const contracts = {}
  const templates = {}
  const components = {}
  const nodes = {}
  const ctx = { contracts, templates, components }

  // Templates that already exist (this is a re-run) let the contracts name them on the first pass,
  // so the second pass below has nothing to do.
  for (const t of await api.listTemplates()) templates[t.externalId] = t

  // ---- contracts ----
  const existingContracts = new Map((await api.listContracts()).map((c) => [c.externalId, c]))
  for (const def of CONTRACTS) {
    const input = {
      name: def.name,
      externalId: def.externalId,
      parentContractId: def.parent ? contracts[def.parent].id : null,
      isAbstract: def.isAbstract ?? false,
      fields: def.fields(ctx),
    }
    const existing = existingContracts.get(def.externalId)
    const detail = existing
      ? await api.updateContract(existing.id, {
          ...input,
          rowVersion: (await api.getContract(existing.id)).rowVersion,
        })
      : await api.createContract(input)
    contracts[def.externalId] = detail
    log(`contract ${def.externalId} -> v${detail.latestVersion?.versionNumber ?? '?'} (${existing ? 'updated' : 'created'})`)
  }

  // ---- templates ----
  for (const def of TEMPLATES) {
    const supportedContractIds = def.supports.map((id) => contracts[id].id)
    const existing = templates[def.externalId]
    let detail
    if (existing) {
      const current = await api.getTemplate(existing.id)
      // A Template's settings are an ordinary Contract it points at, edited through the Contract
      // API like any other (spec 301). Rewriting it here keeps the model file authoritative.
      const settingsContract = await api.getContract(current.settingsContractId)
      await api.updateContract(settingsContract.id, {
        name: settingsContract.name,
        externalId: settingsContract.externalId,
        parentContractId: settingsContract.parentContractId,
        isAbstract: settingsContract.isAbstract,
        fields: def.settings,
        rowVersion: settingsContract.rowVersion,
      })
      await api.updateTemplate(existing.id, {
        name: def.name,
        externalId: def.externalId,
        supportedContractIds,
        rowVersion: current.rowVersion,
      })
      detail = await api.getTemplate(existing.id) // the settings write may have cut a new version
    } else {
      detail = await api.createTemplate({
        name: def.name,
        externalId: def.externalId,
        supportedContractIds,
        settingsFields: def.settings,
      })
    }
    templates[def.externalId] = detail
    log(`template ${def.externalId} -> v${templateVersion(detail)} (${existing ? 'updated' : 'created'})`)
  }

  // ---- contracts, second pass ----
  // Only for Contracts whose field settings name a Template. On a first run those Templates did
  // not exist yet, so the constraint was written empty; now it can be filled in. A no-op once the
  // constraint is already correct, which is what keeps a re-run from churning versions.
  for (const def of CONTRACTS) {
    if (!def.namesTemplates) continue
    const current = await api.getContract(contracts[def.externalId].id)
    const wanted = def.fields(ctx)
    const currentSettings = JSON.stringify(current.fields.map((f) => [f.externalId, f.settings]))
    const wantedSettings = JSON.stringify(wanted.map((f) => [f.externalId, f.settings]))
    if (currentSettings === wantedSettings) continue
    contracts[def.externalId] = await api.updateContract(current.id, {
      name: def.name,
      externalId: def.externalId,
      parentContractId: current.parentContractId,
      isAbstract: current.isAbstract,
      fields: wanted,
      rowVersion: current.rowVersion,
    })
    log(`contract ${def.externalId} -> v${contracts[def.externalId].latestVersion?.versionNumber} (template constraints applied)`)
  }

  // ---- folders ----
  const folders = {}
  const existingFolders = await api.listFolders()
  for (const def of FOLDERS) {
    const parentId = def.parent ? folders[def.parent].id : null
    const existing = existingFolders.find((f) => f.name === def.name && f.parentFolderId === parentId)
    folders[def.name] = existing ?? (await api.createFolder(def.name, parentId))
  }

  // ---- components ----
  for (const def of COMPONENTS) {
    const existing = (await api.findComponents(def.externalId)).find(
      (c) => c.externalId === def.externalId,
    )
    const document = compact(def.document(ctx))
    const folderId = folders[def.folder].id
    let detail
    if (existing) {
      const current = await api.getComponent(existing.id)
      detail = await api.updateComponent(existing.id, {
        name: def.name,
        document,
        folderId,
        repinToLatest: true,
        rowVersion: current.rowVersion,
      })
    } else {
      detail = await api.createComponent({
        name: def.name,
        externalId: def.externalId,
        contractId: contracts[def.contract].id,
        folderId,
        document,
      })
    }
    components[def.externalId] = detail
    const invalid =
      detail.validatesAgainstLatest === false
        ? ` -- INVALID: ${JSON.stringify(detail.latestValidationErrors)}`
        : ''
    log(`component ${def.externalId} (${existing ? 'updated' : 'created'})${invalid}`)
  }

  // ---- site ----
  let site = (await api.listSites()).find((s) => s.name === SITE.name)
  if (!site) {
    site = await api.createSite(SITE.name)
    log(`site ${SITE.name} created`)
  }
  nodes[''] = site

  // ---- experience nodes ----
  // `path` is slash-separated and creates whatever ancestors it needs. An ancestor that no node
  // claims is created as a plain structural node: real tree structure, no page of its own, and
  // 404 at its own path until something is published there.
  for (const def of [...NODES].sort((a, b) => a.path.localeCompare(b.path))) {
    const segments = def.path.split('/').filter(Boolean)
    let parent = site
    let walked = ''
    for (let i = 0; i < segments.length; i++) {
      const slug = segments[i]
      walked = walked ? `${walked}/${slug}` : slug
      if (nodes[walked]) {
        parent = nodes[walked]
        continue
      }
      const children = await api.listChildren(parent.id)
      let node = children.find((n) => n.slug?.default === slug)
      if (!node) {
        const isLeaf = i === segments.length - 1
        node = await api.createNode(parent.id, isLeaf ? def.name : titleCase(slug), L(slug))
        log(`node /${walked} created`)
      }
      nodes[walked] = node
      parent = node
    }
  }

  // Payloads last, so every node exists before anything points at one.
  for (const def of NODES) {
    if (!def.template) continue
    const node = def.path === '' ? site : nodes[def.path]
    await api.setPresentationPayload(
      node.id,
      presentation(templates[def.template], reference(components[def.component]), def.settings ?? {}),
    )
    log(`node /${def.path} payload set`)
  }

  return { contracts, templates, components, folders, site, nodes }
}

function titleCase(slug) {
  return slug.replace(/(^|-)([a-z])/g, (_, sep, ch) => (sep ? ' ' : '') + ch.toUpperCase())
}

/**
 * Publishes every page in the site.
 *
 * One call per node rather than one call for the whole site, because a node's publish closure is
 * the node plus whatever its own Presentation reaches -- Components, Templates, Adapters -- and
 * deliberately *not* its children. A page is published on its own terms; publishing the front
 * page does not silently publish a draft two levels down.
 *
 * Ancestors are taken care of: publishing `/coffees/ethiopia-guji` creates the address rows its
 * parents need, so a structural node like `/coffees` never has to be published by hand.
 */
export async function publishSite(api, applied, { log = console.log } = {}) {
  for (const def of NODES) {
    if (!def.template) continue
    const node = def.path === '' ? applied.site : applied.nodes[def.path]
    await publishRoot(api, 'node', node.id, { log: () => {} })
    log(`published /${def.path}`)
  }
}

/** Publishes one root and its whole dependency closure at every item's head version. */
export async function publishRoot(api, kind, id, { log = console.log } = {}) {
  const plan = await api.planPublish(kind, id)
  const blocked = plan.items.filter((i) => !i.validAgainstOwnPin || i.workflowPublishBlocked)
  if (blocked.length > 0) {
    throw new Error(
      `publish blocked: ${blocked.map((i) => `${i.kind} ${i.name}: ${JSON.stringify(i.ownPinErrors)}`).join('; ')}`,
    )
  }
  const result = await api.publish(
    plan.items.map((i) => ({ kind: i.kind, id: i.id, versionNumber: i.headVersionNumber, include: true })),
  )
  log(`published ${result.items.length} items`)
  return result
}
