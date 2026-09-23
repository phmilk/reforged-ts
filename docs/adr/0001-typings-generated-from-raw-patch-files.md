---
status: accepted
date: 2026-09-23
---

# Typings are generated from vendored raw Patch files plus a hand-curated Overlay

No maintained Typings exist past Patch 1.33.0, and the community's annotated source (jassdoc) carries no license, so its prose cannot ship in an MIT package. We generate the Typings ourselves from the raw `common.j`, `Blizzard.j` and `common.ai` of each Patch (vendored under `typings/source/<patch>/` with provenance from jass-history tags), and merge an Overlay of hand-curated facts (nullability, deprecation, notes; one JSON file per native, mandatory, seeded from war3-types-strict's MIT records). The result is published as its own package, `reforged-types`, one `.d.ts` per Patch with semver independent of the game.

## Considered options

- Extending war3-types-strict's JSON database: keeps its curation but every Patch is manual work and removals require editing older layers.
- Generating from jassdoc's `jass.db`: best coverage and descriptions, but unlicensed data and a dependency on its update cadence.
- Hand-maintained `.d.ts`: does not scale to 1,681 natives per Patch.

## Consequences

- Nullability is decided native by native; the generator fails on natives without an Overlay entry, so the Overlay is the curation checklist for every new Patch.
- The repository becomes a workspace (`reforged-ts`, `reforged-types`); the Template depends on the Typings directly.
- Generated files use `@noSelfInFile`, `this: void` callback aliases, branded interface chains mirroring the Patch, `number` for integer/real and `Record<number, T>` for Jass arrays.

Decision record: https://github.com/phmilk/reforged-ts/issues/7
