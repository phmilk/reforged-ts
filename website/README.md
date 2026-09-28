# reforged-ts-website

The docs site, on Docusaurus 3.10, served at https://phmilk.github.io/reforged-ts ([#40](https://github.com/phmilk/reforged-ts/issues/40), ADR 0005). A private workspace package: never published, never versioned ([the website](../docs/release.md#the-website)).

## Commands

From the workspace root:

| Command                     | What it does                                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm docs:start`           | Collects, then serves the site with live reload at http://localhost:3000/reforged-ts/.                                               |
| `pnpm docs:build`           | Collects, then builds the site into `website/build/`. Broken links fail it; broken anchors are warnings.                             |
| `pnpm docs:check`           | The CI gate: `docs:build` with the strict configuration, where broken anchors fail too.                                              |
| `pnpm docs:audit`           | Lists what the library's doc comments lack, per file, without the build. See [The docs audit](#the-docs-audit).                      |
| `pnpm docs:collect`         | Copies the parts of the docs tree that come from elsewhere in the repository. The commands above it and `docs:version` run it first. |
| `pnpm docs:version <label>` | Cuts the docs version of a library release, labelled by its `major.minor` (`1.0`), then prunes. See [Docs versions](#docs-versions). |
| `pnpm docs:prune`           | Applies the retention rule alone: the last three minors of each major stay.                                                          |

`pnpm check` does not build the site, but runs `docs:audit`: `docs:check` is a CI step of its own, in the workflows of [#48](https://github.com/phmilk/reforged-ts/issues/48).

Build the packages first (`pnpm build`): `docs:collect` checks the rename map against the library's built declarations, `packages/reforged-ts/dist/index.d.ts`, and fails without them.

Every build generates the API reference first, with TypeDoc, from the library's sources and from the Typings of each Game version `reforged-types` ships: no package needs to be built for it. The Typings' reference is a page per entry of a Game version's manifest (its functions, Blizzard.j functions and globals), about 5,700 per Game version, and most of the build's time: `docs:check` takes about 90 s on Windows, against 10 s without it. TypeDoc's validation warnings (an undocumented member, a broken `{@link}`) are printed and the build goes on; they fail `docs:check` once `STRICT_REFERENCE` in `config.ts` is on, which build step 8 ([#43](https://github.com/phmilk/reforged-ts/issues/43)) does when every member is documented. TypeDoc's errors always fail the build.

## Layout

- `docs/`: the docs tree, the "Next" version, served at `/docs/next`. One folder per section, ordered and labelled by its `_category_.json`; a section's `index` page is its link. `_landing.mdx` is the landing content, shown by the front page and by `docs/index.mdx`.
- `src/pages/index.mdx`: the front page, the only page outside the docs.
- `src/components/`: the components the pages import (`MatrixLink`, the compatibility matrix's links, which leaves a docs version the site no longer keeps as text).
- `versioning.ts`: the docs versions as the site serves them, from `versions.json`; `versions.json`, `versioned_docs/` and `versioned_sidebars/` are what `docs:version` writes, committed.
- `llms.ts`: the files for AI agents, `llms.txt` and `llms-full.txt` per docs version and a Markdown copy of each page ([Search and LLM files](#search-and-llm-files)).
- `config.ts`: the configuration, built by `docusaurus.config.ts` and, strict, by `docusaurus.check.config.ts`.
- `reference.ts`: the API reference, one docusaurus-plugin-typedoc instance per entry of `siteReferences()` (the library: `docs/api/reforged-ts/`; the Typings: `typings/<Game version>/`, one per folder of `reforged-types` with a `manifest.json`; all git-ignored, rewritten at every build), the docs tree's sidebar generator, which puts the library's sidebar under the API section followed by a link to the Typings, and the Typings' own. The Typings are a docs instance of their own (id `typings`, folder `typings/`, whose `index.mdx` is committed), not versioned: served at `/typings`, a Game version's reference at `/typings/<Game version>/overview` (a route ending in `3.0.0` would be taken for a file by a static server) and an entry's page at `/typings/<Game version>/functions/<Name>` or `/typings/<Game version>/variables/<Name>`, whatever the docs version. A Game version's reference is its index page alone in the sidebar: a sidebar of its thousands of pages would be rendered into each of them. Each Game version's TypeDoc run compiles its Jass files with a tsconfig written to `node_modules/.cache/typings-reference/`.
- `audit.ts`: `docs:audit`, the library's reference run as an audit ([The docs audit](#the-docs-audit)).
- `typedoc/`: the site's TypeDoc plugin, which every reference instance loads from source (TypeDoc imports it inside the Docusaurus process, where only Node's own type stripping runs it, without a flag from Node 22.18 on: the package's `engines` floor): the validation gate, the custom tags of `typedoc/tsdoc.json` when the library has no `tsdoc.json` of its own yet, and, for the Typings, their Jass files merged into one page set and the check that every entry of the manifest has its page, and, for the library, each `@native` tag as a link to the Native's page in the Typings of the newest Game version and to jassbot (`JASSBOT` in `reference.ts`), a tag naming no entry of that manifest failing the build. `typedoc/typings.mts` holds the Typings' routes, the one source of them: the instance's route base path, a Game version's route, its index page's slug, and an entry's page from its name and kind alone (`functions/<Name>` for the manifest kinds `native` and `function`, `variables/<Name>` for `global`): the `@native` links are built from it.
- `scripts/`: the site's Node scripts (`.mts`), run from source by Node's type stripping and type-checked by `scripts/tsconfig.json`.
- `test/`: the site's tests, the `website` project of the root vitest configuration (`pnpm test`): the scripts' tests on fixture repositories they write to a temporary folder, under `test/reference/` the reference tests (their own `tsconfig.json`, the site's compiler options) on the fixture library and the fixture Game version of the Typings in `test/reference/fixtures/`, and under `test/site/` the tests of the site's configuration with what the collector writes (their own `tsconfig.json`, the same options): every lint rule's `meta.docs.url`, from the plugin's sources, is the route of a collected page.

## The docs audit

`pnpm docs:audit` (`audit.ts`, [#43](https://github.com/phmilk/reforged-ts/issues/43)) lists what the library's doc comments still lack, so the documentation pass goes file by file. It runs TypeDoc on the library with the options of its reference (`referencePluginOptions`, the site's TypeDoc plugin included, so a `@native` naming no Native fails it as it fails the build) and writes no page, then ESLint with the docs configuration, `eslint.docs.config.mjs` at the root, on `packages/reforged-ts/src`. It prints each file, largest first, with its findings: `undocumented`, TypeDoc's `notDocumented` (the warnings `docs:check` logs for the library); `typedoc`, TypeDoc's other warnings (an unresolved `{@link}`, a type referenced but not exported), under the file they name or under `(no file)`; `lint`, the rule and its message at a line. Then the total.

- `pnpm docs:audit handles/unit.ts`: the files whose path ends with an argument, the total counting them alone.
- `pnpm docs:audit --summary`: the counts per file, without the findings.
- `pnpm docs:audit --strict`: exit code 1 on any finding (of the files kept). Without it, 0: the gates are at warn until the gate switch turns `--strict` on. A TypeDoc error fails either way.

It runs in `pnpm check` and on both CI legs, in about 10 s; `docs:check` runs on ubuntu alone. Node runs it from source; it sits next to `reference.ts`, whose compiler options it shares.

## Collected pages

`docs:collect` writes the pages whose source of truth lives elsewhere in the repository: the Lint rules guide (one page per rule of the lint plugin's recommended config, from the page the plugin ships in `packages/eslint-plugin-reforged/docs/`, at the URL of the rule's `meta.docs.url`, and an index listing each rule with its summary; a rule without a page or a page without a rule fails the run), the Contributing section (the glossary from `CONTEXT.md`, one page per ADR, the agent conventions from `AGENTS.md`, and the how-tos from the packages' `AGENTS.md`, `CONTRIBUTING.md` and the `add-wrapper` Agent skill) the Changelog section (one page per package's `CHANGELOG.md`, and an index linking their releases), and the generated sections of the Migration section's hand-written pages. Each gets front matter and a "generated from" note; its links to repository files point at the collected page when there is one, or at the page itself for a page of the docs tree, else at GitHub.

The list of sources is `scripts/sources.mts`, the source kinds are in `scripts/kinds.mts` (the migration guide's in `scripts/migration.mts`) and the collector itself is `scripts/collector.mts`. Collected files are git-ignored and rewritten at every run: edit their source, never the copy. A source that is missing fails the run, unless it declares why it may not exist yet (a changelog before the package's first release), in which case it is reported as skipped. To add a source, add its entry to the list and its outputs to the collected pages block of the root `.gitignore`; a test fails until you do. Each run deletes a source's outputs whole before writing them, so a folder output holds nothing hand-written: a source that writes next to hand-written pages owns single files or a subfolder of its own.

The landing page states the Patch the Typings support with `docs/_supported-patch.md`, a partial docs:collect writes from their `reforged.patch` field (a partial, not data, so the page's Markdown copy for AI agents states it too): in the docs tree, a cut freezes it, and each docs version states the Patch it was cut with.

## Migration pages

The Migration section holds one hand-written page per version pair of the library's rename map (`packages/reforged-ts/migration/renames.json`), at the path the release gate expects: `docs/migration/<from>-to-<to>.md`, `w3ts-3-to-reforged-ts-1.md` for w3ts 3.x to reforged-ts 1.0 ([the major-changeset gate](../docs/release.md#the-major-changeset-gate)). The page is written in the structure of [#14](https://github.com/phmilk/reforged-ts/issues/14) and imports the two sections `docs:collect` writes for its pair under `docs/migration/_generated/<page name>/`, git-ignored:

- `renames.md`: the old-to-new table of every entry of the pair (old, new or "removed", kind, note), or the note of the pair's no-renames marker;
- `behaviour-changes.md`: the sections of the library's `migration/behaviour-changes.md`, a heading level down, for the pair `scripts/sources.mts` gives it.

```md
import Renames from "./_generated/w3ts-3-to-reforged-ts-1/renames.md";

