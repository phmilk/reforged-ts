---
title: Typings
sidebar_position: 13
description: reforged-types, the TypeScript declarations of the Natives generated from each Patch's own files, how a Map project selects a Game version, and how the Overlay is curated.
---

# Typings

The Typings are the TypeScript declarations of the Natives of one game Patch: every function, type, constant and global a map script can call in Lua. `reforged-types` ships them, generated from the Patch's own files, `common.j`, `blizzard.j` and `common.ai`, and merged with the Overlay, a set of hand-curated facts about each Native. The library's Wrappers are built on them, and a Map project can call any Native directly through them. Their [reference](/typings) has a page per Native.

## In a Map project

The Template lists the Typings of its Game version in `types`, next to typescript-to-lua's language extensions:

```json
{
  "compilerOptions": {
    "types": ["@typescript-to-lua/language-extensions", "reforged-types/3.0.0"]
  }
}
```

That one entry declares every `common.j` Native, type and global, the `blizzard.j` functions and globals, the globals the game's Lua adds (`FourCC`, `__jarray`), the Rawcode types (`Rawcode`, `ObjectKind`, `UnknownRawcode`) and the Lua 5.3 standard library. The AI Natives of `common.ai` are valid only in AI scripts, so the entry leaves them out; to use them, add `reforged-types/3.0.0/common.ai` to `types` as well.

The declarations turn the game's rules into compile errors:

```ts
const owner = Player(0);
if (owner !== undefined) {
  // Handle types are branded: a timer is not a unit.
  // @ts-expect-error: a timer where a unit is expected
  KillUnit(CreateTimer());

  // A Native that can return nothing returns T | undefined.
  const footman = CreateUnit(owner, FourCC("hfoo"), 0, 0, 270);
  if (footman !== undefined) {
    SetUnitMoveSpeed(footman, 400);
  }
}
```

- **Branded Handles.** Each Handle type is its own interface and mirrors the Patch's type hierarchy (`unit extends widget extends agent`), so a `timer` passed where a `unit` is expected does not compile.
- **Nullability.** A Native that can return nothing (`CreateUnit`, `Player`) returns `T | undefined`; one the game guarantees (`GetLocalPlayer`, the `Convert*` functions) returns `T`. A parameter accepts `undefined` only where the game is known to accept `nil`.
- **Plain Lua functions.** Callbacks are typed `this: void` and every file is `@noSelfInFile`, so typescript-to-lua emits plain Lua functions without a `self` parameter.
- **Jass arrays.** The `bj_*` array globals are `Record<number, T>`, indexed from 0 as in Jass.
- **Rawcodes.** A Rawcode is typed by its Object kind: `Rawcode<"unit">` for a unit type's, `Rawcode<"unit" | "upgrade">` for either kind's, `Rawcode` alone for any kind's. A plain `number` is not one, and neither is a Rawcode of another kind. `FourCC` returns an `UnknownRawcode`, which every Rawcode accepts; a Rawcode widens to `number`, and a computed `number` becomes one with a cast (`id as Rawcode<"unit">`). The types cost nothing at run time. [Rawcodes](rawcodes.md) explains them in full.
- **The hover.** Each Native's documentation gives its Jass types (`integer (32-bit)`, `real`), `@async` when its value is valid only for the local player, `@deprecated` with the reason, `@patch` for the Patch that added it, and a link to its page on jassbot.

`async-natives.json`, next to the declarations, lists the Natives marked `@async`: the lint rules read it ([`no-async-value-as-state`](lint-rules/no-async-value-as-state.md)).

## Patches and Game versions

A **Patch** is a released version of the game, identified by its **Build**, the full four-component number (`3.0.0.24268`). Its first three components are its **Game version** (`3.0.0`), which every Patch released under that number shares.

