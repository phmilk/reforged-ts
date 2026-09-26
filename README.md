# reforged-ts workspace

The pnpm workspace of reforged-ts, a TypeScript API for Warcraft III custom maps compiled to Lua with [typescript-to-lua](https://typescripttolua.github.io/). Its Wrappers and Systems sit over the game's Natives, typed by Typings generated for one Patch, and a Map project installs it to write its map's code in TypeScript. It targets Warcraft III 3.0.0 and later, and began as a fork ([Attribution](#attribution)).

## Packages

| Package                                                     | What it is for                                                                                                                              |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| [`reforged-ts`](packages/reforged-ts)                       | The library: Wrappers and Systems over the game's Natives, compiled to Lua. What a Map project installs.                                    |
| [`reforged-types`](packages/reforged-types)                 | The Typings: TypeScript declarations for the Natives of one Patch, generated from the game's Patch files and the Overlay.                   |
| [`reforged-test`](packages/reforged-test)                   | The Lua test harness: runs tests compiled by typescript-to-lua on real Lua 5.3 with the Natives stubbed in Lua, and reports them to vitest. |
| [`eslint-plugin-reforged`](packages/eslint-plugin-reforged) | The lint layer of the Guards: type-aware ESLint rules that report the scripting pitfalls (desync, crash, leak) before the map compiles.     |

The library's own tests run on `reforged-test`, and the library compiles against `reforged-types/3.0.0`.

**Build phase.** Until 1.0.0, every version of the four packages is an alpha (`1.0.0-alpha.N`) published under the `next` dist-tag, so a Map project installs them with `@next` (`pnpm add reforged-ts@next reforged-types@next`). No alpha is published yet. Once the first one is, npm gives `latest` to it, so `latest` stays on `1.0.0-alpha.0` until 1.0.0 is published, and moves to 1.0.0 then. See [Pre mode and the `next` dist-tag](docs/release.md#pre-mode-and-the-next-dist-tag).

## Requirements

- Warcraft III 3.0.0 or later, the Game version the library targets. Only to play a map: building and testing the library runs without the game.
- Node 22.13 or later. Node 24 is the tested version (`.node-version`).
- pnpm 10. The `packageManager` field pins the exact version, so `corepack enable` picks it up.
- TypeScript 6.0.2, the version typescript-to-lua 1.37 pins. `pnpm install` brings it; see [Version policy](#version-policy).

## Getting started

A Map project starts from the Template, [`phmilk/reforged-ts-template`](https://github.com/phmilk/reforged-ts-template): a Warcraft III 3.0.0 map whose code lives in `src`, built into the map with `pnpm build` and opened in the game with `pnpm test:map`. The Template is under construction and private: its clone and its links below work only for its collaborators. No package is on npm yet either, so today a Map project installs the packages from a clone of this repository:

```sh
git clone https://github.com/phmilk/reforged-ts
git clone https://github.com/phmilk/reforged-ts-template my-map
cd my-map
pnpm use:local ../reforged-ts   # builds, packs and installs the four packages from the clone
# open maps/reforged-ts-template.w3m in the World Editor and save it once (the script language stays Lua)
pnpm test:map                   # builds the map and opens it in the game
```

The Template's README has [the full first run](https://github.com/phmilk/reforged-ts-template#first-run). Once the Template is public and flagged as a template repository, and the first alpha is on npm, the start becomes `gh repo create my-map --template phmilk/reforged-ts-template --clone`, then `pnpm install && pnpm test:map`: the roadmap ([#147](https://github.com/phmilk/reforged-ts/issues/147)) tracks the way there.

## Docs

The documentation site, https://phmilk.github.io/reforged-ts/, comes with [#40](https://github.com/phmilk/reforged-ts/issues/40) and is not live yet. Until it is:

- [`CONTEXT.md`](CONTEXT.md) defines the project's terms.
- Each package's README says what the package does and how to use it.
- The library's doc comments document each Wrapper and System, and the editor shows them on hover.
- The ADRs under [`docs/adr`](docs/adr) record the decisions, and [`docs/release.md`](docs/release.md) the release process.

## Commands

Run from the root after `pnpm install`:

| Command                 | What it does                                                                                                                                             |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm check`            | Runs `lint`, `typecheck`, `build` and `test`, in that order, and stops at the first failing stage. The finish condition.                                 |
| `pnpm lint`             | ESLint on every TypeScript file, then a Prettier check of the JSON, Markdown and YAML files.                                                             |
| `pnpm format`           | `eslint --fix` and `prettier --write` over the same files: lints and formats in one pass.                                                                |
| `pnpm typecheck`        | `tsc --noEmit` on each package's tsconfigs (the library and its tests, the harness glue and runner, the generator), then on `test/`.                     |
| `pnpm build`            | Builds every package, dependencies first: the library's Lua and declarations land in `packages/reforged-ts/dist`.                                        |
| `pnpm test`             | One vitest run over every package's projects and the root `test/` project (packs each publishable package and checks its tarball), then `typings:check`. |
| `pnpm typings:generate` | Regenerates the Typings from the vendored Patch files and the Overlay.                                                                                   |
| `pnpm typings:check`    | Fails when the committed Typings differ from what the generator produces (the drift check).                                                              |

`pnpm check` green is what done means, for a contributor and for an agent. A package's other scripts run from the root with `pnpm --filter <package> <script>`, for example `pnpm --filter reforged-types verify`.

### Why the harness builds on install

The library's tests import the harness by its package name: the runner from `reforged-test/lua` and the glue from `reforged-test`. Both resolve to build outputs (`lua/` and `dist/`), so lint and typecheck would fail on a fresh clone before `build` had run. `reforged-test` therefore has a `prepare` script that builds it, and pnpm runs a workspace package's `prepare` during `pnpm install`. After an install, `pnpm check` runs its stages in the order above. Run `pnpm install` again, or `pnpm --filter reforged-test build`, after changing the harness.

## Version policy

- TypeScript follows typescript-to-lua's peer dependency, which pins it exactly (6.0.2 for typescript-to-lua 1.37). TypeScript moves only when typescript-to-lua moves, and both move in one change.
- Every version shared between packages lives in the catalog in `pnpm-workspace.yaml`. A package references `catalog:`, never a literal version, so a bump is one line.

[ADR 0002](docs/adr/0002-toolchain-follows-tstl-and-tests-run-on-real-lua.md) records the decision.

## Line endings

`.gitattributes` stores and checks out every text file with LF, whatever `core.autocrlf` says. On a Windows clone made before that rule, run `git add --renormalize .` once, or the formatter reports every file as changed.

## Rules for library code

- **Cross-Wrapper references only inside method bodies, never at module top level.** Two Wrapper modules may import each other (`Force` calls `MapPlayer.fromEnum`, `MapPlayer` takes a `Force`), and typescript-to-lua compiles each import to a Lua `require`. A reference made while a module loads (a static field initialised from another Wrapper, a top-level call) can run before the other module has finished loading and fails at `require` time; a reference inside a method body runs after both have loaded. When one side of a pair uses the other only as a type, that side writes `import type`, so `import-x/no-cycle` runs with no exception.
- **A tolerated lint finding is disabled inline, on its line, naming the build step that clears it.** No rule is disabled in `eslint.config.mjs`, and a disable left behind after its fix fails lint.
- **A Wrapper follows the Handle base's rules**, written in the doc comment of `Handle` (`packages/reforged-ts/src/handles/handle.ts`): the naming rule, no public constructor, lookups through `fromHandle` and creation through the creation helper (creation throws, lookup returns `undefined`). A field set from a creation argument is filled through the creation helper's `init`, with no constructor; a Wrapper declares a protected constructor taking the Handle and calling `super(handle)` only for fields that need initialisers or other constructor work. A member whose Native allocates another Wrapper's Handle calls that Wrapper's protected `expect` (`Point.expect(GetUnitLoc(...))`). The exceptions to "lookups go through `fromHandle`" are the documented non-null path (`unit.getOwner()`, `MapPlayer.fromLocal()`, which assert an invariant through the protected `expectFound` and so throw the standard message without counting as creations) and `Frame`'s `fromHandle` override for handle id 0.

## For agents

[`AGENTS.md`](AGENTS.md) is the one document an agent reads first. Its seven sections are fixed: an overview, the commands to build and test, the layout of the repository, the rules, the runtime constraints of the game's Lua, the Agent skills (domain docs, issue tracker, triage labels and the skills themselves), and the definition of done. [`CONTEXT.md`](CONTEXT.md) is the project vocabulary (Native, Handle, Wrapper, System, Typings, Patch); use its terms.

## Contributing

Issues and specs live in this repository's [GitHub Issues](https://github.com/phmilk/reforged-ts/issues), the Template's in [its own tracker](https://github.com/phmilk/reforged-ts-template/issues); [#1](https://github.com/phmilk/reforged-ts/issues/1) maps the work toward the first release. The contribution guide, `CONTRIBUTING.md`, comes with [#48](https://github.com/phmilk/reforged-ts/issues/48). Until then, [`AGENTS.md`](AGENTS.md) describes how the repository is worked on, for people as for agents, and a green `pnpm check` is what done means.

## License

MIT. Each package carries its LICENSE, which keeps the upstream copyright line next to the fork's.

## Attribution

reforged-ts is a fork of [w3ts](https://github.com/cipherxof/w3ts) by TriggerHappy ([cipherxof](https://github.com/cipherxof)), released under the MIT license.
