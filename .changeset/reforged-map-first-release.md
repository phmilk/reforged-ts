---
"reforged-map": major
---

First release of `reforged-map`, which reads a Map project's map folder at build time. `generateEditorGlobals(mapFolder)` returns the declarations and the Lua stub of its Editor globals, each `gg_` and `udg_` global the World Editor declares, with the warnings for the author; a missing map folder or `war3map.lua` throws a `MapFolderError`. A `udg_` variable of an object type is declared with the Object kind its Variable Editor type names, read from `war3map.wtg`: a Unit-Type is a `Rawcode<"unit">`, a Tech-Type a `Rawcode<"unit" | "upgrade">`, an array a `Record<number, Rawcode<…>>`, and an Order stays `number`. It needs `reforged-types` 1.0.0-alpha.5 or later as a peer, the first that declares the Rawcode types. Install it with `pnpm add -D reforged-map@next`; the Template calls it from its build once it takes the package up.
