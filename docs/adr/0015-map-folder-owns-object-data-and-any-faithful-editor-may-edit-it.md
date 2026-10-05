---
status: accepted
date: 2026-10-05
---

# The map folder owns Object data, and any editor that round-trips it faithfully may edit it

ADR 0006 gave the World Editor sole ownership of Object data and deferred editing it from code to an optional package "with a correct object-data library". The research since then says what such editing has to live with. No JavaScript or TypeScript library writes 3.0.0 Object data correctly (#460). The World Editor never notices a change on disk and rewrites the whole map folder on every save, so another editor can only take turns with it (#461). HiveWE drops field ids it does not know and rewrites the folder too (#471). WurstScript regenerates its objects into a copy of the map on each build and keeps the World Editor's (#458).

The map folder stays the single source of truth for Object data. The World Editor, HiveWE and the Studio edit the same `war3map.w3*` files, their Skin files and `war3map.wts`, taking turns. ADR 0006's "the World Editor owns data" becomes "the map folder owns Object data": any editor that round-trips it faithfully may edit it. The rest of ADR 0006 stands: the Template owns code, and terrain and placed units stay the World Editor's.

`reforged-map` (ADR 0014) gains a writer next to its readers, one model of the map folder for both. Its contract is a byte-for-byte round trip: reading and writing a map saved by the 3.0 World Editor or by HiveWE gives the same bytes, with wc3libs' notes and fixtures (Apache-2.0) as the reference. It keeps the version and end markers it read and the Skin files apart. The package also ships a git `textconv` driver, so `git diff` shows Object data as text.

A Map project may declare Object definitions in TypeScript:

- They run in Node during Object sync and the build, never in the map's Lua. Each names its Rawcode explicitly; none comes from a counter in execution order. Their fields are typed from the game's metadata.
- An Object definition creates a Custom object, or changes a Built-in object that the map folder does not already change. Each object has one owner: an Object definition that names a Rawcode the map folder already defines or changes is a collision error, never a silent replacement.
- The build always merges the Object definitions into the map it writes to `dist/`, so a built map never depends on an Object sync having run.
- Object sync writes them into the map folder so the World Editor, HiveWE and the Studio show them before a build. It runs as a command, and in `pnpm dev` only when the Map project opts in. The Object manifest records which Rawcodes belong to the code and what the last Object sync wrote for each. With it, a sync replaces those objects, removes the ones the code dropped, and fails when one was changed outside the code, unless forced. Ownership lives in the Object manifest and never in a field of the object, which HiveWE would drop.

The Studio, a new package `reforged-studio`, is the Toolchain's local app for editing what code does not express well, one area per thing it edits. Its first area, Objects, creates, edits and deletes any object of the map folder:

- **Hosts.** It runs as a local page served by Node first, and later as a VS Code custom editor over the same UI.
- **Game data.** It reads field metadata, names and icons from the developer's own install, since ADR 0013 ships none of them.
- **Object definitions.** It shows them read-only, with their source file.
- **Taking turns with the World Editor.** The Studio reloads when the map folder changes on disk. After its own save, it asks the World Editor to reload with `-launch -loadfile`. It keeps the state before and after each save, so when a World Editor save puts back fields the Studio had changed, it offers to apply them again instead of losing them in silence.
- **The hover tool.** It links a Rawcode to the Studio, at `/objects/<rawcode>`.

## Considered options

- Object definitions written only into `dist/`, as WurstScript does. This is the safest, since a bug in the writer reaches only the build, but the World Editor and HiveWE never show those objects. It stays as the build's path, and Object sync adds the visibility.
- Object data moved into the Map project's own text files, with the map folder generated from them and the World Editor's edits imported back through a three-way merge. That gives a readable history, but two copies would have to be reconciled forever: a map edited only in the World Editor would need an import before every build, and a conflict would stop the build.
- An external editor that only reads, or that writes only the code's own objects. Neither replaces the Object Editor, which is what the Studio is for.
- Marking an object made by code with a field, as WurstScript's `wurs` does. HiveWE drops field ids it does not know (#471).
- A separate optional package for the writer, to the letter of ADR 0006. It would reuse `reforged-map`'s model and readers and follow the same Patches, so it would be two packages with one cycle.
- Opening the World Editor's Object Editor on a Rawcode. That works only through undocumented window messages, only on Windows, breaks across Patches and cannot confirm what it found (#461).
- One app per tool, so that a future frame designer is its own app. That means two VS Code hosts and a shared package to publish, where the Studio gets a second area instead.

## Consequences

- `reforged-map` writes as well as reads. Its writer ships with the round-trip tests and blocks Object sync and the Studio's save. The Studio's read-only views need only the readers.
- The monorepo gains a seventh package, `reforged-studio`. None of this gates 1.0.0. There are three specs in `phmilk/reforged-ts`: the writer, Object definitions with Object sync, and the Studio. Each comes with a Template issue: the `.gitattributes` for `textconv`, `src/objects/` and the sync script, and `pnpm studio`.
- What the World Editor does on save to Object data another tool wrote decides how Object sync detects a change made outside the code, by bytes or object by object (#475). That covers a literal name or a `TRIGSTR`, renumbered strings and whether an object it did not touch is rewritten. The Studio's layout and flows are prototyped first (#476).
- An object that only an Object definition creates shows in the World Editor's palette only after an Object sync and a reload, and placing it on the terrain then makes the map folder depend on the code.
- The Studio needs the game installed, as the Template's launch already does.

Decision record: https://github.com/phmilk/reforged-ts/issues/467
