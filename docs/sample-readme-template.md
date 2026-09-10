# Sample README template

Every sample's `README.md` answers the same questions in the same order, so a reader who has met
one sample already knows how to read the next. Copy the structure below.

The ordering is deliberate: **what it is** before **how to run it**, and **content before
configuration** — a sample cannot resolve anything until content exists in the reader's own
organization, so a README that leads with `npm install` sends people to a broken page and an
empty-looking bug report.

---

```markdown
# <Sample name>

<One sentence: what this site is, for whom.>

<One paragraph: what it demonstrates about the ebitex suite, and what shape of site it is —
static or server-rendered, and why that choice.>

## What it teaches

| Area | Where to look |
|---|---|
| <e.g. Streams and facets> | `src/...` |

## Prerequisites

- Node <version>
- An ebitex organization you control (a free one is enough for this sample / this sample needs
  <tier> because <reason>)

## 1. Seed the content

<Which bundle to import, and how. Name the exact file.>

## 2. Configure

    cp .env.example .env

| Variable | Where to get it |
|---|---|
| `VITE_CONTENT_DELIVERY_KEY` | Content → Configure → Delivery, in your own organization |
| ... | ... |

## 3. Run

    npm install
    npm run dev

## Following the tutorial

<Link to the series. The tag namespace for this sample, and the seed bundle matching each
checkpoint step.>

## Structure

<A short map of the directories a reader will want, and what each is for.>
```

---

## Notes on filling it in

**Say which tier the sample needs, and why.** "Requires Pro" with no reason reads as an upsell.
"Requires Pro because it uses two environments to demonstrate promotion" is information.

**Name exact files, never "the latest bundle".** A reader with a tag checked out needs a specific
answer, and "latest" is wrong for anyone who is not on the final step.

**Do not document the ebitex product here.** Link to the docs. A sample README that half-explains
Contracts will drift out of date, and it competes with the source of truth instead of pointing at
it.

**Keep the run instructions copy-pasteable.** No prose in the middle of a command block, and no
placeholder a reader has to notice and substitute without being told to.
