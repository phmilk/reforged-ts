# reforged-map

## 1.0.0-alpha.0

### Major Changes

- [#504](https://github.com/phmilk/reforged-ts/pull/504) [`84adfb0`](https://github.com/phmilk/reforged-ts/commit/84adfb02694952dde50ec4b9cb721698fa647e72) Thanks [@wyller](https://github.com/wyller)! - First release of `reforged-map`, which reads a Map project's map folder at build time. `generateEditorGlobals(mapFolder)` returns the declarations and the Lua stub of its Editor globals, each `gg_` and `udg_` global the World Editor declares, with the warnings for the author; a missing map folder or `war3map.lua` throws a `MapFolderError`. A `udg_` variable whose Variable Editor type names an Object kind is declared with that Object kind, read from `war3map.wtg`: a Unit-Type is a `Rawcode<"unit">`, a Tech-Type a `Rawcode<"unit" | "upgrade">`, an array a `Record<number, Rawcode<…>>`, and an Order stays `number`. It needs `reforged-types` 1.0.0-alpha.5 or later as a peer, the first that declares the Rawcode types. Install it with `pnpm add -D reforged-map@next`; the Template calls it from its build once it takes the package up.

### Patch Changes

- Updated dependencies [[`3c4b9cd`](https://github.com/phmilk/reforged-ts/commit/3c4b9cd4c7df69c01981bd1f0d4c1b7c9c87b994), [`8d693fc`](https://github.com/phmilk/reforged-ts/commit/8d693fc2f14f4e110f963085920de26be52e50de), [`3c4b9cd`](https://github.com/phmilk/reforged-ts/commit/3c4b9cd4c7df69c01981bd1f0d4c1b7c9c87b994)]:
  - reforged-types@1.0.0-alpha.5