<Renames />
```

A partial is MDX whatever its name, and Docusaurus rejects a partial's front matter (an error under `CI`), so the collector writes none and escapes the `{`, `}` and `<` of the sections' prose. It reads the map through the release package's rename map module and stops with the offending entry when the map does not match its schema, a replacement is not exported by the library's built declarations, a pair has no page, or a page (any `.md` or `.mdx` of the folder but `index` and `_`-prefixed files) has no entry and no no-renames marker in the map. A new major adds its page, and its behaviour changes note to the migration guide's entry in `scripts/sources.mts`.

## Search and LLM files

The search is `@easyops-cn/docusaurus-search-local`, offline, over the docs only: each docs version has its own index, and the search bar loads the one of the version being read, so a result never leads to another version (the newest version's index at the build root, the others' under `docs/<version>/`). The Typings, not versioned, are indexed once, apart (`search-index-typings.json`): their pages search their own index, and a docs version's search does not load it, about 16 MB.

`llms.ts` writes the files for AI agents with docusaurus-plugin-llms, once per docs version and once for the Typings:

- `/docs/<version>/llms.txt`: the version's pages, one link per page to its Markdown copy, `/docs/<version>/<page>.md` (the version's first page: `/docs/<version>.md`); `<version>` is `next` or a cut version's label.
- `/docs/<version>/llms-full.txt`: every page of the version in one file.
- `/typings/llms.txt`, `/typings/llms-full.txt` and `/typings/<Game version>/functions/<Name>.md`: the same for the Typings.

The plugin's own versions mode places the files and their links for versions at the site root, not under `baseUrl` and `/docs`, so `llms.ts` runs it once per version with that version's routes alone, then checks what it wrote: both files, and a Markdown copy of a page of the version behind each link, else the build fails (the plugin itself only logs its errors). It copies the partials a page imports into the page; an MDX comment is removed, and a JSX expression would be copied as written, so a partial states its facts as Markdown (the supported Patch). The four package READMEs link the `llms.txt` of their docs version, which the release stamps ([the docs version stamp](../docs/release.md#the-version-step-releaseversion)).

## Code samples

Every TypeScript fence (` ```ts `) of a hand-written page is a Map project snippet, type-checked against the library's built declarations, the Typings and `reforged-test/lua` by `test/snippets.test.mts` (`pnpm test`, after `pnpm build`), with the Template's compiler options. The checker is `scripts/snippets.mts`; it reads every `.md` and `.mdx` of `docs/` except the collected pages (the outputs of `scripts/sources.mts`) and the `api` section. A failure names the page, line and column of the error.

