# create-reforged-map

## 1.0.0-alpha.0

### Major Changes

- [#666](https://github.com/phmilk/reforged-ts/pull/666) [`f2f79a6`](https://github.com/phmilk/reforged-ts/commit/f2f79a66867ec7b352e526b0d09d7cae7b55cbe3) Thanks [@phmilk](https://github.com/phmilk)! - First release of `create-reforged-map`, the Creation CLI: `npx create-reforged-map@next my-map` (or `pnpm create reforged-map@next my-map`) creates a Map project from the Template in one command. It downloads the Template at the line the release gate builds (`v1`), writes the project name and a description of the map into `package.json`, the README and `AGENTS.md`, initialises git, installs the dependencies, runs the Template's own `pnpm template:detach` to leave its maintenance files out, and makes a first commit. Every prompt has an option (`--name`, `--description`, `--yes`), so an Agent can run it without a terminal; `--skip-install` and `--skip-git` leave those stages out. It needs pnpm, and git unless skipped. Write `@next` until 1.0.0: npm keeps `latest` on the first alpha.
