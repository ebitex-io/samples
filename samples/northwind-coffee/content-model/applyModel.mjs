// ---------------------------------------------------------------------------------------------
// The engine behind apply.mjs: walks model.mjs in dependency order and upserts every piece.
//
//   contracts -> templates -> contracts again -> folders
//   -> site -> nodes (structure only) -> components -> node payloads
//
// The order is not arbitrary, and two parts of it are worth understanding.
//
// A Contract's `presentation` field names the Templates it will accept, and a Template names the
// Contracts it can render. They point at each other, so one has to be created first and completed
// second -- hence the second contracts pass.
//
// Experience nodes are created *before* components, but their payloads are set *after*. A node
// needs only a name and a slug to exist, so creating the tree early means a component that links
// to a page already knows that page's id, while a node's payload still gets a component that is
// fully written. Splitting a node's creation from its payload is what keeps both directions
// resolvable in a single pass each.
// ---------------------------------------------------------------------------------------------

import {
  BLOBS,
  CATEGORY_GROUPS,
  CONTRACTS,
  TEMPLATES,
  FOLDERS,
  COMPONENTS,
  SITE,
  NODES,
  STREAMS,
  L,
} from './model.mjs'
import { compact, presentation, reference, templateVersion } from './values.mjs'

/**
 * @param readAsset reads one file from `assets/images/` and returns its bytes. Supplied by the
 *   caller rather than read here, because this module has to run unchanged both from Node and
 *   from inside a browser, and only one of those has a filesystem.
 */
