# Docs site tooling for GitHub Pages: current site and candidate stacks

Research for ticket [#19](https://github.com/phmilk/reforged-ts/issues/19). Facts and comparison only; no decision. Feeds the ticket "Docs site: structure, tooling, deployment, migration guide".

All version numbers, dates and repository metrics were read on 2026-09-23 from the npm registry, the GitHub REST API (`gh api`) and the vendors' own documentation. Anything not read from a primary source is marked *inference*.

Vocabulary: **Native** = a function/type/constant the game exposes to Lua map scripts. **Wrapper** = a library class owning one Handle. **System** = a library utility without a Handle. **Patch** = a released game version. **Map project** = a repo consuming the library.

---

## 1. What powers https://cipherxof.github.io/w3ts/ today

### 1.1 Evidence

| Observation | Value | Source |
|---|---|---|
| Static site generator | `<meta name="generator" content="Docusaurus v2.0.0-alpha.70">` | Raw HTML of https://cipherxof.github.io/w3ts/ (`curl`, 2026-09-23) |
| Docusaurus alpha.70 release date | 2020-12-17 | `gh api repos/facebook/docusaurus/releases/tags/v2.0.0-alpha.70` |
| Hand-written guide routes | `/docs/getting-started`, `/docs/configuration`, `/docs/editor-support` | https://cipherxof.github.io/w3ts/sitemap.xml |
| Generated API routes | `/docs/api`, `/docs/api/classes/*` (38 pages: `binaryreader` … `widget`), `/docs/api/enums/{imagetype,syncstatus,w3ts_hook}`, `/docs/api/interfaces/{isyncoptions,isyncresponse}`, `/docs/api/modules/tsglobals` | https://cipherxof.github.io/w3ts/sitemap.xml |
| API pages carry "Defined in" source links | e.g. `https://github.com/cipherxof/w3ts/blob/af028de/handles/unit.ts#L1003` | Raw HTML of https://cipherxof.github.io/w3ts/docs/api/classes/unit |
| Commit the API was generated from | `af028de`, 2021-01-14, "implement addAbility to Item wrapper" | `gh api repos/cipherxof/w3ts/commits/af028de` |
| "Edit this page" link target | `https://github.com/TypeScriptToLua/TypeScriptToLua.github.io/edit/source/docs/getting-started.md` | Raw HTML of https://cipherxof.github.io/w3ts/docs/getting-started |
| Blog feeds present | `/blog/atom.xml`, `/blog/rss.xml` (Docusaurus classic preset default) | Raw HTML of the landing page |
| Last deployment (HTTP header) | `Last-Modified: Sun, 26 Jan 2025 22:56:52 GMT`, `Server: GitHub.com` | `curl -sI https://cipherxof.github.io/w3ts/` |
| Wayback Machine latest capture | 2026-02-23 | `http://web.archive.org/cdx/search/cdx?url=cipherxof.github.io/w3ts/` |
| Upstream branches | `master`, `updates` only; `gh-pages` returns 404 | `gh api repos/cipherxof/w3ts/branches`, `gh api repos/cipherxof/w3ts/branches/gh-pages` |
| Upstream workflows | `.github/workflows` does not exist on `master` | `gh api repos/cipherxof/w3ts/contents/.github/workflows` (404) |
| Upstream Pages deployments | none returned | `gh api repos/cipherxof/w3ts/deployments` (empty) |
| Upstream history for `website/` or `docs/` paths | no commits | `gh api "repos/cipherxof/w3ts/commits?path=website"` and `?path=docs` (empty) |
| Upstream `package.json` scripts (master, tag 3.0.2) | only `build: tstl -p tsconfig.json` and `prepublish`; no docs/typedoc script; no Docusaurus or TypeDoc devDependency | `gh api repos/cipherxof/w3ts/contents/package.json` (identical to this repo's `package.json` at `master`) |
| Author's related repos | `cipherxof/typedoc-plugin-markdown` is a fork of `typedoc2md/typedoc-plugin-markdown`, last pushed 2021-01-29 | `gh api repos/cipherxof/typedoc-plugin-markdown` |
| Template origin's current stack | `TypeScriptToLua/TypeScriptToLua.github.io` (branch `source`) uses `@docusaurus/core ^2.1.0`, `docusaurus-plugin-sass`; its branches are `source`, `alt-text-editor-support`, `update-dependencies`, a dependabot branch | `gh api "repos/TypeScriptToLua/TypeScriptToLua.github.io/contents/package.json?ref=source"`, `.../branches` |

### 1.2 What the evidence establishes

- The live site is a **Docusaurus 2 alpha (v2.0.0-alpha.70, released 2020-12-17)** site whose docs sidebar mixes three hand-written guide pages with a generated API tree under `/docs/api` laid out as `classes/`, `enums/`, `interfaces/`, `modules/`.
- The API reference was generated from upstream commit `af028de` (2021-01-14), i.e. it predates the 2.x and 3.x tags; it documents 38 Wrapper/System classes and the `tsglobals` module.
- The site was started from a copy of the TypeScriptToLua docs site (the `editUrl` still points at `TypeScriptToLua/TypeScriptToLua.github.io`).
- **The site's source is not in `cipherxof/w3ts`**: no `gh-pages` branch, no `docs/` or `website/` history, no workflow, no Pages deployment records are visible through the API. The Pages settings endpoint requires admin rights and returned 404, so the publishing source could not be read.
- *Inference*: the `classes/enums/interfaces/modules` layout under `/docs/api` matches the output of the 2021-era `docusaurus-plugin-typedoc` (then part of the `typedoc-plugin-markdown` monorepo, which the upstream author forked on 2021-01-29). Which exact package versions were used cannot be confirmed because the source tree is not public.
- *Inference*: the `Last-Modified` header (2025-01-26) is later than the content (2021-01). GitHub serves the header for the current deployment; either the old build output was re-pushed in 2025 or the header reflects a Pages infrastructure change. Not verifiable without the publishing repo.

### 1.3 Consequences for this fork

- Nothing in this repo or upstream can rebuild the existing site; a new site must be built from scratch regardless of tool.
- Docusaurus v2 alpha to v3 is two major jumps; the official migration guide is at https://docusaurus.io/docs/migration/v3 (HTTP 200 on 2026-09-23). Because no source exists to migrate, this only matters if URL compatibility with `/docs/api/classes/<name>` is desired.

---

## 2. Candidate stacks

### 2.1 Versions and activity (read 2026-09-23)

| Package | Latest (npm) | Published | Repo | Stars | Last push | Archived |
|---|---|---|---|---|---|---|
| `typedoc` | 0.28.20 | 2026-07-05 | TypeStrong/typedoc | 8452 | 2026-07-13 | no |
| `typedoc-plugin-markdown` | 4.13.1 | 2026-09-18 | typedoc2md/typedoc-plugin-markdown | 822 | 2026-09-18 | no |
| `vitepress` | 1.6.4 (`latest`), 2.0.0-alpha.20 (`next`, 2026-09-04) | 2025-08-05 | vuejs/vitepress | 18347 | 2026-09-22 | no |
| `typedoc-vitepress-theme` | 1.1.4 | 2026-09-07 | (in typedoc-plugin-markdown monorepo) | — | — | no |
| `@astrojs/starlight` | 0.42.3 | 2026-09-22 | withastro/starlight | 9291 | 2026-09-23 | no |
| `astro` | 7.3.4 | 2026-09-22 | — | — | — | — |
| `starlight-typedoc` | 0.23.1 | 2026-08-12 | HiDeoo/starlight-typedoc | 111 | 2026-09-15 | no |
| `@docusaurus/core` | 3.10.2 | 2026-07-10 | facebook/docusaurus | 66324 | 2026-09-22 | no |
| `docusaurus-plugin-typedoc` | 1.4.3 | 2026-09-07 | (in typedoc-plugin-markdown monorepo) | — | — | no |
| `typedoc-docusaurus-theme` | 1.4.3 | 2026-09-07 | (same) | — | — | no |

Sources: `https://registry.npmjs.org/<pkg>` (`dist-tags`, `time`), `gh api repos/<owner>/<repo>`.

Peer-dependency constraints (npm registry, `latest`):

- `typedoc@0.28.20`: `typescript 5.0.x … 5.9.x || 6.0.x`, `node >= 18`.
- `typedoc-plugin-markdown@4.13.1`: `typedoc 0.28.x`, `node >= 18`.
- `docusaurus-plugin-typedoc@1.4.3`, `typedoc-docusaurus-theme@1.4.3`, `typedoc-vitepress-theme@1.1.4`: `typedoc 0.28.x`, `typedoc-plugin-markdown >= 4.11.0`.
- `starlight-typedoc@0.23.1`: `@astrojs/starlight >= 0.39.0`, `astro >= 6.0.0`, `typedoc >= 0.28.0`, `typedoc-plugin-markdown >= 4.6.0` (from `packages/starlight-typedoc/package.json` on `HiDeoo/starlight-typedoc`).
- `@astrojs/starlight@0.42.3`: `astro ^7.2.10`.
- `@docusaurus/core@3.10.2`: `react ^18 || ^19`, `node >= 20`.

Note for this library: `package.json` at `master` pins `typescript ^5.0.4` as a peer dependency and `typescript-to-lua ^1.15.1`; TypeDoc 0.28 accepts TypeScript 5.0–6.0, so TypeDoc can run against the same `tsconfig.json` (with `lua-types` / `war3-types-strict` ambient types) that `tstl` uses. Whether TypeDoc handles the TSTL language extensions (`@typescript-to-lua/language-extensions`) cleanly was **not tested**.

### 2.2 How guides and the API reference coexist

**TypeDoc alone (HTML theme)**
- Hand-written Markdown is added through the `projectDocuments` option ("Specify additional markdown documents to be added to the generated documentation site"), through `@document` tags in code comments, or nested through a `children` frontmatter key. Frontmatter `title`, `group`, `category` control placement. Relative image/asset links are copied into a `media` folder. "TypeDoc's default sorting options will cause project documents to be re-ordered alphabetically" unless `sortEntryPoints` is disabled. Source: https://typedoc.org/documents/External_Documents.html, https://typedoc.org/documents/Options.Input.html.
- The `readme` option controls the index page; `entryPoints` / `entryPointStrategy` (`resolve` default, `expand`, `packages`) control what is documented. Source: https://typedoc.org/documents/Options.Input.html.
- Navigation and page layout: `navigation` (`includeCategories`, `includeGroups`, `includeFolders`, …) and `router` (`kind` default, `kind-dir`, `structure`, `structure-dir`, `group`, `category`). Source: https://typedoc.org/documents/Options.Output.html.
- Result: one generated site, API-first; guides are secondary pages inside the API navigation. No blog, no MDX, no custom components.

**typedoc-plugin-markdown (shared by the three SSG paths)**
- "Adds Markdown output that can be easily integrated into different ecosystems, such as code repositories, wikis, and static site generators." Ships companion themes for VitePress, Docusaurus, GitHub Wiki, GitLab Wiki, plus `frontmatter` and `remark` utility plugins. Source: https://typedoc-plugin-markdown.org/docs.

**VitePress + typedoc-vitepress-theme**
- Install `typedoc typedoc-plugin-markdown typedoc-vitepress-theme`; `typedoc.json` lists `"plugin": ["typedoc-plugin-markdown", "typedoc-vitepress-theme"]`; the theme "emits the sidebar data needed to wire the generated docs into a VitePress site" as `typedoc-sidebar.json`, imported in `.vitepress/config.mts`. TypeDoc is a **separate step**: the quick start adds `"predocs": "typedoc"` before `docs:dev` / `docs:build`. Source: https://typedoc-plugin-markdown.org/plugins/vitepress, https://typedoc-plugin-markdown.org/plugins/vitepress/quick-start.
- Guides are ordinary VitePress Markdown pages; the API sidebar group is spliced into `themeConfig.sidebar` by hand.

**Starlight + starlight-typedoc**
- Community plugin (author HiDeoo) listed on the official plugin directory as "Generate Starlight pages from TypeScript using TypeDoc." Source: https://starlight.astro.build/resources/plugins/.
- Install `starlight-typedoc typedoc typedoc-plugin-markdown`; configure `entryPoints` and `tsconfig`; add the exported `typeDocSidebarGroup` to the Starlight `sidebar` next to hand-written groups. Uses typedoc-plugin-markdown under the hood; runs inside the Astro build. Source: https://starlight-typedoc.vercel.app/getting-started/.

**Docusaurus + docusaurus-plugin-typedoc**
- Install `typedoc typedoc-plugin-markdown docusaurus-plugin-typedoc`; register `['docusaurus-plugin-typedoc', { entryPoints, tsconfig }]` in `docusaurus.config.js`; output defaults to `docs/api` ("Once built the docs will be available at `/docs/api`"); TypeDoc runs "as part of the Docusaurus build process" on `start`/`build`, or separately via `docusaurus generate-typedoc`. Source: https://typedoc-plugin-markdown.org/plugins/docusaurus/quick-start.
- Options: `out` default `docs/api`; `sidebar.autoConfiguration` default `true`; `sidebar.pretty`, `sidebar.typescript`; `docsPath` must match the preset's `docs.path`; `numberPrefixParser` auto-detected. Source: https://typedoc-plugin-markdown.org/plugins/docusaurus/options.
- This is the same shape as the current site (`/docs/api/classes/...`), so URL continuity with the existing site is most direct here (*inference* from the route layout; exact slugs depend on current plugin defaults).

### 2.3 Search

| Stack | Built-in | Notes | Source |
|---|---|---|---|
| TypeDoc HTML | Yes, client-side index in default theme | `searchInComments` extends index to comment text; "will increase the size of your search index, potentially up to an order of magnitude larger". | https://typedoc.org/documents/Options.Output.html |
| VitePress | Yes, `themeConfig.search.provider: 'local'` (minisearch, in-browser index) or `'algolia'` (DocSearch; `appId`, `apiKey`, `indexName`) | | https://vitepress.dev/reference/default-theme-search |
| Starlight | Yes, Pagefind by default: "By default, Starlight sites include full-text search powered by Pagefind"; index built at build time; `pagefind: false` frontmatter excludes a page | Official `@astrojs/starlight-docsearch` (Algolia) alternative; community Typesense plugin | https://starlight.astro.build/guides/site-search/ |
| Docusaurus | No offline search in core | First-class Algolia DocSearch (`themeConfig.algolia`; DocSearch is "free for any developer documentation or technical blog", application required; `contextualSearch` filters by version/locale); Typesense; community local-search plugins | https://docusaurus.io/docs/search |

### 2.4 Versioning per Patch

Requirement context: the library tracks game Patches; a "version per Patch" means a frozen copy of guides + API for each supported Patch.

| Stack | Mechanism | Status | Source |
|---|---|---|---|
| TypeDoc HTML | None built in. Each version is a separate TypeDoc run into a separate output folder (e.g. `/1.36/`, `/2.0/`); a version switcher must be hand-built. | — | Absence: no versioning option in https://typedoc.org/documents/Options.Output.html or Options.Input.html |
| VitePress | None built in. `vitepress-versioning-plugin` (VitePress v1 only) was **archived 2025-09-14** ("Unfortunately, I do not have the time to continue developing this plugin"); its author points to `its-miroma/vpv`, described as "[WIP] Support for multiple versions for VitePress", 2 stars, last push 2026-06-19, not on npm as `vpv`. | community, unstable | https://github.com/IMB11/vitepress-versioning-plugin, `gh api repos/its-miroma/vpv`, npm 404 for `vpv` |
| Starlight | `starlight-versions` (community, author HiDeoo, 0.10.1, peer `@astrojs/starlight >= 0.39.0`): configure `versions: [{ slug: '1.0' }]`, "The current state of your documentation will be archived as the newly configured `1.0` version while you continue to work on the current version." Warned as "an opinionated plugin that is still in early development. Expect frequent updates and changes." | community, early | https://starlight-versions.vercel.app/getting-started/, https://starlight.astro.build/resources/plugins/, `packages/starlight-versions/package.json` |
| Docusaurus | Built in: `npm run docusaurus docs:version <v>` copies `docs/` to `versioned_docs/version-<v>/`, writes `versioned_sidebars/version-<v>-sidebars.json`, appends to `versions.json`; `docs/` is the "current"/"Next" version. Official advice: "Versioning is best suited for websites with high-traffic and rapid changes"; it "will just increase your build time, and introduce complexity"; keep it "small", fewer than 10 versions. | core | https://docusaurus.io/docs/versioning |

*Inference*: with docusaurus-plugin-typedoc writing into `docs/api`, `docs:version` snapshots the generated API alongside the guides, so one command freezes both for a Patch. With Starlight/VitePress the generated API folder must be included in whatever the versioning plugin or a manual folder scheme copies.

### 2.5 LLM readability (`llms.txt`, Markdown routes)

| Stack | Core support | Plugin | Source |
|---|---|---|---|
| TypeDoc | HTML output only in core; JSON output available. Markdown via `typedoc-plugin-markdown`. `typedoc-plugin-llms-txt@0.1.2` exists on npm (peer `typedoc ^0.28.0`, `node >= 22`); not further verified. | third-party | https://typedoc.org/documents/Options.Output.html, `https://registry.npmjs.org/typedoc-plugin-llms-txt/latest` |
| VitePress | Not in core: issue "Support llms.txt generation" (vuejs/vitepress#4590, opened 2025-03-02) is still **open**. vitepress.dev itself depends on `vitepress-plugin-llms ^1.13.5` (`docs/package.json`) and shows "Are you an LLM? You can read better optimized documentation at /guide/what-is-vitepress.md" on every page. | `vitepress-plugin-llms@1.14.0` (author okineadev, 403 stars, push 2026-09-18): generates `llms.txt`, `llms-full.txt`, and per-page `.md` copies in `.vitepress/dist`; configured as `vite: { plugins: [llmstxt()] }`; used by "Vite, Vue.js, Vitest, Rolldown". | `gh api repos/vuejs/vitepress/issues/4590`, `gh api repos/vuejs/vitepress/contents/docs/package.json`, https://vitepress.dev/guide/what-is-vitepress, https://github.com/okineadev/vitepress-plugin-llms |
| Starlight | Not in core (the official plugin directory lists community plugins for it). | `starlight-llms-txt@0.12.0` (author delucis, 112 stars, push 2026-09-23; peer `astro ^7.0.0`, `starlight >= 0.41.0`): "Add llms.txt to your documentation site based on llmstxt.org". `starlight-md-txt` (max-ostapenko): "Expose your Starlight documentation pages as raw, agent-friendly Markdown at .md.txt URLs." | https://starlight.astro.build/resources/plugins/, https://github.com/delucis/starlight-llms-txt, npm registry |
| Docusaurus | Not in core: changelog through 3.10.2 (2026-07-10) has no llms/markdown-export entry; issue facebook/docusaurus#10899 (opened 2025-02-04) still **open**. | `docusaurus-plugin-llms@0.6.0` (author rachfop, 146 stars, push 2026-09-17; peer `@docusaurus/core ^3.0.0`): "`llms.txt` with section links and `llms-full.txt` with all content in one file", optional per-page Markdown; registered in `plugins`. Also `docusaurus-plugin-llms-txt` listed on the official resources page. | https://docusaurus.io/changelog, `gh api repos/facebook/docusaurus/issues/10899`, https://github.com/rachfop/docusaurus-plugin-llms, https://docusaurus.io/community/resources |

Common ground: every SSG path already has the API as Markdown files (typedoc-plugin-markdown output), which is what the llms plugins concatenate; TypeDoc HTML alone does not.

### 2.6 Build time

No benchmarks were run for this ticket (that would require installing four toolchains; the numbers on a toy site would not transfer). Vendor statements:

- Docusaurus: webpack/Babel by default; "Docusaurus Faster" (`future.experimental_faster: true`) swaps in Rspack, SWC and Lightning CSS and reports "2 to 4 times faster" builds (React Native site 3.04x, Babel site 3.27x, Lexical 2x); status "experimental" but "robust and well-tested". Versioning "will just increase your build time". Source: https://docusaurus.io/blog/releases/3.6, https://docusaurus.io/docs/versioning.
- VitePress: "Vite-Powered", "Instant server start, with edits always instantly reflected (<100ms)"; static HTML then SPA navigation. No build-time figures published. Source: https://vitepress.dev/guide/what-is-vitepress.
- Starlight/Astro: Pagefind index generated at build time (extra step after page build). No build-time figures published on the pages read. Source: https://starlight.astro.build/guides/site-search/.
- TypeDoc: single Node process; the SSG paths run the same TypeDoc conversion *plus* the SSG build, so TypeDoc alone is a lower bound for all four (*inference*).

### 2.7 Deployment to GitHub Pages via GitHub Actions

GitHub's own contract (applies to all four): Pages source set to "GitHub Actions"; workflow uses `actions/configure-pages@v5`, `actions/upload-pages-artifact@v4`, `actions/deploy-pages@v4`; deploy job needs `pages: write` and `id-token: write`, an `environment` (default `github-pages`), and `needs:` on the build job; artifact is a single gzip'd tar, 10 GB max, no symlinks. Source: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages.

| Stack | Official guide | Actions named | Project-pages base path |
|---|---|---|---|
| TypeDoc | none specific; generic Pages workflow above, upload the TypeDoc `out` dir | GitHub's three actions | `hostedBaseUrl` "Specify the base URL which the TypeDoc generated site will be hosted at" (sitemap/canonical) — https://typedoc.org/documents/Options.Output.html |
| VitePress | https://vitepress.dev/guide/deploy | `actions/configure-pages@v4`, `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4`; permissions `contents: read, pages: write, id-token: write` | "Make sure the `base` option in your VitePress is properly configured" (`'/repo/'`) |
| Starlight (Astro) | https://docs.astro.build/en/guides/deploy/github/ | `withastro/action@v6` (build+upload) then `actions/deploy-pages@v5`; same permissions | `site: 'https://<user>.github.io'`, `base: '/my-repo'`; internal links must be prefixed |
| Docusaurus | https://docusaurus.io/docs/deployment | Either `docusaurus deploy` (pushes to `deploymentBranch`, default `gh-pages`) or Actions with `actions/upload-pages-artifact@v3` + `actions/deploy-pages@v4` | `url`, `baseUrl` (trailing slash), `organizationName`, `projectName`; "It is recommended to set a `trailingSlash` config (`true` or `false`, not `undefined`)" |

The current site's `/w3ts/` base path and `noscript` baseUrl warning show the same project-pages `baseUrl` concern already applied to it (raw HTML, section 1.1).

### 2.8 Maintenance burden (moving parts per stack)

| Stack | Runtime deps to track | Version coupling | Custom content model |
|---|---|---|---|
| TypeDoc HTML | `typedoc` (+ optional llms plugin) | TypeDoc ↔ TypeScript range (`5.0.x…6.0.x` today) | Markdown documents only; theming via TypeDoc theme API |
| VitePress + theme | `vitepress` (1.6.4 stable, 2.0 alpha), `typedoc`, `typedoc-plugin-markdown`, `typedoc-vitepress-theme`, llms plugin | theme pins `typedoc 0.28.x`, `typedoc-plugin-markdown >= 4.11`; separate `predocs` step | Markdown + Vue components; no core versioning; sidebar JSON spliced by hand |
| Starlight + plugins | `astro` (7.x), `@astrojs/starlight` (0.x, `astro ^7.2.10`), `starlight-typedoc`, `typedoc`, `typedoc-plugin-markdown`, optional `starlight-versions`, `starlight-llms-txt` | Starlight is pre-1.0 (0.42.3); the three community plugins each pin a Starlight minimum (>= 0.39 / >= 0.41) and are all by one or two individual maintainers | Markdown/MDX in content collections; Pagefind search built in |
| Docusaurus + plugin | `@docusaurus/core` + `preset-classic` (3.10.2, React 18/19, node >= 20), `docusaurus-plugin-typedoc`, `typedoc`, `typedoc-plugin-markdown`, optional `docusaurus-plugin-llms`, `@docusaurus/faster` | plugin pins `typedoc 0.28.x`; core versioning and Algolia search are first-party | MDX + React; blog; i18n; heaviest dependency tree of the four (React runtime) |

Activity: all core projects and all named plugins were pushed to within the last three months except `vitepress-versioning-plugin` (archived) and `typedoc` core (last push 2026-07-13, last release 2026-07-05). Sources: section 2.1.

---

## 3. Not verified / open

- The repository that holds the current site's Docusaurus source and its publishing configuration (Pages settings API needs admin access; no public branch or history found).
- Whether TypeDoc 0.28 documents this library's TSTL-specific constructs (`@typescript-to-lua/language-extensions`, `lua-types` ambient globals) without extra configuration. Not run.
- Actual build times on this library. Not measured.
- `typedoc-plugin-llms-txt` (npm 0.1.2) was only seen in the registry; its repository and behaviour were not read.
- The `its-miroma/vpv` VitePress versioning successor was only checked for activity; its docs were not read.

## 4. Source index

Current site: https://cipherxof.github.io/w3ts/ (raw HTML, `sitemap.xml`, `/docs/getting-started`, `/docs/api/classes/unit`, HTTP headers); GitHub REST API on `cipherxof/w3ts`, `cipherxof/typedoc-plugin-markdown`, `TypeScriptToLua/TypeScriptToLua.github.io`, `facebook/docusaurus` (release `v2.0.0-alpha.70`).

TypeDoc: https://typedoc.org/documents/Options.Input.html, https://typedoc.org/documents/Options.Output.html, https://typedoc.org/documents/External_Documents.html.
typedoc-plugin-markdown: https://typedoc-plugin-markdown.org/docs, https://typedoc-plugin-markdown.org/plugins/vitepress, https://typedoc-plugin-markdown.org/plugins/vitepress/quick-start, https://typedoc-plugin-markdown.org/plugins/docusaurus, https://typedoc-plugin-markdown.org/plugins/docusaurus/quick-start, https://typedoc-plugin-markdown.org/plugins/docusaurus/options.
VitePress: https://vitepress.dev/guide/what-is-vitepress, https://vitepress.dev/guide/deploy, https://vitepress.dev/reference/default-theme-search, https://github.com/vuejs/vitepress/issues/4590, https://github.com/okineadev/vitepress-plugin-llms, https://github.com/IMB11/vitepress-versioning-plugin.
Starlight: https://starlight.astro.build/guides/site-search/, https://starlight.astro.build/resources/plugins/, https://starlight-typedoc.vercel.app/getting-started/, https://starlight-versions.vercel.app/getting-started/, https://github.com/delucis/starlight-llms-txt, https://docs.astro.build/en/guides/deploy/github/.
Docusaurus: https://docusaurus.io/docs/versioning, https://docusaurus.io/docs/search, https://docusaurus.io/docs/deployment, https://docusaurus.io/blog/releases/3.6, https://docusaurus.io/changelog, https://docusaurus.io/docs/migration/v3, https://github.com/facebook/docusaurus/issues/10899, https://github.com/rachfop/docusaurus-plugin-llms.
GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages.
Registry/API metrics: `https://registry.npmjs.org/<package>` and `gh api repos/<owner>/<repo>` for every package and repo in section 2.1.
