# reforged-ts

TypeScript Wrappers and Systems over the Lua API of Warcraft III Reforged, for custom maps compiled to Lua with [typescript-to-lua](https://typescripttolua.github.io/). A Wrapper owns one Handle and exposes its Natives as typed members (`Unit`, `Timer`, `Frame`); a System is a utility that owns no Handle (`sync`, `file`, `base64`).

A fork of [cipherxof/w3ts](https://github.com/cipherxof/w3ts) targeting Warcraft III 3.0.0 and later. The [w3ts documentation](https://cipherxof.github.io/w3ts/) describes the upstream API this fork started from.

**Supported Patch: 3.0.0.24268** (Game version 3.0.0). The `reforged.patch` field of `package.json` carries the same Build.

## Status

Alpha. The 1.0.0 line is under construction: expect API changes until the migration steps to the 3.0.0 API land.

## Install

```sh
npm install reforged-ts reforged-types
```

or `pnpm add reforged-ts reforged-types`. `reforged-types` is a peer dependency: it holds the Typings of the game's Natives.

Add the typescript-to-lua language extensions and the Typings of your Game version to `types` in the Map project's `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["@typescript-to-lua/language-extensions", "reforged-types/3.0.0"]
  }
}
```

The package ships the compiled Lua and its declarations under `dist`. typescript-to-lua resolves it by `main`, like any typescript-to-lua library.

## Tests

Tests are optional. [`reforged-test`](https://github.com/phmilk/reforged-ts/tree/master/packages/reforged-test), an optional peer dependency, runs tests compiled by typescript-to-lua on real Lua 5.3 with the Natives stubbed in Lua, and reports them to vitest. A Map project that does not test needs nothing from it.

## License

MIT. See [LICENSE](./LICENSE), which keeps the upstream copyright line next to the fork's.
