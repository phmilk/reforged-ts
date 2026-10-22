# create-reforged-map

## 1.0.0-alpha.2

### Minor Changes

- [#699](https://github.com/phmilk/reforged-ts/pull/699) [`e3fd5aa`](https://github.com/phmilk/reforged-ts/commit/e3fd5aa526f9283fd471adadf9eb976a8632cf31) Thanks [@wyller](https://github.com/wyller)! - A new Map project's map folder is at its root and named after its package (ADR 0020): `create-reforged-map my-map` moves the Template's map folder, from its root or from under `maps/`, to `my-map.w3m` at the project root, removes `maps/` when that leaves it empty, and sets `mapFolder` in `reforged.config.ts` to it before the install. A scoped package names it after the part past its scope. The next steps name that folder to open in the World Editor. A Template with no map folder, several, or a `reforged.config.ts` without `mapFolder` stops the creation at the new stage "placing the map folder", with nothing left in the target ([#695](https://github.com/phmilk/reforged-ts/issues/695)).

## 1.0.0-alpha.1

### Patch Changes

- [#689](https://github.com/phmilk/reforged-ts/pull/689) [`5b69e36`](https://github.com/phmilk/reforged-ts/commit/5b69e360497577242f67270f0fec6b71ec273b40) Thanks [@phmilk](https://github.com/phmilk)! - Supported Patch: 3.0.1.24370, the library's minimum Patch. Its `reforged.patch` moves from 3.0.0.24268.

## 1.0.0-alpha.0

### Major Changes

- [#666](https://github.com/phmilk/reforged-ts/pull/666) [`f2f79a6`](https://github.com/phmilk/reforged-ts/commit/f2f79a66867ec7b352e526b0d09d7cae7b55cbe3) Thanks [@phmilk](https://github.com/phmilk)! - First release of `create-reforged-map`, the Creation CLI: `npx create-reforged-map@next my-map` (or `pnpm create reforged-map@next my-map`) creates a Map project from the Template in one command. It downloads the Template at the line the release gate builds (`v1`), writes the project name and a description of the map into `package.json`, the README and `AGENTS.md`, initialises git, installs the dependencies, runs the Template's own `pnpm template:detach` to leave its maintenance files out, and makes a first commit. Every prompt has an option (`--name`, `--description`, `--yes`), so an Agent can run it without a terminal; `--skip-install` and `--skip-git` leave those stages out. It needs pnpm, and git unless skipped. Write `@next` until 1.0.0: npm keeps `latest` on the first alpha.