- **A Map project selects its Typings by Game version**: the `types` entry is `reforged-types/<Game version>`. Several Builds of one Game version share one entry, generated from the newest of them.
- **`reforged.patch`** in each package's `package.json` names the Build the package supports, the minimum Patch it is tested against. Each docs version states it on its first page, and [Compatibility](../compatibility/index.mdx) lists it for every release.
- **A new Patch is a new release of `reforged-types`.** One pull request regenerates the Typings from the new Patch files and moves the `reforged.patch` fields. A Patch that adds Natives is a minor release; one that changes or removes a Native the library's public API depends on can be a major of the library, with its migration page.
- **The library follows.** `reforged-ts` and the Typings move to the new Patch together: the library always supports the newest Patch the Typings ship. The API reference links each Wrapper member's `@native` to the Native's page in the Typings of the newest Game version.

The Patch files come from [jass-history](https://github.com/Luashine/jass-history), which archives the files of every Build. Each vendored Patch keeps a provenance file with the tag, the commit and the sha256 of each file, so the Typings of a Build can be regenerated byte for byte.

## The Overlay

The Patch files give each Native's name, parameters and Jass types, and nothing else: not whether it can return nothing, whether its value differs between clients, or whether it is deprecated. The **Overlay** holds those facts: one JSON file per Native and global, under [`packages/reforged-types/overlay/`](https://github.com/phmilk/reforged-ts/tree/master/packages/reforged-types/overlay), by source file (`common.j`, `blizzard.j`, `common.ai`) and kind (`functions`, `globals`). The generator merges it with the Patch files and fails on any declaration without an entry, so every nullable type in the Typings is a reviewed decision.

An entry, `overlay/common.j/functions/GetLocalPlayer.json`:

```json
{
  "name": "GetLocalPlayer",
  "source": "common.j",
  "returns": {
    "nullable": false
  },
  "params": [],
  "async": true,
  "origin": "war3-types-strict"
}
```

What an entry holds, and the curation rules each field follows:

| Field               | What it says                                            | Rule                                                                                                                                    |
| ------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `returns.nullable`  | The Native can return nothing: `T \| undefined`         | A Native returning a Handle is nullable, except a converter (`Convert*`) and an enum-like constant getter. A string follows its family. |
| `params[].nullable` | The parameter accepts `nil`                             | `false` unless the Native is documented or observed to accept `nil`.                                                                    |
| `async`             | The value is valid for the local player alone: `@async` | Only for such a Native (`GetLocalPlayer`).                                                                                              |
| `deprecated`        | The reason, rendered as `@deprecated`                   | A reason, never a bare flag.                                                                                                            |
| `notes`             | A fact, rendered as `@remarks`                          | A fact from the project's research. No jassdoc prose, which has no license.                                                             |
| `since`             | The Build that added the Native, rendered as `@patch`   | Set on the declarations a new Patch adds; left off where the first Patch is uncertain.                                                  |
| `params[].type`     | A TypeScript type overriding the Jass one               | A reviewed decision only (`Condition` and `Filter` take `boolcode`).                                                                    |
| `origin`            | Where the entry came from                               | `war3-types-strict` marks an entry seeded from that project; a new entry has none.                                                      |

The Overlay was seeded with the nullability decisions of [war3-types-strict](https://github.com/TinkerWorX/war3-types-strict) (MIT).

## Correcting a declaration

The generated files are never edited: the next generation would drop the edit. To correct a Native (a return that can in fact be nothing, a Native that is async), change its Overlay entry in a pull request to [phmilk/reforged-ts](https://github.com/phmilk/reforged-ts):

1. Edit `packages/reforged-types/overlay/<source>/<kind>/<Name>.json`, with the observation or the source that supports the change in the pull request.
2. Run `pnpm typings:generate` from the repository root: it regenerates the declarations from the vendored Patch files and the Overlay.
3. Run `pnpm check`, and add a changeset for `reforged-types`.

A correction can break code that compiled before (a return that becomes nullable), which is why each one is reviewed. [Adding a Patch](../contributing/adding-a-patch.md) is the full loop for a new Patch: vendoring its files, curating the entries it adds and regenerating.
