---
status: accepted
date: 2026-10-05
---

# A Map project's generated code comes from `reforged-map`, not from Template scripts

A Map project's code needs to know what its map folder holds: the editor's `gg_` and `udg_` globals, which the Template's `scripts/editor-globals.ts` reads from `war3map.lua` today, and from ADR 0012 on the Object kind of every Rawcode it names. A GUI variable of type unit-type is an integer in `war3map.lua`, byte for byte the same as an `integer` variable, so its kind is only in the Variable Editor's type (`unitcode`, `itemcode`, `abilcode`, `buffcode`, `destructablecode`, `techcode`) in `war3map.wtg`; typed `number`, every Rawcode parameter of 1.0.0 rejects it. A Custom object (`h000`) has a kind, a name and a base only in the map's Object data, and on 3.0 its name is in `war3mapSkin.w3u` as a `TRIGSTR` into `war3map.wts`, not in `war3map.w3u`.

Reading these files moves out of the Template's scripts into a new package of the monorepo, `reforged-map`: a Map project's scripts are copied from the Template once and never refreshed, and a reader of the World Editor's binary formats has to follow every Patch and every editor that saves the map (HiveWE writes another layout) through an update, not a hand merge in each Map project. `reforged-map` owns everything the Map project's generated code reads from the map folder: the globals of `war3map.lua` (the `editor-globals` generator and its Lua stub for `reforged-test` move there), the variables block of `war3map.wtg`, the Game data set of `war3map.w3i`, and the Object data with its Skin files and `war3map.wts`. The Template keeps `scripts/generate.ts` and its `Generator`s, each a thin call into the package. The package only reads, so ADR 0006 stands; whether it also writes Object data is the authoring decision's (#467).

The readers are ours, read-only, with wc3libs' notes and fixtures (Apache-2.0) and maps saved by the 3.0 World Editor and by HiveWE as their contract. They accept both layouts (a name in the Skin file or in the base file, the Skin file winning; a `TRIGSTR_nnn` or literal text), any four-character Custom Rawcode, and take the Object kind from the file it is in, never from the Rawcode's shape.

From one model of the map, the generator writes into the Map project's `src/generated/` folder, git-ignored and rewritten on install, build and `pnpm dev`, next to the overloads and constants of `reforged-builtins` (ADR 0013):

- `udg_` variables of an object type typed `Rawcode<kind>` (`Record<number, Rawcode<kind>>` for an array, `Rawcode<"unit" | "upgrade">` for `techcode`); `ordercode` stays `number`;
- a `FourCC` overload per Custom object returning `Rawcode<kind>`, its TSDoc giving the name, the kind and the Built-in object it derives from, and one per Built-in object the map modifies, giving the map's name next to the game's; a literal overload of a file under `src/` precedes the package's, so the map's wins, and a type test in the Template holds that order;
- constants per Object kind for Custom objects only, `CustomUnits.Captain_h000`, named by name and Rawcode as in ADR 0013 and compiled to integer literals;
- a JSON index for the lint rule and the hover tool: Rawcode, kind, name, base, custom or modified, and the map's Game data set.

A Custom Rawcode used by two kinds gets no `FourCC` overload: `FourCC("B000")` stays `UnknownRawcode`, the constants `CustomBuffs.…_B000` and `CustomDestructables.…_B000` keep their exact kinds, and the JSON index records the collision for the hover tool. The World Editor numbers custom destructables from `B000` whatever their base, and custom buffs from the first letter of theirs, `B` for every Built-in buff, so this is the common case, and a build warning would fire on most maps.

## Considered options

- Template scripts, as `editor-globals.ts` is today: no package to publish, but a Map project keeps the reader it was generated with, including its bugs and its ignorance of the next Patch.
- The readers inside `reforged-builtins`: one package fewer, but ADR 0013 keeps that one package to Blizzard-derived data, the one a takedown would reach, and a map's files change for other reasons than a Patch's Built-in objects.
- `mdx-m3-viewer-th`, already a dependency of the Template for the MPQ writer: its Object data reader skips the Skin files, so it cannot name a 3.0 Custom object, its `w3i` reader misreads version 39 and its `wtg` reader cannot read the 1.31+ format.
- A `FourCC` overload returning `Rawcode<"buff" | "destructable">` for a Rawcode shared across kinds: no single-kind parameter accepts it without `as`. Failing the build: the World Editor's own defaults would fail most maps.
- Constants for modified Built-in objects too: `Units.Footman_hfoo` already names them, and the map's name shows in the overload's TSDoc.
- Generated files committed: the generator needs only the map folder, which is always in the repository, never the game.

