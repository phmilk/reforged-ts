# create-reforged-map

## 1.0.0-alpha.3

### Patch Changes

- [#1072](https://github.com/phmilk/reforged-ts/pull/1072) [`488b0d9`](https://github.com/phmilk/reforged-ts/commit/488b0d995b3011fba236b8856d7bc5eae4695fee) Thanks [@phmilk](https://github.com/phmilk)! - The alphas are published under npm's `latest` dist-tag, so `pnpm add reforged-ts` and `npx create-reforged-map my-map` install the current alpha without `@next`, and `pnpm update` moves a Map project to it. Each README's install commands drop `@next`. The `next` dist-tag now carries only the betas of a major in preparation; until one exists, it stays on the last alpha it got.

- [#1075](https://github.com/phmilk/reforged-ts/pull/1075) [`b98c973`](https://github.com/phmilk/reforged-ts/commit/b98c973bafa33552bd0c10b81a01494066735ea5) Thanks [@phmilk](https://github.com/phmilk)! - `create-reforged-map` downloads the Template's `main` instead of the tag `v1`, so a new Map project gets every change merged into the Template, `pnpm studio` among them. A beta of the Creation CLI (`npx create-reforged-map@next`) downloads the Template's `next`.

## 1.0.0-alpha.2

### Minor Changes

- [#699](https://github.com/phmilk/reforged-ts/pull/699) [`e3fd5aa`](https://github.com/phmilk/reforged-ts/commit/e3fd5aa526f9283fd471adadf9eb976a8632cf31) Thanks [@wyller](https://github.com/wyller)! - A new Map project's map folder is at its root and named after its package (ADR 0020): `create-reforged-map my-map` moves the Template's map folder, from its root or from under `maps/`, to `my-map.w3m` at the project root, removes `maps/` when that leaves it empty, and sets `mapFolder` in `reforged.config.ts` to it before the install. A scoped package names it after the part past its scope. The next steps name that folder to open in the World Editor. A Template with no map folder, several, or a `reforged.config.ts` without `mapFolder` stops the creation at the new stage "placing the map folder", with nothing left in the target ([#695](https://github.com/phmilk/reforged-ts/issues/695)).

## 1.0.0-alpha.1

### Patch Changes

- [#689](https://github.com/phmilk/reforged-ts/pull/689) [`5b69e36`](https://github.com/phmilk/reforged-ts/commit/5b69e360497577242f67270f0fec6b71ec273b40) Thanks [@phmilk](https://github.com/phmilk)! - Supported Patch: 3.0.1.24370, the library's minimum Patch. Its `reforged.patch` moves from 3.0.0.24268.

## 1.0.0-alpha.0

### Major Changes

- [#666](https://github.com/phmilk/reforged-ts/pull/666) [`f2f79a6`](https://github.com/phmilk/reforged-ts/commit/f2f79a66867ec7b352e526b0d09d7cae7b55cbe3) Thanks [@phmilk](https://github.com/phmilk)! - First release of `create-reforged-map`, the Creation CLI: `npx create-reforged-map@next my-map` (or `pnpm create reforged-map@next my-map`) creates a Map project from the Template in one command. It downloads the Template at the line the release gate builds (`v1`), writes the project name and a description of the map into `package.json`, the README and `AGENTS.md`, initialises git, installs the dependencies, runs the Template's own `pnpm template:detach` to leave its maintenance files out, and makes a first commit. Every prompt has an option (`--name`, `--description`, `--yes`), so an Agent can run it without a terminal; `--skip-install` and `--skip-git` leave those stages out. It needs pnpm, and git unless skipped. Write `@next` until 1.0.0: npm keeps `latest` on the first alpha.
