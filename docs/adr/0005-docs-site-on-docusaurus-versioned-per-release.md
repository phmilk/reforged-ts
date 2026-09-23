---
status: accepted
date: 2026-09-23
---

# The docs site runs on Docusaurus, is versioned per library release by CI, and generates the migration table from a rename map

The upstream site cannot be rebuilt (its source is not public) and the driving dev requires documentation that is versioned per release and kept current by automation, with a migration guide per version pair. We build the site in `website/` inside this repository on Docusaurus 3 with two `docusaurus-plugin-typedoc` instances (the library and the Typings, one subsection per Patch), because Docusaurus is the only candidate whose versioning is in the core: `docs:version <v>` freezes guides and generated references together, and CI runs it on every release tag. Migration pages exist per version pair and their old-to-new table is generated at build time from `migration/renames.json`, which also feeds a lint rule that flags old names. Local search and `docusaurus-plugin-llms` (`llms.txt`, per-page Markdown) complete the site; deployment goes to GitHub Pages through Actions.

## Considered options

- Starlight: lighter and with Pagefind search built in, but versioning only through an early community plugin on a pre-1.0 core.
- VitePress: its versioning plugin is archived; the successor is a work in progress.
- TypeDoc alone: no guides system, no versions, hand-built switcher.

## Consequences

- The site's dependency tree is the heaviest of the four (React runtime); `@docusaurus/faster` mitigates build time, and the version count is capped (last three minors per major).
- A rename that is not recorded in `migration/renames.json`, or a symbol in the map that no longer exists, fails the docs build.
- Docs versions follow library releases, not game Patches; the supported Patch is stated inside each version.

Decision record: https://github.com/phmilk/reforged-ts/issues/20
