---
title: w3ts 3.x to reforged-ts 1.0
sidebar_label: w3ts 3.x to reforged-ts 1.0
sidebar_position: 1
description: Migrate a Map project from w3ts 3.x to reforged-ts 1.0, from the install to the renamed and removed symbols, the behaviour changes and the Typings.
---

import Renames from "./_generated/w3ts-3-to-reforged-ts-1/renames.md";
import BehaviourChanges from "./_generated/w3ts-3-to-reforged-ts-1/behaviour-changes.md";

# w3ts 3.x to reforged-ts 1.0

reforged-ts 1.0 continues w3ts 3.0.2 for Warcraft III 3.0.0 and later, under a new package name. Its first major removes the deprecated constructors and the old Hook code, gives every Wrapper one error rule, and moves the Systems onto real `Promise`s. Follow this page from top to bottom:

1. [Install and tsconfig](#install-and-tsconfig): replace the packages and select the Typings.
2. [Old-to-new table](#old-to-new-table): every symbol reforged-ts 1.0 removes or renames, with its replacement.
3. [Behaviour changes](#behaviour-changes): what changes at run time or in the compiler under a name that stays.
4. [Typings changes](#typings-changes): the declarations of the Natives.
5. [What stays the same](#what-stays-the-same).

## Install and tsconfig

Replace `w3ts` with `reforged-ts` and its Typings, `reforged-types`, a peer dependency the Map project installs itself:

```sh
npm uninstall w3ts
npm install reforged-ts reforged-types
```

Until 1.0.0 is published, install the prereleases with `@next`: `npm install reforged-ts@next reforged-types@next`.

w3ts 3.x brought the Typings of Patch 1.33.0 through its own dependency, `war3-types-strict`, which its declarations referenced. reforged-ts references none: the Map project selects the Typings of its Game version in `tsconfig.json`, next to the typescript-to-lua language extensions:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "types": ["@typescript-to-lua/language-extensions", "reforged-types/3.0.0"]
  }
}
```

The Typings entry brings the Lua 5.3 standard library through `lua-types`, so a `lua-types/5.3` entry is no longer needed. w3ts 3.x asked for TypeScript 5; the Toolchain of reforged-ts is TypeScript 6.0.2, the version typescript-to-lua 1.37 requires, which has no `moduleResolution: classic`: use `bundler`. The [compatibility matrix](../compatibility/index.mdx) lists the Toolchain of each release, and the [Template](https://github.com/phmilk/reforged-ts-template) is a Map project already set up this way.

Then replace every import from `w3ts` with an import from `reforged-ts`. The lint plugin does it for you: its [`no-legacy-w3ts-names`](../guides/lint-rules/no-legacy-w3ts-names.md) rule reports every name of the table below, and `eslint --fix` rewrites the imports and the one-to-one renames.

## Old-to-new table

Every public symbol of w3ts 3.x that reforged-ts 1.0 removes or renames, with its replacement: a symbol written as `new Unit(...)` is a constructor, `Unit.create(...)` a call, `Frame.parent` a member. Several replacements split the old symbol by argument shape or into a get/set pair, and "removed" means there is none: the note says what to write instead. The library publishes the same list with the package, `reforged-ts/migration/renames.json`, which the lint rule reads.

<Renames />

## Behaviour changes

What changes when a Map project keeps a name that did not change: a return type, an error that was silent and now throws, a callback that now runs under `pcall`, a wire format. Each section below is one step of the migration of the library; within it, each item names the member it concerns.

<BehaviourChanges />

## Typings changes

- **The package.** `war3-types-strict` (Patch 1.33.0) becomes `reforged-types`, a peer dependency of reforged-ts whose range is a caret on the version the library was released with, so the package manager warns when a major does not match. The Map project installs it and lists its entry in `types` (see [Install and tsconfig](#install-and-tsconfig)).
- **The Patch.** The declarations are generated from the Patch files of Game version 3.0.0, so the Natives, types and globals the game added after Patch 1.33.0 are declared. The compatibility matrix lists the Patch each release supports.
- **The AI Natives are opt-in.** `war3-types-strict/1.33.0` declared the Natives of `common.ai` with the others. They are valid only in AI scripts, so `reforged-types/3.0.0` leaves them out; add `reforged-types/3.0.0/common.ai` to `types` to declare them.
- **Nullability is a reviewed decision per Native.** A hand-curated Overlay, seeded with war3-types-strict's nullability decisions, says for every Native whether it can return nothing (`T | undefined`) and for each parameter whether it takes `undefined`. The generator fails on a Native without an entry, so every nullable type is a decision someone reviewed.
- **The hover says more.** Each Native shows its Jass types (`integer (32-bit)`, `real`), `@async` when its value is valid only for the local player, `@deprecated` with the reason, `@patch` for the Patch that added it, and a link to its reference page.

## What stays the same

- **The names.** `Unit`, `Timer`, `Trigger`, `Frame`, `MapPlayer` and the other Wrappers, and the Systems (`sync`, `host`, `file`, `binary`, `base64`, `gametime`), are imported from the package root as before. A symbol missing from the table above keeps its name; what changes under it is in the behaviour changes.
- **`tsGlobals.Players` keeps its shape**: one `MapPlayer` per slot, `Players[i]` for slot `i`, filled at the `globals` Init stage (see the behaviour changes).
- **`addScriptHook` still works.** It is the deprecated alias of the Init stages and keeps its timing for this release; its entry points are in the table with the stage that replaces each.
- **The Typings declare the Natives in the same shape**: Handle types as branded interfaces that mirror the Patch hierarchy, `T | undefined` for a Native that can return nothing, `Record<number, T>` for the Jass arrays, and `@noSelfInFile` with `this: void` callbacks, so typescript-to-lua emits plain Lua functions.
- **The build.** The package ships compiled Lua and its declarations, which typescript-to-lua resolves like any typescript-to-lua library.
- **With Dev mode off**, the default and every release build, the runtime Guards change nothing but one thing: a destroyed Handle no longer resolves to its dead Wrapper (see [Runtime Guards](#runtime-guards) above). [Desync safety and guards](../guides/desync-safety-and-guards.md) says what Dev mode adds.
