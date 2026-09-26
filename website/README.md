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

`pnpm check` does not build the site: CI runs `docs:check` as its own step.

## Layout

- `docs/`: the docs tree, the "Next" version, served at `/docs/next`. One folder per section, ordered and labelled by its `_category_.json`; a section's `index` page is its link. `_landing.mdx` is the landing content, shown by the front page and by `docs/index.mdx`.
- `src/pages/index.mdx`: the front page, the only page outside the docs.
- `src/components/`: the components the pages import (`SupportedPatch` prints the Typings' `reforged.patch`, which the configuration reads at build time).
- `config.ts`: the configuration, built by `docusaurus.config.ts` and, strict, by `docusaurus.check.config.ts`.
- `scripts/`: the site's Node scripts (`.mts`), run from source by Node's type stripping and type-checked by `scripts/tsconfig.json`.