- Each page is a Map project of its own. A fence with a title is the file at that path, so the fences of one page import each other (` ```ts title="src/score.ts" `, then `import { kills } from "../../src/score"` in ` ```ts title="tests/lua/score.test.ts" `); a fence without one is a module of its own under `src/`. The Template's `src/generated/env.ts` (`devMode`) and `tests/lua/stubs.d.ts` (`__stub_fire_trigger`, `__stub_fire_timer`, `__stub_format`) are there on every page.
- A fence that is prose only (a partial statement, a signature, the old API on a migration page) says so with `fragment` in its meta: ` ```ts fragment `. Prefer a complete snippet: import what it uses, declare what it assumes.
- `// @ts-expect-error` shows code that must not compile, and fails the check if it does.

## Docs versions

The docs tree is "Next", served at `/docs/next`. One docs version is cut per library minor or major release, labelled by the library's `major.minor` (`1.0`, also for 1.0.3), with `pnpm docs:version <label>`, the only way a version is created: it runs docs:collect, then Docusaurus' own `docs:version`, whose loading of the site regenerates both API references before it copies the docs tree, so the guides, the collected pages and the library's reference are frozen together into `versioned_docs/version-<label>/`, with the sidebars in `versioned_sidebars/` and the label first in `versions.json`. It refuses a label that is not `major.minor`, a version cut already and one the retention rule would remove at once. It needs what a build needs.

Then it prunes: the site keeps the last three minors of each major, and removes the frozen docs and sidebars of the others and their line in `versions.json`, which it writes newest first. `pnpm docs:prune` applies the same rule alone. The version cut's pull request ([#48](https://github.com/phmilk/reforged-ts/issues/48)) commits the three paths, removals included.

Before the first cut the site serves Next alone; the version dropdown appears with the first cut, and the newest version is the default. Every cut version is served at `/docs/<label>`, the newest too, so a page keeps its URL when a newer version is cut and the compatibility matrix's docs links, which name the label, answer. The newest version's pages also answer without the label (`/docs/guides`), through a redirect written at build time. The compatibility page links a release's docs version while the site keeps it, and shows the label as text once it is pruned.

The Typings' reference is not versioned: a cut copies about 150 files, and the pages of every docs version link the same Typings pages, those of the Game versions `reforged-types` ships at build time. A docs build with three cut versions took 75 s on Windows, as much as one without.
