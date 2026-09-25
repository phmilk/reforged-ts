# reforged-types

TypeScript declarations for the Natives of Warcraft III Reforged, generated from the game's own Patch files, for map scripts compiled to Lua with [typescript-to-lua](https://typescripttolua.github.io/).

**Supported Patch: 3.0.0.24268** (Game version 3.0.0). The `reforged.patch` field of `package.json` carries the same Build.

<!-- Placeholder link: the docs site (#40) replaces it with the llms.txt of this version. -->

**For AI agents:** the documentation of this version, as one plain-text file for a language model, is [llms.txt](https://phmilk.github.io/reforged-ts/llms.txt).

## Usage

```sh
npm install --save-dev reforged-types
```

Add the entry of your Game version to `types` in `tsconfig.json`, next to the typescript-to-lua language extensions:

```json
{
  "compilerOptions": {
    "types": ["@typescript-to-lua/language-extensions", "reforged-types/3.0.0"]
  }
}
```

That one line declares every `common.j` Native, type and global, the `Blizzard.j` functions and globals, the Lua runtime globals the game adds (`FourCC`, `__jarray`) and the Lua 5.3 standard library (through `lua-types`, a dependency of this package).

The AI Natives of `common.ai` are valid only in AI scripts, so the entry leaves them out. To opt in, add their file as well:

```json
"types": ["@typescript-to-lua/language-extensions", "reforged-types/3.0.0", "reforged-types/3.0.0/common.ai"]
```

What the declarations give you:

- Handle types are branded interfaces that mirror the Patch hierarchy (`framehandle extends agent`), so a `timer` passed where a `unit` is expected is a compile error.
- A Native that can return nothing returns `T | undefined`; one the game guarantees returns `T`.
- Callbacks are typed with `this: void` and every file is `@noSelfInFile`, so typescript-to-lua emits plain Lua functions.
- Jass arrays (`bj_*` array globals) are `Record<number, T>`, indexed from 0 as in Jass.
- Each Native's hover shows its Jass types (`integer (32-bit)`, `real`), `@async` when its value is valid only for the local player, `@deprecated` with the reason, `@patch` for the Patch that added it, and a link to its reference page.

`async-natives.json` lists the Natives marked `@async`, for lint rules that read the same facts.

## The Overlay

The Patch files give names, parameters and types, but not whether a Native can return nothing, which Natives are async, or what is deprecated. The Overlay holds those facts: one hand-curated JSON file per Native and global (nullability of the return and of each parameter, async, deprecation, notes, the Patch that added it), kept in the [repository](https://github.com/phmilk/reforged-ts/tree/master/packages/reforged-types/overlay). The generator merges it with the Patch files and fails on any declaration without an entry, so every nullable type in these Typings is a reviewed decision. To correct one, change that Native's Overlay file in a pull request.

## Attribution

The Overlay was seeded with the nullability decisions of [war3-types-strict](https://github.com/TinkerWorX/war3-types-strict), used under its MIT license:

```text
MIT License

Copyright (c) 2021 Nikolaj Mariager

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

The Patch files are taken from [jass-history](https://github.com/Luashine/jass-history); the provenance file of each vendored Patch records the tag, commit and sha256 of every file.

## Legal position

The Typings are derived from Blizzard's Patch files, which the repository vendors as every community mirror does: Blizzard's EULA grants no right to redistribute them, and no enforcement against such mirrors has been found.

## Regenerating

From a clone of the repository, `pnpm --filter reforged-types typings:generate <jass-history tag>` vendors a Patch and regenerates; without a tag it regenerates from the vendored Patch files. The loop for a new Patch is in [`AGENTS.md`](https://github.com/phmilk/reforged-ts/blob/master/packages/reforged-types/AGENTS.md).

## License

MIT. See [LICENSE](./LICENSE).
