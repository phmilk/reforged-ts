---
"reforged-map": minor
---

Add `openRawcodeLookup({ mapFolder, projectRoot })`, a synchronous lookup from a Rawcode to what it names, for the tools that read the map (the lint rule, the hover): known with its object or objects (Built-in, Custom or modified, with name, Object kind, race, base, Game data sets and constant), unknown with up to three suggestions one edit away, malformed, or unavailable with the reason. `gameVersion()` gives the Game version of the `reforged-builtins` index it read. It loads with `require` from a CommonJS host.
