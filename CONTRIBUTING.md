# Contributing

## Where the design decisions live

**This repository holds code and content artifacts. Its design history lives in the
[ebitex monorepo](https://github.com/ebitex-io/monorepo) under `specs/features/`.**

That is unusual enough to state plainly, because the natural assumption is that a repository's
rationale lives inside it. Each sample here has a spec over there recording what was decided and
why, and the samples repo is deliberately not a second place for design history to accumulate.

Start with [`specs/references/samples-repository.md`](https://github.com/ebitex-io/monorepo/blob/main/specs/references/samples-repository.md)
in the monorepo, which explains the relationship and points at the relevant specs.

## Adding a sample

1. **Open an issue in the monorepo** and write a spec. A sample is a substantial piece of work with
   real design decisions — which site, which stack, what it teaches, in what order — and those
   belong in a spec before code, per the monorepo's own `CLAUDE.md`.
2. **Create `samples/<sample-name>/`.** Self-contained: its own manifest (`package.json` for a Node
   sample, a `.csproj` or `.sln` for a .NET one), its own dependencies, its own build. No workspace
   protocol, no reliance on anything hoisted from the root — see
   [`samples/README.md`](samples/README.md) for why this matters more than the CI time it costs.
3. **Write its README** from [`docs/sample-readme-template.md`](docs/sample-readme-template.md).
4. **Add a CI leg** in `.github/workflows/ci.yml` — a filter entry and a job. Also add the path to
   the `unclassified` step's exclusion list, or every change to your sample will additionally run
   the fail-safe.
5. **Add a row** to the sample index in the root [`README.md`](README.md).
6. **Claim a tag namespace**: `<sample-name>/step-NN`.

Everything else is the sample's own business. Two samples are allowed to disagree about lint
configuration, test runner, and directory layout below `src/` — they are separate projects that
happen to share a repository, and forcing consistency between them would push shared tooling to the
root, which is the thing step 2 exists to prevent.

## Tags

Every tutorial step is tagged `<sample-name>/step-NN`, zero-padded, placed on `main` as the work
moves forward.

History is **not** rewritten into a curated per-step sequence. That would read better and would
make every later correction a history rewrite — breaking tags that published blog posts already
link to. A correction is an ordinary commit, and a tag moves only if the step it names was wrong.

At any step tag the sample **builds and typechecks**, and **runs** against an organization seeded
with the nearest seed bundle at or before that step. It is explicitly **not** guaranteed to be
visually complete: a step that adds a Contract before the code that renders it is a legitimate
step.

## Seed bundles

Portable export bundles live in each sample's `seed/`, named for the step they match
(`seed/step-05.zip`). Not every step has one — they are checkpoints. Naming them for their step
means "which bundle for which tag" is answered by the filename rather than by a table someone has
to keep true.

Regenerate them whenever the content model changes in a way that invalidates an earlier bundle, and
say so in the sample's README.

## Credentials

**Never commit a delivery key, an API key, or a `.env` file.** Every sample reads its configuration
from `.env`, with a committed `.env.example` documenting the variables. The keys belong to whoever
is running the sample.

This is not merely hygiene here — it is the design. There is no shared demo organization: each
reader imports the content into their own organization and supplies their own key, which is what
makes a sample something you can *change* rather than only run.
