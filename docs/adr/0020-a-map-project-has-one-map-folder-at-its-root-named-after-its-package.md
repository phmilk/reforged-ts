---
status: accepted
date: 2026-10-22
---

# A Map project has one map folder, at its root, named after its package

A Map project keeps its one map folder under `maps/`, a plural name for a folder that holds exactly one map. The plural comes from cipherxof's wc3-ts-template, whose build fixes the `maps/` prefix and whose config names one map inside it. The Template's `mapFolder` is a full path from the project root and the build reads nothing else, so the plural survives only as a convention, and the convention says something false: with two map folders under `maps/`, the TypeScript plugin's hover and `no-unknown-rawcodes` both find "several" and give up. Every Map project also keeps the Template's map name, `reforged-ts-template.w3m`, which shows in the game's map list and in the packed archive.

We decide that a Map project has exactly one map folder, at its root beside `src/`, named after the project's package (`my-map.w3m`). Without an option, the TypeScript plugin and `no-unknown-rawcodes` find the one folder directly at the project root whose name ends in `.w3m` or `.w3x`, ignoring case; with none there, the one directly under `maps/`, so a Map project made earlier keeps its hover and its lint. One at the root wins over any under `maps/`; several at the root, or none at the root and several under `maps/`, is no map folder. The explicit option still wins over discovery. The Creation CLI renames the Template's map folder after the package and points `mapFolder` at it, and the Template moves its own to its root. This builds on ADR 0006: the World Editor still owns the map folder's data; only its place and its name change.

## Considered options

- `maps/`, as today. No change, but a plural for one map, and a place the tools cannot hold a second map in.
- `map/`. An honest name, but a folder around a folder: the map folder is already the map.
- The project root (chosen). The folder the World Editor opens sits beside `src/`, as easy to find, and the layout says one map.

## Consequences

- The tools look in two places until 1.0.0, and their messages name both. The `maps/` fallback is removed at 1.0.0; a Map project made before this change moves its map folder to the root and sets `mapFolder`, as the release notes say.
- The plugin's and the rule's tests run one table of discovery cases (`packages/reforged-map/test/fixtures/map-folder-discovery.json`), so the two tools never disagree on where the map folder is.
- A second map is a second Map project.
- The Template moves its map folder only after the release that finds one at the root.

Decision record: https://github.com/phmilk/reforged-ts/issues/693
