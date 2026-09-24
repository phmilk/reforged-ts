---
status: accepted
date: 2026-09-23
---

# Every Wrapper covers all natives owned by its handle type, measured by a generated report, and Blizzard.j is never mirrored

The Wrappers inherited from w3ts call about 816 of the 1,547 natives of Patch 1.33.0, and 3.0.0 added 137 more, so "extend the API" had no measurable meaning. We make it one: a Wrapper class must cover 100% of the natives whose first parameter is its handle type (`unit` to `Unit`, `item` to `Item`, and so on); CI generates a coverage report from the Typings (natives grouped by owning handle type against the methods that call them) and fails when an owned native has no method. Natives without an owning handle (converters, hashtables, terrain deformation, save/load, game state) stay reachable through the Typings and are wrapped only when a System needs them. The library never mirrors `*BJ` functions: they exist for the GUI trigger editor and share global state (`bj_lastStartedTimer`, `bj_destroyEffectAsync*`); whatever is useful is reimplemented over natives. Where a family of natives differs only by optional parameters, one factory with an options object replaces it (the 32 destructable constructors become `Destructable.create(options)`).

## Considered options

- A hand-maintained list of natives to wrap: drifts with every Patch and cannot be checked.
- Mirroring every native 1:1 including Blizzard.j: doubles the surface with functions that carry the GUI's global-state hazards.
- Wrapping every native regardless of owner: forces Wrappers for concepts without a handle (doodads, terrain fog) before their design is understood; those become static namespaces in release 1.1.

## Consequences

- The coverage report is a release artefact; a new Patch's natives show up as failures until wrapped or explicitly excluded with a reason.
- Map projects that need a `*BJ` function call it through the Typings; the lint's `no-unsafe-natives` bans the ones known to be harmful.
- The first release covers about 90 of the 137 new natives (tiers 1 and 2); terrain fog, HD water, doodads and cinematics follow in 1.1.

Decision record: https://github.com/phmilk/reforged-ts/issues/8
