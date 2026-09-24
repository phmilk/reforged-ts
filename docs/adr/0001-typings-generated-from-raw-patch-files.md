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

## Amendment (2026-09-24)

Implementing the generator (#39) settled three details that the decision above left open or stated loosely. The decision itself stands.

- Paths are package-relative. Patch files are vendored under `packages/reforged-types/vendor/<build>/`, not `typings/source/<patch>/`. The Overlay lives under `packages/reforged-types/overlay/<source>/{functions,globals,types}/`, one JSON file per declaration.
- The output is one folder and one entry file per Game version (`3.0.0/`, `3.0.0.d.ts`), not one `.d.ts` per Patch. A Game version is generated from its newest vendored Build. An older vendored Build of the same Game version is only compared against, to list what the newer Build adds. A Map project selects its Typings by Game version, so a second Build of one Game version does not warrant a second set.
- The Overlay has one kind folder per declaration kind. Names of different kinds collide case-insensitively within one source file (`Sleep` and `SLEEP` in common.ai; `location` and `Location`, `player` and `Player`, `rect` and `Rect` in common.j), and the Windows and macOS file systems cannot hold both files in one folder.

Amendment record: https://github.com/phmilk/reforged-ts/issues/39
