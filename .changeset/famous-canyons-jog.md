---
"reforged-map": minor
---

Add Object definitions to the build: a Map project declares objects in TypeScript under `src/objects/` with `defineUnit`, `defineItem`, `defineAbility`, `defineBuff`, `defineDestructable`, `defineDoodad` and `defineUpgrade` from the new entry `reforged-map/objects`, fields keyed by field id and typed from `reforged-builtins/fields`, and `mergeObjectDefinitions` merges them into the build's staged copy of the map folder. The definitions are transpiled with the Map project's own `typescript`, a new optional peer, and checked (Rawcode, base, fields) with errors naming the file, the Rawcode and the field, through the new `ObjectDefinitionsError`. A definition at a Rawcode the map folder already defines or changes is a collision until the Object manifest lands.
