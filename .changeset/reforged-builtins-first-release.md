---
"reforged-builtins": major
---

First release of `reforged-builtins`, the Built-in objects of Patch 3.0.0.24268 reduced to derived identifiers: Rawcode, Object kind, race, enUS name and the Game data sets that hold each object. Adding `reforged-builtins/3.0.0` to `types` next to the Typings' entry gives each `FourCC` literal of a Built-in object its kind, with no edit and no change to the emitted Lua: `FourCC("hfoo")` is a `Rawcode<"unit">`. Each Object kind has an entry point of constants named after the objects, such as `Units.Footman_hfoo` from `reforged-builtins/units`, each the same integer `FourCC` gives. `3.0.0/index.json` holds the index for tools. It needs `reforged-types` 1.0.0-alpha.5 or later as a peer, the first that declares the Rawcode types. Install it with `pnpm add -D reforged-builtins@next`.
