---
"reforged-map": minor
---

`reforged-map/typescript-plugin`, a TypeScript language service plugin ([#595](https://github.com/phmilk/reforged-ts/issues/595)): on a Rawcode literal, `FourCC("h000")` or `1751543663 as Rawcode<"unit">`, the hover shows the object it names (its name, Object kind, origin, base or the map's name, race, Game data sets and constant), both objects of a Rawcode two kinds share, or the lint rule's sentence for an unknown, malformed or out-of-Game-data-set Rawcode; go to definition goes to the object's constant. It reads the map folder through the Rawcode lookup, follows a World Editor save without a build, finds the map folder under `maps/` or from its `mapFolder` option, and says in one line why when it cannot. Enable it with `"plugins": [{ "name": "reforged-map/typescript-plugin" }]` in the tsconfig's `compilerOptions`, under the Map project's own TypeScript.
