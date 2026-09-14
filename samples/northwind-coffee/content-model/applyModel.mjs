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
  ADAPTERS,
  AUDIENCES,
  BLOBS,
  ENVIRONMENTS,
  CATEGORY_GROUPS,
  CONTRACTS,
  TEMPLATES,
  FOLDERS,
  COMPONENTS,
  SITE,
  NODES,
  STREAMS,
  WORKFLOWS,
  L,
} from './model.mjs'
import { compact, presentation, reference, templateVersion } from './values.mjs'

/**
 * @param readAsset reads one file from `assets/images/` and returns its bytes. Supplied by the
 *   caller rather than read here, because this module has to run unchanged both from Node and
 *   from inside a browser, and only one of those has a filesystem.
 */
export async function applyModel(api, { log = console.log, readAsset } = {}) {
  const adapters = {}
  const audiences = {}
  const contracts = {}
  const templates = {}
  const components = {}
  const blobs = {}
  const categoryGroups = {}
  const categories = {}
  const nodes = {}
  const ctx = { adapters, audiences, contracts, templates, components, blobs, categoryGroups, categories, nodes }

  // ---- audiences ----
  // Before anything that references one. An Audience is configuration, not content: it is never
  // published, and its rule is read live at delivery -- so this is a plain upsert with no version
  // to pin and no snapshot to freeze.
  const existingAudiences = new Map((await api.listAudiences()).map((a) => [a.externalId, a]))
  for (const def of AUDIENCES) {
    const current = existingAudiences.get(def.externalId)
    audiences[def.externalId] = current
      ? await api.updateAudience(current.id, { name: def.name, predicate: def.predicate })
      : await api.createAudience({ externalId: def.externalId, name: def.name, predicate: def.predicate })
    log(`audience ${def.externalId} (${current ? 'updated' : 'created'})`)
  }

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

  // ---- adapters ----
  // After the Contracts they map between, and before the Components that bind through them.
  // Configuration, like an Audience -- but unlike one, an Adapter's rules are **frozen into the
  // snapshot at publish**, because a mapping determines the delivered *shape* rather than a value
  // read at request time. Editing one does not change already-published pages until they are
  // republished.
  const existingAdapters = new Map((await api.listAdapters()).map((a) => [a.externalId, a]))
  for (const def of ADAPTERS) {
    const input = {
      name: def.name,
      inputContractId: contracts[def.input].id,
      outputContractId: contracts[def.output].id,
      rules: def.rules,
    }
    const current = existingAdapters.get(def.externalId)
    adapters[def.externalId] = current
      ? await api.updateAdapter(current.id, { ...input, rowVersion: (await api.getAdapter(current.id)).rowVersion })
      : await api.createAdapter({ externalId: def.externalId, ...input })
    log(`adapter ${def.externalId} (${current ? 'updated' : 'created'})`)
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

  // ---- workflow ----
  // Definitions are keyed by name (they carry no external id), and assignment is per folder. Both
  // are configuration rather than content: nothing here is versioned, published or promoted, and a
  // re-run simply re-states the same shape.
  const workflows = {}
  const existingWorkflows = new Map((await api.listWorkflowDefinitions()).map((w) => [w.name, w]))
  for (const def of WORKFLOWS) {
    const input = { name: def.name, kind: def.kind, states: def.states, transitions: def.transitions }
    const current = existingWorkflows.get(def.name)
    workflows[def.name] = current
      ? await api.updateWorkflowDefinition(current.id, input)
      : await api.createWorkflowDefinition(input)
    await api.setFolderWorkflow(folders[def.folder].id, {
      mode: 'assigned',
      workflowDefinitionId: workflows[def.name].id,
      kind: def.kind,
    })
    log(`workflow ${def.name} -> folder ${def.folder} (${current ? 'updated' : 'created'})`)
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
      const isLeaf = i === segments.length - 1
      // Only the entry's own final segment carries its localized slugs -- an ancestor this entry
      // merely passes through belongs to whichever entry names it, or to nobody.
      const locales = isLeaf ? def.slugLocales : undefined
      const children = await api.listChildren(parent.id)
      let node = children.find((n) => n.slug?.default === slug)
      if (!node) {
        node = await api.createNode(parent.id, isLeaf ? def.name : titleCase(slug), L(slug, locales))
        log(`node /${walked} created`)
      } else if (locales && !sameLocales(node.slug?.locales, locales)) {
        // Re-applying the model has to be able to *add* a localized slug to a node that already
        // exists, or a slug declared after the first run never lands. Compared first so an
        // unchanged run stays a true no-op rather than a version bump on every node every time.
        node = await api.updateNode(node.id, node.name ?? def.name, L(slug, locales))
        log(`node /${walked} localized slug set`)
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

  // ---- workflow runs ----
  //
  // Content in a governed folder cannot be published until it reaches a publishable state, so this
  // walks each governed Component through its review. **This is the one part of this script that
  // stands in for a person.** In real use somebody reads the copy and clicks Send for review, then
  // somebody else clicks Approve; the buttons are in the Component editor. It is here only so that
  // running this script leaves a site that can actually be published.
  //
  // It is also why the loop is written as "take whatever transition is available until publishable"
  // rather than naming the two transitions: a script that hard-codes a route through a workflow is
  // a script that breaks the moment someone adds a step, which is the sort of thing workflows exist
  // to let people do.
  for (const def of COMPONENTS) {
    if (!def.workflow) continue
    const id = components[def.externalId].id
    let status = await api.getWorkflowStatus('component', id)

    // Publishing completes a run, so a Component published on the previous pass has no active run
    // and is editable again -- which is what made the update above legal, and what makes this
    // start a fresh review each time rather than trip over the last one.
    for (let step = 0; step < 10 && !status.isPublishable; step++) {
      const next = status.availableTransitions.find((t) => t.allowed)
      if (!next) throw new Error(`workflow for ${def.externalId} is stuck in "${status.stateName}"`)
      status.activeRun
        ? await api.advanceWorkflowRun(status.activeRun.id, { transitionId: next.id, comment: 'Applied by the model script' })
        : await api.startWorkflowRun({ kind: 'component', id, transitionId: next.id, comment: 'Applied by the model script' })
      log(`workflow ${def.externalId}: ${next.name}`)
      status = await api.getWorkflowStatus('component', id)
    }
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

/** Whether a node already carries exactly the localized slugs the model declares. */
function sameLocales(current, wanted) {
  const has = current ?? {}
  const keys = Object.keys(wanted)
  return keys.length === Object.keys(has).length && keys.every((k) => has[k] === wanted[k])
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
export async function publishSite(api, applied, { log = console.log, includeStaged = false } = {}) {
  // Standalone Components -- the header and footer -- belong to no page, so nothing else's
  // closure reaches them. They are published as their own roots.
  for (const def of COMPONENTS) {
    if (!def.standalone) continue
    await publishRoot(api, 'component', applied.components[def.externalId].id, { log: () => {} })
    log(`published component ${def.externalId}`)
  }

  for (const def of NODES) {
    if (!def.template) continue
    // Staged content exists in this environment as an ordinary page -- it is simply never
    // published here. Publishing is per node, so keeping something back is not a special mode:
    // it is not calling publish on it. It goes live in Staging, and here on the day it should.
    if (def.staged && !includeStaged) continue
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

/**
 * Creates the extra environments the model declares, and wires the promotion edge between them.
 *
 * Separate from `applyModel` because it is not content and does not belong to one environment: it
 * describes the *shape* of the organization, and it has to run before there is a Staging
 * environment to apply anything to. Safe to re-run -- everything here is matched by name.
 *
 * The promotion target is resolved by **kind**, not by name. A fresh organization names its first
 * pair "Authoring" and "Delivery" for you, and an older one may have been renamed since; either
 * way, the environment this promotes into is "the default authoring one", which is a fact the API
 * reports rather than a string this file gets to assume.
 */
export async function applyEnvironments(api, { log = console.log } = {}) {
  const payload = await api.environments()
  const byName = new Map(payload.environments.map((e) => [e.name, e]))
  const defaultAuthoring = payload.environments.find((e) => e.kind === 'authoring' && e.isDefault)
  const created = {}

  for (const def of ENVIRONMENTS) {
    let authoring = byName.get(def.name)
    if (!authoring) {
      authoring = await api.createEnvironment('authoring', def.name)
      log(`environment ${def.name} (authoring) created`)
    }
    created[def.name] = authoring


    if (def.delivery) {
      let delivery = byName.get(def.delivery)
      if (!delivery) {
        delivery = await api.createEnvironment('delivery', def.delivery)
        log(`environment ${def.delivery} (delivery) created`)
      }
      created[def.delivery] = delivery
      // What this authoring environment publishes to. One authoring environment may map to several
      // delivery targets, but a delivery target belongs to exactly one authoring environment --
      // otherwise "publish this" would have no single answer.
      await api.replaceDeliveryTargets(authoring.id, [delivery.id])
      log(`environment ${def.name} publishes to ${def.delivery}`)
    }

    if (def.promotedIntoFromDefaultAuthoring && defaultAuthoring) {
      // The edge is declared on the **source**: the default authoring environment is what promotes,
      // and this is one of the places it may promote into.
      await api.replacePromotionTargets(defaultAuthoring.id, [authoring.id])
      log(`environment ${defaultAuthoring.name} promotes into ${def.name}`)
    }
  }

  return { environments: created, defaultAuthoring }
}

/**
 * Promotes every staged Experience node into another authoring environment -- the Christmas range
 * arriving in one movement.
 *
 * Two calls, and the shape of the pair is the interesting part.
 *
 * **Plan** returns the whole dependency closure: the Component the node binds, the Contracts and
 * Templates that Component needs, the taxonomy its category fields point at. You listed none of
 * that, and forgetting one of them by hand is exactly how a half-populated environment happens. It
 * also does more than it shows -- promoting into an empty environment creates the site root and the
 * ancestor nodes the path needs, without those appearing in the plan at all.
 *
 * Each item comes back marked `new`, `update` or `diverged`. **Diverged** means it was edited on
 * both sides since they last matched, so promoting it discards work someone did in the target --
 * which is why it needs `confirmOverwrite` rather than being overwritten quietly. This script
 * confirms, because it owns both sides; a person is shown the list and decides.
 *
 * ---- Name the root ----
 *
 * `execute` re-plans the closure server-side from **one** root, so the request has to say which
 * thing that is: `root`, beside the items. Echoing a plan's own items back without one -- the
 * obvious thing to do -- is refused with `promotion_root_required` rather than guessed at.
 *
 * `items` is then just the include list, and its order means nothing. Implicit items ride along
 * whether or not they are listed, which is why they are filtered out here rather than sent. See
 * ebitex-io/monorepo#580, which is what put the root in the request shape.
 */
export async function promoteStaged(api, applied, targetEnvironmentId, { log = console.log } = {}) {
  const results = []
  for (const def of NODES) {
    if (!def.staged) continue
    const node = applied.nodes[def.path]
    if (!node) continue

    const plan = await api.planPromotion(targetEnvironmentId, 'node', node.id)
    if (plan.blockers.length > 0) {
      throw new Error(`promotion of /${def.path} blocked: ${plan.blockers.join('; ')}`)
    }

    log(`/${def.path}: ${plan.items.length} items (${plan.items.map((i) => `${i.kind} ${i.state}`).join(', ')})`)
    const root = { kind: 'node', id: node.id }
    const items = [
      { kind: 'node', id: node.id, confirmOverwrite: true },
      ...plan.items
        .filter((i) => !i.implicit && !(i.kind === 'node' && i.id === node.id))
        .map((i) => ({ kind: i.kind, id: i.id, confirmOverwrite: i.state === 'diverged' })),
    ]
    const result = await api.executePromotion(targetEnvironmentId, root, items)
    const failed = result.items.filter((i) => !i.promoted)
    if (failed.length > 0) {
      throw new Error(`promotion of /${def.path} failed: ${failed.map((i) => `${i.kind}: ${i.error}`).join('; ')}`)
    }
    results.push({ path: def.path, items: result.items.length })
    log(`/${def.path}: promoted ${result.items.length} items`)
  }

  return results
}
