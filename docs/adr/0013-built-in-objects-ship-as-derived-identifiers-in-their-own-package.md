---
status: accepted
date: 2026-10-05
---

# Built-in objects ship as derived identifiers in their own package

A Map project names Built-in objects by Rawcode (`FourCC("hfoo")`), and nothing tells it that `hfoo` is the Footman, a unit, or that it exists at all. The Patch's own data files (SLK and `.txt`) could say so, but no Blizzard text grants a right to redistribute them: the EULA forbids copies and "any work based on the Platform", and claims the names of characters as Blizzard's. We ship the Built-in objects of each Patch anyway, reduced to the identifiers code needs to name them: Rawcode, Object kind, race, enUS name and the Game data sets that hold the object. Tooltip prose, numbers and icons never ship; the hover tool (#468) reads tooltips and icons from the developer's own install at run time. Rawcodes are identifiers map scripts must name to work at all, the same interoperability ground the Typings stand on, and short names are what WurstStdlib2 and `war3-objectdata-th` ship, with no takedown found in GitHub's DMCA record; the risk is lower, not zero.

They ship in a new package of the monorepo, `reforged-objects`, not in `reforged-types` or `reforged-ts`. It changes for another reason than the Typings (a Patch's Built-in objects, not its Natives), it carries a licence exposure the Typings do not, and it should be the one package a takedown would reach. It holds, per Game version, one model emitted three ways:

- a `.d.ts` that adds a `FourCC` overload per Rawcode returning `Rawcode<kind>`, the narrowing ADR 0012 anticipates, and keeps the `string` overload returning `UnknownRawcode` last, so a literal it does not know still compiles;
- constants per Object kind, each typed `Rawcode<kind>`, compiled to a Lua module of integers with one entry point per kind (`reforged-objects/units`), so a bundle carries only the kinds it imports;
- a JSON index for the lint rule and the hover tool.

A constant is always named by its enUS name and its Rawcode, `Units.Footman_hfoo`: names collide (several units are "Footman"), and a name that gained its suffix only on collision would be renamed by the Patch that adds the second one.

The data is generated on a maintainer's machine from the local install during `new-patch`. Raw SLK and `.txt` files never enter git; `provenance.json` pins each input by CASC content key and sha256.

## Considered options

- Generate on each developer's machine from their install, shipping nothing of Blizzard's: the least exposed, but a Map project's CI without the game works only if the generated file is committed, and every Map project needs a game install to get constants at all.
- Ship every field of every Built-in object, tooltips included, as `war3-objectdata-th`'s JSON does, or vendor the raw files as w3x2lni and War3Net do: the most exposed, and the repository already refuses jassdoc's prose for want of a licence.
- Overloads and the index in `reforged-types`, constants in `reforged-ts`: game content would share the Typings' exposure and release cycle, and the lint rule and hover tool would depend on two packages. Teaching `reforged-types` to ship Lua has the first cost too.
- Constants named by enUS name alone, with the Rawcode as a suffix only on collision: a Patch that adds a second "Footman" renames the existing constant, a major for nothing.
- Constants keyed by Rawcode alone (`Units.hfoo`): stable, but the overloads already give that, and a name is how a developer looks for an object.
- `declare const enum` constants, which typescript-to-lua inlines at no run-time cost: an enum member is not a `Rawcode<kind>`, so every parameter of ADR 0012 would reject it.
- One set of constants per Game data set, or the base set only: the sets differ in which objects exist and in stats, and stats do not ship, so one set over their union, with membership in the TSDoc, says the same with fewer names.
- Extraction from Blizzard's CDN in CI, to automate a New Patch: `casc-cdn` cannot read `UnitData.slk` and CascLib is native code; not now.

## Consequences

- `reforged-objects` is the first package to carry a "not affiliated with Blizzard" notice. It is additive, so it does not gate 1.0.0.
- It has its own `reforged.patch` field and folders per Game version; a new Game version's folder sits next to the previous one, as in `reforged-types`.
- A Built-in object a Patch adds is additive; one it removes or Blizzard renames is a major of `reforged-objects`, with its `renames.json` entry and migration page (ADR 0009). `new-patch` reviews the objects' diff with the Typings'.
- The constants cover the union of the Patch's Game data sets; their TSDoc says which sets hold each object.
- The overloads reach a Map project through `types` in its tsconfig, and the Template turns them on by default; at about 2 ms of check time per `FourCC` call with 6,000 overloads (#462), the spec measures the cost.
- The package's TSDoc always shows the game's name. What a map does to a Built-in object (a new name for `hfoo`) is not in the package: a Map project's own generated data and the hover tool show it.
- The constants stay out of the TypeDoc API reference, since their TSDoc shows on hover; a guide page explains them.

Decision record: https://github.com/phmilk/reforged-ts/issues/464
