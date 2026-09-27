# reforged-ts-website

The docs site, on Docusaurus 3.10, served at https://phmilk.github.io/reforged-ts ([#40](https://github.com/phmilk/reforged-ts/issues/40), ADR 0005). A private workspace package: never published, never versioned ([the website](../docs/release.md#the-website)).

## Commands

From the workspace root:

| Command                     | What it does                                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm docs:start`           | Collects, then serves the site with live reload at http://localhost:3000/reforged-ts/.                                               |
| `pnpm docs:build`           | Collects, then builds the site into `website/build/`. Broken links fail it; broken anchors are warnings.                             |
| `pnpm docs:check`           | The CI gate: `docs:build` with the strict configuration, where broken anchors fail too.                                              |
| `pnpm docs:collect`         | Copies the parts of the docs tree that come from elsewhere in the repository. The commands above it and `docs:version` run it first. |
| `pnpm docs:version <label>` | Cuts the docs version of a library release, labelled by its `major.minor` (`1.0`), then prunes. See [Docs versions](#docs-versions). |
| `pnpm docs:prune`           | Applies the retention rule alone: the last three minors of each major stay.                                                          |

`pnpm check` does not build the site: `docs:check` is a CI step of its own, in the workflows of [#48](https://github.com/phmilk/reforged-ts/issues/48).

Every build generates the API reference first, with TypeDoc, from the library's sources and from the Typings of each Game version `reforged-types` ships: no package needs to be built for it. The Typings' reference is a page per entry of a Game version's manifest (its functions, Blizzard.j functions and globals), about 5,700 per Game version, and most of the build's time: `docs:check` takes about 90 s on Windows, against 10 s without it. TypeDoc's validation warnings (an undocumented member, a broken `{@link}`) are printed and the build goes on; they fail `docs:check` once `STRICT_REFERENCE` in `config.ts` is on, which build step 8 ([#43](https://github.com/phmilk/reforged-ts/issues/43)) does when every member is documented. TypeDoc's errors always fail the build.

## Layout

- `docs/`: the docs tree, the "Next" version, served at `/docs/next`. One folder per section, ordered and labelled by its `_category_.json`; a section's `index` page is its link. `_landing.mdx` is the landing content, shown by the front page and by `docs/index.mdx`.
- `src/pages/index.mdx`: the front page, the only page outside the docs.
- `src/components/`: the components the pages import (`MatrixLink`, the compatibility matrix's links, which leaves a docs version the site no longer keeps as text).
- `versioning.ts`: the docs versions as the site serves them, from `versions.json`; `versions.json`, `versioned_docs/` and `versioned_sidebars/` are what `docs:version` writes, committed.
- `config.ts`: the configuration, built by `docusaurus.config.ts` and, strict, by `docusaurus.check.config.ts`.
- `reference.ts`: the API reference, one docusaurus-plugin-typedoc instance per entry of `siteReferences()` (the library: `docs/api/reforged-ts/`; the Typings: `docs/api/typings/<Game version>/`, one per folder of `reforged-types` with a `manifest.json`; all git-ignored, rewritten at every build), and the sidebar generator that puts the sidebar each one writes under its section. A Typings reference is its index page alone in the sidebar: a sidebar of its thousands of pages would be rendered into each of them. Each Game version's TypeDoc run compiles its Jass files with a tsconfig written to `node_modules/.cache/typings-reference/`.
- `typedoc/`: the site's TypeDoc plugin, which every reference instance loads from source (TypeDoc imports it inside the Docusaurus process, where only Node's own type stripping runs it, without a flag from Node 22.18 on: the package's `engines` floor): the validation gate, the custom tags of `typedoc/tsdoc.json` when the library has no `tsdoc.json` of its own yet, and, for the Typings, their Jass files merged into one page set and the check that every entry of the manifest has its page. `typedoc/typings.mts` routes an entry to its page from its name and kind alone (`functions/<Name>` for the manifest kinds `native` and `function`, `variables/<Name>` for `global`): the `@native` links are built from it.
- `scripts/`: the site's Node scripts (`.mts`), run from source by Node's type stripping and type-checked by `scripts/tsconfig.json`.
- `test/`: the site's tests, the `website` project of the root vitest configuration (`pnpm test`): the scripts' tests on fixture repositories they write to a temporary folder, under `test/reference/` the reference tests (their own `tsconfig.json`, the site's compiler options) on the fixture library and the fixture Game version of the Typings in `test/reference/fixtures/`, and under `test/site/` the tests of the site's configuration with what the collector writes (their own `tsconfig.json`, the same options): every lint rule's `meta.docs.url`, from the plugin's sources, is the route of a collected page.

## Collected pages

`docs:collect` writes the pages whose source of truth lives elsewhere in the repository: the Lint rules guide (one page per rule of the lint plugin's recommended config, from the page the plugin ships in `packages/eslint-plugin-reforged/docs/`, at the URL of the rule's `meta.docs.url`, and an index listing each rule with its summary; a rule without a page or a page without a rule fails the run), the Contributing section (the glossary from `CONTEXT.md`, one page per ADR, the agent conventions from `AGENTS.md`, and the how-tos from the packages' `AGENTS.md`, `CONTRIBUTING.md` and the `add-wrapper` Agent skill) and the Changelog section (one page per package's `CHANGELOG.md`, and an index linking their releases). Each gets front matter and a "generated from" note; its links to repository files point at the collected page when there is one, or at the page itself for a page of the docs tree, else at GitHub.

The list of sources is `scripts/sources.mts`, the source kinds are in `scripts/kinds.mts` and the collector itself is `scripts/collector.mts`. Collected files are git-ignored and rewritten at every run: edit their source, never the copy. A source that is missing fails the run, unless it declares why it may not exist yet (a changelog before the package's first release), in which case it is reported as skipped. To add a source, add its entry to the list and its outputs to the collected pages block of the root `.gitignore`; a test fails until you do. Each run deletes a source's outputs whole before writing them, so a folder output holds nothing hand-written: a source that writes next to hand-written pages owns single files or a subfolder of its own.

The landing page states the Patch the Typings support from `docs/_supported-patch.json`, which docs:collect writes from their `reforged.patch` field: in the docs tree, a cut freezes it, and each docs version states the Patch it was cut with.

## Docs versions

The docs tree is "Next", served at `/docs/next`. One docs version is cut per library minor or major release, labelled by the library's `major.minor` (`1.0`, also for 1.0.3), with `pnpm docs:version <label>`, the only way a version is created: it runs docs:collect, then Docusaurus' own `docs:version`, whose loading of the site regenerates both API references before it copies the docs tree, so the guides, the collected pages and the references are frozen together into `versioned_docs/version-<label>/`, with the sidebars in `versioned_sidebars/` and the label first in `versions.json`. It refuses a label that is not `major.minor`, a version cut already and one the retention rule would remove at once. It needs what a build needs.

Then it prunes: the site keeps the last three minors of each major, and removes the frozen docs and sidebars of the others and their line in `versions.json`, which it writes newest first. `pnpm docs:prune` applies the same rule alone. The version cut's pull request ([#48](https://github.com/phmilk/reforged-ts/issues/48)) commits the three paths, removals included.

Before the first cut the site serves Next alone; the version dropdown appears with the first cut, and the newest version is the default. Every cut version is served at `/docs/<label>`, the newest too, so a page keeps its URL when a newer version is cut and the compatibility matrix's docs links, which name the label, answer. The newest version's pages also answer without the label (`/docs/guides`), through a redirect written at build time (none for the Typings' entry pages). The compatibility page links a release's docs version while the site keeps it, and shows the label as text once it is pruned.

Each kept version carries its own copy of the Typings' reference, about 5,900 pages: count about 80 s of build per kept version.