## Consequences

- The monorepo gains a sixth package. Its first slice, the globals and the `wtg` variable types, ships with ADR 0012 and gates 1.0.0 with it, since a Map project's GUI unit-type variables would otherwise stop compiling; the Object data slice is additive and does not.
- The Template drops `scripts/editor-globals.ts` and adds `reforged-map` and `reforged-builtins`, with the overloads turned on.
- The lint rule (#466) and the hover tool (#468) read the Map project's JSON index from `src/generated/`.
- A rename in the World Editor renames a Custom object's constant, and the build fails at each use until the code follows.

The package only read when this was decided; ADR 0015 gives it a writer of Object data, for Object sync and the Studio.

Decision record: https://github.com/phmilk/reforged-ts/issues/465

## Amendment (2026-10-05)

The unknown-Rawcode lint rule (#466) does not read the JSON index in `src/generated/`. That index is only as fresh as the last install, build or `pnpm dev`, and an editor's ESLint server outlives all three. A Rawcode created in the World Editor, or in an Object definition, while `pnpm dev` is not running would then be reported as unknown until the developer regenerated by hand. The plugin instead asks the Map project's own installation of `reforged-map` for the map's model, in memory, from the map folder and the Object definitions. It keeps that model until the modification time of one of their files changes. The rule writes nothing, so it never races `pnpm dev` or ESLint's parallel workers. The model includes the Object definitions, so loading it runs them in the ESLint process. They are the Map project's own Node code, as `eslint.config.mjs` is.

The JSON index stays, for the hover tool (#468). The generated `FourCC` overloads stay as fresh as the last generation: a Rawcode newer than them is `UnknownRawcode`, which every parameter accepts, so stale overloads hide nothing from the lint rule.

Amendment record: https://github.com/phmilk/reforged-ts/issues/466

## Second amendment (2026-10-05)

The hover tool (#468) does not read the JSON index in `src/generated/` either. It is a TypeScript language service plugin, and tsserver outlives install, build and `pnpm dev` just as ESLint's server does. Reading the index, it would call a Rawcode created in the World Editor while `pnpm dev` is not running unknown, while the lint rule accepts it.

`reforged-map` instead exposes one public lookup from a Rawcode to its object. The lookup joins the JSON index of `reforged-builtins` with the map's model held in memory, from the map folder and the Object definitions, and reloads it when the modification time of one of their files changes. The plugin (`reforged-map/typescript-plugin`) and the lint rule both call it, so they always agree on which Rawcodes exist. A Rawcode that two kinds share is a lookup result naming both objects, not a field of a file.

The map's JSON index loses its last consumer, so the generator no longer writes it. `src/generated/` holds the `udg_` declarations, the `FourCC` overloads and the constants. The JSON index of `reforged-builtins` stays; the lookup reads it.

Amendment record: https://github.com/phmilk/reforged-ts/issues/468

## Third amendment (2026-10-06)

HiveWE is not a target for now. No HiveWE release reads a 3.0.0 map: 0.10, the latest, predates 3.0, misreads its `war3map.w3i` and doo files, and crashed at startup on the maintainer's 3.0 install, and the `main` that reads them has no build (#471, #485). The readers' contract is maps saved by the 3.0 World Editor, with wc3libs' notes and fixtures; no fixture is shaped like a HiveWE save.

The readers still accept both layouts: a name in the Skin file or in the base file, a `TRIGSTR_nnn` or literal text. The World Editor itself loads a literal name from either file (#475), so the tolerance costs nothing and keeps maps from other tools readable. Whether HiveWE becomes a target again is decided once a HiveWE release reads 3.0 maps.

Amendment record: https://github.com/phmilk/reforged-ts/issues/485