export async function applyModel(api, { log = console.log, readAsset } = {}) {
  const contracts = {}
  const templates = {}
  const components = {}
  const blobs = {}
  const categoryGroups = {}
  const categories = {}
  const nodes = {}
  const ctx = { contracts, templates, components, blobs, categoryGroups, categories, nodes }

  // ---- taxonomy ----
  // First, because a Category field's settings name the groups it accepts. Categories are keyed
  // here as `<group>/<key>` so the model can name one without carrying ids around.
  const existingGroups = new Map((await api.listCategoryGroups()).map((g) => [g.externalId, g]))
  for (const def of CATEGORY_GROUPS) {
    const group = existingGroups.get(def.externalId) ?? (await api.createCategoryGroup(def.externalId, def.name))
    categoryGroups[def.externalId] = group
    const existing = new Map((await api.listCategories(group.id)).map((c) => [c.key, c]))
    for (const cat of def.categories) {
      // A category's `value` is Localizable, like any other display text in the system -- so
      // translating a taxonomy is translating content, not a code change. This is an upsert rather
      // than create-only for exactly that reason: step 16 added French labels to categories that
      // already existed, and a create-only pass would have silently left them in English.
      const value = L(cat.value, cat.locales ?? {})
      const current = existing.get(cat.key)
      categories[`${def.externalId}/${cat.key}`] = current
        ? await api.updateCategory(current.id, {
            key: cat.key,
            value,
            isSelectable: true,
            metadata: null,
            parentCategoryId: null,
            rowVersion: current.rowVersion,
          })
        : await api.createCategory({
            categoryGroupId: group.id,
            parentCategoryId: null,
            key: cat.key,
            value,
            isSelectable: true,
            metadata: null,
          })
    }
    log(`category group ${def.externalId} (${def.categories.length} categories)`)
  }

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
      titleFieldPath: def.titleFieldPath ?? null,
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
    log(
      `contract ${def.externalId} -> v${detail.latestVersion?.versionNumber ?? '?'} (${existing ? 'updated' : 'created'})`,
    )
  }

  // ---- templates ----
  for (const def of TEMPLATES) {
    const supportedContractIds = def.supports.map((id) => contracts[id].id)
    const existing = templates[def.externalId]
    let detail
    if (existing) {
      const current = await api.getTemplate(existing.id)
      // A Template's settings are an ordinary Contract it points at, edited through the Contract
      // API like any other. Rewriting it here keeps this file authoritative about them.
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
  // Only for Contracts whose field settings name a Template. On a first run those Templates did not
  // exist yet, so the constraint was written empty; now it can be filled in. A no-op once the
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
      titleFieldPath: def.titleFieldPath ?? null,
      fields: wanted,
      rowVersion: current.rowVersion,
    })
    log(
      `contract ${def.externalId} -> v${contracts[def.externalId].latestVersion?.versionNumber} (template constraints applied)`,
    )
  }

  // ---- blobs ----
  // Uploaded before the components that point at them. The store is content-addressed, so a
  // re-run uploads the same bytes and gets the same id back: cheap, and idempotent for free.
  if (BLOBS.length > 0 && !readAsset) throw new Error('applyModel needs a readAsset function to upload blobs')
  for (const def of BLOBS) {
    blobs[def.externalId] = await api.uploadBlob(await readAsset(def.file), def.contentType)
    log(`blob ${def.externalId} uploaded`)
  }

  // ---- folders ----
  const folders = {}
  const existingFolders = await api.listFolders()
  for (const def of FOLDERS) {
    const parentId = def.parent ? folders[def.parent].id : null
    const existing = existingFolders.find((f) => f.name === def.name && f.parentFolderId === parentId)
    folders[def.name] = existing ?? (await api.createFolder(def.name, parentId))
  }

  // ---- site ----
  let site = (await api.listSites()).find((s) => s.name === SITE.name)
  if (!site) {
    site = await api.createSite(SITE.name)
    log(`site ${SITE.name} created`)
  }
  nodes[''] = site

  // ---- experience nodes: structure ----
  // `path` is slash-separated and creates whatever ancestors it needs. An ancestor no entry claims
  // is created as a plain structural node: real tree structure, no page of its own, and a 404 at
  // its own path until something is published there.
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

  // ---- experience nodes: payloads ----
  for (const def of NODES) {
    if (!def.template) continue
    const node = def.path === '' ? site : nodes[def.path]
    await api.setPresentationPayload(
      node.id,
      presentation(
        templates[def.template],
        reference(components[def.component], def.contextualValues),
        def.settings ?? {},
      ),
    )
    log(`node /${def.path} payload set`)
  }

  // ---- streams ----
  // Last, because a stream names the Contracts it draws from. It is configuration rather than
  // content: read live at delivery, never published, and so nothing below publishes it.
  const streams = {}
  const existingStreams = new Map((await api.listStreams()).map((s) => [s.externalId, s]))
  for (const def of STREAMS) {
    const input = {
      externalId: def.externalId,
      name: def.name,
      sourceContractIds: def.sources.map((id) => contracts[id].id),
      adapterId: null,
      orderByFieldPath: def.orderByFieldPath ?? null,
      orderDescending: def.orderDescending ?? false,
      resolveDepth: def.resolveDepth ?? 1,
      excludedComponentIds: [],
      declaredFilters: def.declaredFilters,
    }
    const existing = existingStreams.get(def.externalId)
    streams[def.externalId] = existing
      ? await api.updateStream(existing.id, { ...input, externalId: undefined })
      : await api.createStream(input)
    log(`stream ${def.externalId} (${existing ? 'updated' : 'created'})`)
  }

  return { contracts, templates, components, folders, site, nodes, streams }
}

function titleCase(slug) {
  return slug.replace(/(^|-)([a-z])/g, (_, sep, ch) => (sep ? ' ' : '') + ch.toUpperCase())
}

/**
 * Publishes every page in the site.
 *
 * One call per node rather than one for the whole site, because a node's publish closure is the
 * node plus whatever its own Presentation reaches -- Components, Templates, Adapters -- and
 * deliberately *not* its children. A page is published on its own terms; publishing the front page
 * does not silently publish a draft two levels down.
 *
 * Ancestors are taken care of: publishing `/coffees/ethiopia-guji` creates the address rows its
 * parents need, so a structural node like `/coffees` never has to be published by hand.
 */
export async function publishSite(api, applied, { log = console.log } = {}) {
  // Standalone Components -- the header and footer -- belong to no page, so nothing else's
  // closure reaches them. They are published as their own roots.
  for (const def of COMPONENTS) {
    if (!def.standalone) continue
    await publishRoot(api, 'component', applied.components[def.externalId].id, { log: () => {} })
    log(`published component ${def.externalId}`)
  }

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
