# samples/

One directory per sample. **Each is a complete, standalone project** with its own
`package.json`, its own dependencies, and its own build.

## There is deliberately no root workspace

This repository does not use npm workspaces, and that is a decision rather than an omission.

A workspace root would deduplicate dependencies and make CI faster. It would also make every
sample's `package.json` a lie: it would resolve only *inside this repository*, so a reader who
copies a sample out as a starting point — which is the entire purpose of this repo — would get
something that does not install. The samples must be what they claim to be.

The cost is duplicated `node_modules` and slower CI. That is the right trade here, and it is the
wrong trade in an ordinary product monorepo, which is why the ebitex monorepo itself is organised
the other way.

It also keeps the next sample honest. A Node/SSR sample has a genuinely different dependency set
and build pipeline, and nothing at this level should presume otherwise.

## Layout of a sample

```
<sample-name>/
  README.md          follows docs/sample-readme-template.md
  package.json       standalone — no workspace: protocol, no root hoisting
  .env.example       committed; .env is not
  src/               application code
  content-model/     idempotent apply script — the content model as data
  seed/              portable export bundles, named for the step they match
```

`content-model/` and `seed/` are two routes to the same destination, and both are worth shipping.
The bundles are the fast path: import one and the model exists. The apply script is the
*legible* path — it is the whole content model as readable data, which a reader can study, diff
between steps, and adapt, in a way a zip does not allow.

## Adding a sample

See [../CONTRIBUTING.md](../CONTRIBUTING.md).
