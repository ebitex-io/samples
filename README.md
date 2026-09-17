# ebitex samples

Reference implementations of real sites built on the [ebitex](https://ebitex.io) suite — a CMS, a
form management tool, and shared identity across them.

Each sample is a **complete, standalone project**. Clone it, point it at your own ebitex
organization, and run it. Nothing here resolves against an ebitex-operated server, and this
repository contains no credentials of any kind.

## Samples

| Sample | Stack | Status |
|---|---|---|
| `northwind-coffee` | Static site — Vite, React, TypeScript, `@ebitex/content-sdk` | Complete — twenty steps, `step-01` … `step-20` |
| `northwind-coffee-ssr` | Server-rendered — Next.js App Router, `@ebitex/content-sdk` | The same site with a server in front of it |
| `northwind-coffee-mvc` | Server-rendered — ASP.NET Core MVC, Razor, `Ebitex.Content.Delivery` | The same site again, with no client-side framework at all |

The three Northwind samples are the same site, the same content model and the same seed bundles,
built three ways. None is the better choice: a static build, a server that hydrates, and a server
whose pages never hydrate are all fully supported, and reading them side by side is the fastest way
to see what a server buys and what it costs — including what the third gives up, which is
click-to-edit preview pins, in exchange for shipping no client code at all.

## Running a sample

Each sample's own README is the authority; the shape is always the same — install, configure with
your own values, run:

```bash
git clone https://github.com/ebitex-io/samples.git
cd samples/samples/<sample-name>

# A Node sample
npm install
cp .env.example .env      # then fill in your own values
npm run dev

# A .NET sample
dotnet user-secrets set "Content:DeliveryKey" "..."   # see its README for the full list
dotnet run
```

Before it will show anything, a sample needs **content** — the Contracts, Templates and pages it
expects — in an ebitex organization you control. Each sample ships **seed bundles** under its
`seed/` directory: portable export files you import through Content's own import screen, which
create the whole content model and its content in your organization under your ownership. From
there it is yours: change a Contract, add a page, break something and fix it. That is the point.

The sample then needs a Content delivery key from *your* organization, which goes in `.env`.

## The tutorial series

Each sample is built step by step in a series on [ebitex.io/blog](https://ebitex.io/blog), which
explains the *why* at every step rather than only the keystrokes.

**Tags let you join at any step.** Every step is tagged `<sample>/step-NN`:

```bash
git checkout northwind-coffee/step-07
```

At any step tag:

- **It builds and typechecks.**
- **It runs** against an organization seeded with the nearest seed bundle at or before that step.
  The sample's README says which one, and so does the corresponding blog post.
- **It is not necessarily visually complete.** A step that adds a Contract before the code that
  renders it is a legitimate step, and the post says so when that is where you are.

Seed bundles are named for the step they match (`seed/step-05.zip`), so "which bundle for which tag"
is never a lookup — take the highest-numbered bundle at or below your step.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Note that **design history for this repository lives
elsewhere**: these samples are specified in the ebitex monorepo under `specs/features/`, not here.

## Licence

[Unlicense](LICENSE) — public domain. This code exists to be copied. Take it, change it, ship it,
with no attribution required.
