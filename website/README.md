# reforged-ts-website

The docs site, on Docusaurus 3.10, served at https://phmilk.github.io/reforged-ts ([#40](https://github.com/phmilk/reforged-ts/issues/40), ADR 0005). A private workspace package: never published, never versioned ([the website](../docs/release.md#the-website)).

## Commands

From the workspace root:

| Command             | What it does                                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `pnpm docs:start`   | Collects, then serves the site with live reload at http://localhost:3000/reforged-ts/.                           |
| `pnpm docs:build`   | Collects, then builds the site into `website/build/`. Broken links fail it; broken anchors are warnings.         |
| `pnpm docs:check`   | The CI gate: `docs:build` with the strict configuration, where broken anchors fail too.                          |
| `pnpm docs:collect` | Copies the parts of the docs tree that come from elsewhere in the repository. Every other command runs it first. |

`pnpm check` does not build the site: `docs:check` is a CI step of its own, in the workflows of [#48](https://github.com/phmilk/reforged-ts/issues/48).

## Layout

- `docs/`: the docs tree, the "Next" version, served at `/docs/next`. One folder per section, ordered and labelled by its `_category_.json`; a section's `index` page is its link. `_landing.mdx` is the landing content, shown by the front page and by `docs/index.mdx`.
- `src/pages/index.mdx`: the front page, the only page outside the docs.
- `src/components/`: the components the pages import (`SupportedPatch` prints the Typings' `reforged.patch`, which the configuration reads at build time).
- `config.ts`: the configuration, built by `docusaurus.config.ts` and, strict, by `docusaurus.check.config.ts`.
- `scripts/`: the site's Node scripts (`.mts`), run from source by Node's type stripping and type-checked by `scripts/tsconfig.json`.
- `test/`: the scripts' tests, the `website` project of the root vitest configuration (`pnpm test`), on fixture repositories they write to a temporary folder.

## Collected pages

`docs:collect` writes the pages whose source of truth lives elsewhere in the repository: the Contributing section (the glossary from `CONTEXT.md`, one page per ADR, the agent conventions from `AGENTS.md`, and the how-tos from the packages' `AGENTS.md`, `CONTRIBUTING.md` and the `add-wrapper` Agent skill) and the Changelog section (one page per package's `CHANGELOG.md`, and an index linking their releases). Each gets front matter and a "generated from" note; its links to repository files point at the collected page when there is one, else at GitHub.

The list of sources is `scripts/sources.mts`, the source kinds are in `scripts/kinds.mts` and the collector itself is `scripts/collector.mts`. Collected files are git-ignored and rewritten at every run: edit their source, never the copy. A source that is missing fails the run, unless it declares why it may not exist yet (a changelog before the package's first release), in which case it is reported as skipped. To add a source, add its entry to the list and its outputs to the collected pages block of the root `.gitignore`; a test fails until you do.
