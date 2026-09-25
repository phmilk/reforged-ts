# Releasing

How the four packages of this repository (`reforged-ts`, `reforged-types`, `reforged-test` and `eslint-plugin-reforged`) are versioned and published, for contributors, AI agents and the maintainer. The decision is [ADR 0009](adr/0009-independent-semver-with-changesets-and-patch-field.md); the build is [#46](https://github.com/phmilk/reforged-ts/issues/46).

[Changesets](https://github.com/changesets/changesets) drives the versions. Each pull request carries a changeset that names the packages it changes and their bumps; the version step turns the pending changesets into versions and changelogs.

## Contributing a change

### Adding a changeset

Add one changeset per pull request. Its text is the changelog entry, so write it for the Map project author reading the changelog: what changed and what to do about it.

Interactively:

```sh
pnpm changeset
```

Without the prompt, which is how an AI agent adds one (flags take comma-separated package names; the file gets a generated name):

```sh
pnpm changeset add --minor reforged-types -m "Declare the Natives of the new Patch."
pnpm changeset add --major reforged-ts --patch reforged-test -m "Remove the deprecated constructors."
pnpm changeset add --empty
```

By hand, a Markdown file in `.changeset/` with any name (kebab-case, describing the change), other than `README.md`. The frontmatter maps each package to `major`, `minor` or `patch`; the body is the summary, Markdown allowed:

```md
---
"reforged-ts": minor
"reforged-test": minor
---

`Timer.every(interval, handler)` starts a periodic Timer and returns it.
```

**The empty changeset.** A change that publishes nothing (the website, CI, the release scripts, a test or a comment) carries an empty changeset: `pnpm changeset add --empty`, or the same file with nothing between the two `---` lines. It releases nothing and says that no release was forgotten.

The changelog generator ([`@changesets/changelog-github`](https://github.com/changesets/changesets/tree/main/packages/changelog-github)) prefixes each entry with a link to the pull request that added the changeset, its commit and its author.

### The `reforged.patch` field

Every publishable package declares the game Patch it supports in its `package.json`, as a full Build:

```json
"reforged": { "patch": "3.0.0.24268" }
```

It is the minimum Patch the package supports ([ADR 0009](adr/0009-independent-semver-with-changesets-and-patch-field.md)), and the one place that says so: the Patch-watch workflow, the compatibility matrix and the docs read it. Private packages (the workspace root, the release scripts) have none. The fields must agree:

- Each names a Patch `reforged-types` ships an entry for: a Game version folder of the Typings (`packages/reforged-types/3.0.0/`) whose `manifest.json` records that Build.
- The library's (`reforged-ts`) is the newest Patch the Typings ship an entry for: the library pins the newest Patch it supports.

`pnpm release:check-patches` checks both and prints one line per package that breaks them. It is the script CI calls ([#48](https://github.com/phmilk/reforged-ts/issues/48)), and the compatibility matrix generator runs the same check before writing a row. Its programmatic entry point is `checkPatches` in `release/src/check-patches.ts`.

### Choosing the bump for a Patch

A new game Patch is adopted in one pull request: the Typings are regenerated for it (the New Patch loop of `packages/reforged-types/AGENTS.md`), and **`reforged.patch` moves with the changeset that adopts the Patch, in the same pull request**. The changeset gives each package its bump by these rules:

- **A Patch that adds Natives:** a minor for `reforged-types` (new declarations); a minor for `reforged-ts` when new Wrappers ship; a minor for `reforged-test` when stubs are added; no bump for `eslint-plugin-reforged` unless one of its data files changes.
- **A Patch that changes or removes a Native the public API depends on:** a major for `reforged-ts` only if its public API breaks, otherwise a minor with a changelog note naming the Native. A major needs its migration page and `renames.json` entries.
- **A generator fix in the Typings:** a patch for `reforged-types`.

Which fields move:

- `reforged-types` and `reforged-ts` move to the new Patch every time, since the library pins the newest Patch the Typings ship.
- Another package moves when the minimum Patch it supports changes.
- When the new Build shares its Game version with the old one (`3.0.0.24268` then `3.0.0.24277`), the Game version folder is regenerated from the new Build and the old Build loses its entry: every field naming the old Build moves to the new one.

When the rules give the library no bump, its field still moves, so the changeset names it with `none` (which `release:check-changeset` accepts for the changed manifest); no library version is released and its next release carries the field:

```md
---
"reforged-types": minor
"reforged-ts": none
---

Declare the Natives of Patch 3.0.0.24277.
```

## Changesets configuration

`.changeset/config.json`:

| Setting                      | Value                                                | Why                                                                                                  |
| ---------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `fixed`, `linked`            | empty                                                | Independent versioning: each package moves only with its own changesets (ADR 0009).                  |
| `baseBranch`                 | `master`                                             | The branch releases are cut from.                                                                    |
| `access`                     | `public`                                             | Unscoped public packages.                                                                            |
| `commit`                     | `false`                                              | The release workflow commits the versions, in the Version Packages pull request.                     |
| `changelog`                  | `@changesets/changelog-github`, `phmilk/reforged-ts` | Entries link the pull request and its author.                                                        |
| `updateInternalDependencies` | `patch`                                              | A released package's ranges on its workspace dependencies follow any bump of them, patches included. |
| `privatePackages`            | `{ "version": false, "tag": false }`                 | The workspace root and `reforged-ts-release` (the release scripts) are never versioned or tagged.    |
| `ignore`                     | empty                                                | See [the website](#the-website).                                                                     |
| `format`                     | `auto`                                               | Changelogs and manifests are formatted by the Prettier the workspace uses.                           |

**No peer-bump majors.** A package whose peer dependency is bumped does not get a major. In Changesets 3 a dependent gets a patch, and only when the new version leaves its range: a minor on `reforged-types` moves `reforged-types` alone, and a major on it gives `reforged-ts` and `eslint-plugin-reforged` a patch ("Updated dependencies"). No setting is needed for this; `release/test/versioning.test.ts` proves it on a scratch copy of the workspace.

### The website

The website is not a workspace package yet. When the docs spec ([#40](https://github.com/phmilk/reforged-ts/issues/40)) makes it one, it is `private` and its name goes into `ignore`, so it is never versioned, tagged or published even if `privatePackages` changes. A published package must never depend on it: Changesets rejects a package that depends on an ignored one.

### Versioning locally: the GitHub token

The changelog generator asks GitHub for the pull request and author of each changeset, so `changeset version` needs a GitHub token and fails without one: the one `gh auth token` prints works, as does a personal token with the `read:user` and `repo:status` scopes. CI passes its own. Locally, with the changesets committed:

```sh
# Git Bash or Linux
GITHUB_TOKEN="$(gh auth token)" pnpm changeset version
```

```powershell
# PowerShell
$env:GITHUB_TOKEN = gh auth token; pnpm changeset version; Remove-Item Env:GITHUB_TOKEN
```

Or put `GITHUB_TOKEN=<token>` in a `.env` file at the repository root, which git ignores and the generator reads.

## Pre mode and the `next` dist-tag

The workspace is in Changesets pre mode with the `alpha` identifier during the build phase: `.changeset/pre.json` holds `{ "mode": "pre", "tag": "alpha" }`, entered with `pnpm changeset pre enter alpha` and committed. Every version is `1.0.0-alpha.N`, and each package counts its own `N`, moving only with its own changesets. `changeset version` moves the changesets it consumed into `.changeset/pre/`, where they wait to be rolled into the 1.0.0 changelog when pre mode exits. The Version Packages pull request carries `(alpha)` in its title.

Alphas go to npm under the `next` dist-tag, so a Map project installs one with `pnpm add reforged-ts@next`. Changesets refuses `changeset publish --tag` in pre mode and when publishing from packed tarballs, so the tag is not a command-line option: the release workflow writes `next` into the `tag` of each entry of the publish plan (`publish-plan.json`) before publishing ([`release:dist-tag`](#the-dist-tag)).

**Known limitation.** npm gives the `latest` dist-tag to the first version of a package, prerelease or not. After the first publish, `latest` and `next` both point at `1.0.0-alpha.0`; later alphas move `next` only, so `latest` stays on `1.0.0-alpha.0` until 1.0.0 is published, when it moves to 1.0.0. There is no workaround short of publishing a placeholder stable version, which is rejected. A Map project should install with `@next` during the build phase.

## The first alpha

### Starting versions

The first `changeset version` in pre mode must give all four packages exactly `1.0.0-alpha.0`. Changesets computes a prerelease as the bump of the current version plus `-alpha.N`, so the starting point matters: a package at `1.0.0` with a major changeset would get `2.0.0-alpha.0`, and one at `0.0.0` with only minors would get `0.1.0-alpha.0`.

The mechanism chosen: every publishable package is at `0.0.0`, and `.changeset/first-release.md` majors all four. A major on `0.0.0` is `1.0.0`, so each package gets `1.0.0-alpha.0` whatever else is pending; the first-release entry opens each package's changelog and rolls into its 1.0.0 changelog. `pnpm changeset status` shows the plan, and `release/test/versioning.test.ts` proves the outcome with the real configuration.

A package at `0.0.0` is never packed or published: its versions are applied first.

### Applying the versions

The first versions are applied on `master` before the first-publish wizard ([#149](https://github.com/phmilk/reforged-ts/issues/149)) runs, which publishes what `master` holds:

1. On a branch from `master`, with a token for the changelog generator (see [Versioning locally](#versioning-locally-the-github-token)), run `pnpm changeset version`.
2. Check the result: all four manifests at `1.0.0-alpha.0`, a `CHANGELOG.md` per package, the consumed changesets moved to `.changeset/pre/`, `.changeset/pre.json` unchanged. Run `pnpm install` and `pnpm check`.
3. Open a pull request with the result and merge it.

When the release workflow is already on `master`, its Version Packages pull request carries the same result and can be merged instead. The run that merge starts goes on to pack, gate and publish, and its publish job stops at [the publish check](#the-publish-check), naming the four packages as not on npm yet: expected, since trusted publishing cannot create a package. Run the wizard next; it publishes what `master` holds, so that failed job needs no re-run.

## The compatibility matrix

The compatibility matrix tells a Map project author which versions of the four packages, which game Patch and which Toolchain go together. It is generated from the packages and never edited by hand: one row per stable release, only ever appended, written during the version step so the Version Packages pull request shows the row under review (no commit after publishing).

### The version step: `release:version`

`pnpm release:version` is the version step of a release, and the command the release workflow's version job runs: `changeset version` in the repository root, then the matrix generator. When `changeset version` fails, the matrix is not generated and the command exits 1. It needs what `changeset version` needs: a GitHub token for the changelog generator (see [Versioning locally](#versioning-locally-the-github-token); CI passes `GITHUB_TOKEN`), and at least one pending changeset. It does not run the major-changeset gate: the gate reads the pending changesets, which `changeset version` consumes, so it runs before this step.

`pnpm release:matrix` runs the generator alone. It rewrites the three files from the committed JSON, so running it twice, or on another day, changes no byte. Exit codes of both: 0 done, 1 a problem (one line each, then a link here), 2 usage. Their programmatic entry points are `generateMatrix` and `buildMatrix` in `release/src/matrix.ts`.

### What the generator reads and writes

| File                                     | Kind      | What                                                                                                                                                                                                                                                                                  |
| ---------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `release/compatibility/systems.json`     | declared  | The 3.0.0 systems each library minor adds, extended by the maintainer when a tier ships.                                                                                                                                                                                              |
| `release/compatibility/matrix.json`      | generated | The matrix, the data file the docs site reads ([its shape](#the-json-file-a-stable-shape)).                                                                                                                                                                                           |
| `website/docs/compatibility/_matrix.mdx` | generated | The table of the docs site's compatibility page: a partial (the underscore keeps Docusaurus from making it a page) that the page imports.                                                                                                                                             |
| `release/compatibility/matrix.md`        | generated | The same table as a fragment, which the Template's sync workflow fetches from `master` at `https://raw.githubusercontent.com/phmilk/reforged-ts/master/release/compatibility/matrix.md` and splices into the Template README between its markers. The path is stable: do not move it. |

It also reads each publishable package's name, version and `reforged.patch`, the Toolchain pins of the catalog in `pnpm-workspace.yaml` (`typescript`, `typescript-to-lua`, `lua-types`, as written there), the Node floor of the library's `engines.node` (a `>=` range) and `.changeset/pre.json`. The tables list the newest release first; before the first stable release they hold a one-line empty state. Prettier leaves the generated `.md` and `.json` alone (`.prettierignore`), so their bytes are the generator's.

### When a row is added

- **One row per stable release.** A row is identified by the four package versions. When the workspace's versions have no row, the generator appends one; when they have one (a version step that released nothing new), every field of it but the cut date must still match, and the row is kept as it is, cut date included. A Typings-only release (a new Patch adopted by `reforged-types` alone) gets its own row, with the library version of the row before it.
- **Prereleases produce no row.** In pre mode, or when the library's version is a prerelease, the generator adds nothing and rewrites the files unchanged; it still runs the `reforged.patch` check. A stable library with a prerelease package beside it is an error.
- **The cut date** is the day the version step ran, `YYYY-MM-DD` in UTC.

The generator fails, writing nothing:

- when the `reforged.patch` consistency check fails ([the field](#the-reforgedpatch-field));
- when `systems.json` has no entry for the library's minor (`1.2` for `1.2.0`);
- when the release already has a row whose other contents differ. Rows are never rewritten: a change to what a release was built with (a Toolchain pin, a Patch field) ships in a new release, which gets its own row.

### The systems list

`release/compatibility/systems.json` maps each library minor to the 3.0.0 systems it **adds**; a row covers the systems of its minor and of every earlier minor, in the order declared. 1.0 adds tiers 1 and 2 of [#8](https://github.com/phmilk/reforged-ts/issues/8) and 1.1 adds tier 3. Every library minor needs an entry before it is released, with an empty list when it adds none:

```json
{
  "minors": {
    "1.0": ["Equipment and bag", "Ability cooldowns"],
    "1.1": ["Doodads"],
    "1.2": []
  }
}
```

### The JSON file: a stable shape

`release/compatibility/matrix.json` is the data the docs site builds its compatibility page from. Its shape is stable: fields may be added, but a field is never renamed, removed or given another meaning without bumping `format`.

```json
{
  "format": 1,
  "rows": [
    {
      "library": "1.0.0",
      "typings": "1.0.0",
      "harness": "1.0.0",
      "plugin": "1.0.0",
      "patch": "3.0.0.24268",
      "typescript": "6.0.2",
      "typescriptToLua": "^1.37.1",
      "luaTypes": "^2.14.1",
      "node": "22.13",
      "systems": ["Equipment and bag", "Ability cooldowns"],
      "cutDate": "2026-10-01",
      "docs": "https://phmilk.github.io/reforged-ts/docs/1.0"
    }
  ]
}
```

| Field                                       | Value                                                                                                |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `format`                                    | `1`, the version of this shape.                                                                      |
| `rows`                                      | One per stable release, oldest first, only ever appended.                                            |
| `library`, `typings`, `harness`, `plugin`   | The exact versions of `reforged-ts`, `reforged-types`, `reforged-test` and `eslint-plugin-reforged`. |
| `patch`                                     | The game Patch, a Build: the library's `reforged.patch`, which is the newest Patch the Typings ship. |
| `typescript`, `typescriptToLua`, `luaTypes` | The catalog pins as written there: TypeScript exact, the others as caret ranges.                     |
| `node`                                      | The Node floor, the version of the library's `engines.node` (`>=22.13` gives `22.13`).               |
| `systems`                                   | The 3.0.0 systems the release covers, from the systems list.                                         |
| `cutDate`                                   | The day the version step ran, `YYYY-MM-DD` (UTC).                                                    |
| `docs`                                      | The docs version URL of the library's minor.                                                         |

### The docs version URL

The docs site keeps one docs version per library minor, labelled by the library's `major.minor` ([#40](https://github.com/phmilk/reforged-ts/issues/40)). A row's URL is `https://phmilk.github.io/reforged-ts/docs/` followed by that label: `.../docs/1.0` for 1.0.0 and 1.0.3 alike. The label is used rather than the empty segment the site gives its newest version, because a row never changes and the newest version stops being the newest. So the site must answer at `/docs/<label>` for its newest version too (a version path or a redirect), and a version the site no longer keeps (it keeps the last three minors of each major) is a dead link the compatibility page should not render as a link.

## The major-changeset gate

No stable major of `reforged-ts` ships without its migration guide. `pnpm release:gate` (`release/src/major-changeset-gate.ts`, programmatic entry `majorChangesetGate(root)`) reads the pending changesets in `.changeset/` and the versioned prerelease changesets in `.changeset/pre/`. When any of them bumps `reforged-ts` by a major, or when the next stable version of `reforged-ts` would be its first (1.0.0, a major relative to w3ts 3.x), it requires two things for the version pair of that major:

- the migration page of the pair in the website docs;
- at least one entry of `packages/reforged-ts/migration/renames.json` whose `versions` are the pair, or the pair's no-renames marker.

Missing either fails with a message naming the page path expected and the pair. A minor or a patch of `reforged-ts`, and a major of another package, require nothing.

**The version pair.** Written as the rename map writes it, the package and its major on each side: the previous major to the next one, `reforged-ts@1` to `reforged-ts@2`. The first pair is `w3ts@3` to `reforged-ts@1` (w3ts 3.x to reforged-ts 1.0).

**The page path.** One hand-written page per version pair under the migration section of the docs site ([#40](https://github.com/phmilk/reforged-ts/issues/40)): `website/docs/migration/<from>-to-<to>.md`, each side the package and its major joined by a dash. The first page is `website/docs/migration/w3ts-3-to-reforged-ts-1.md`, served at `/docs/<version segment>/migration/w3ts-3-to-reforged-ts-1`; the page for 2.0 will be `website/docs/migration/reforged-ts-1-to-reforged-ts-2.md`. The same name with `.mdx` also counts. The page follows the structure of [#14](https://github.com/phmilk/reforged-ts/issues/14): install and tsconfig, the old-to-new table (generated from the rename map by the docs build), behaviour changes, Typings changes, what stays the same.

**The no-renames marker.** A major that removes and renames no public symbol still needs its page, and says so in the rename map with one marker item instead of entries:

```json
{
  "kind": "noRenames",
  "versions": { "from": "reforged-ts@1", "to": "reforged-ts@2" },
  "note": "2.0 raises the supported Patch and renames nothing."
}
```

`renames.schema.json` accepts it, the library's schema test checks it (and that no pair has both entries and a marker), and `eslint-plugin-reforged`'s `no-legacy-w3ts-names` skips it.

**In pre mode.** While `.changeset/pre.json` has `"mode": "pre"`, the version produced is a prerelease, so the gate reports what is missing and exits zero: alphas keep publishing before the docs site exists. It fails only when the version it would produce is stable: once pre mode is exited (the `pnpm changeset pre exit` pull request, where the 1.0.0 checklist's migration page becomes mechanical) or with no pre state at all.

**Running it.** `pnpm release:gate` takes no arguments. The verdict goes to stdout, or to stderr when it fails; in GitHub Actions (`GITHUB_STEP_SUMMARY` set) a requirement and what is missing are also appended to the job summary. Exit codes: 0 when it passes or only reports (pre mode), 1 when something is missing for a stable version or an input cannot be read (a changeset, `pre.json`, the rename map), 2 on an argument. CI runs it on every pull request, and the version job of the release workflow runs it again before opening the Version Packages pull request.

## The Template gate

The Template is the Reference consumer ([ADR 0006](adr/0006-template-owns-code-editor-owns-data.md)): no release reaches npm unless the Template builds, lints and passes its tests against the packed packages. `pnpm release:template-gate` checks this. The release workflow runs it between pack and publish, and it runs locally the same way.

It takes a Template checkout and the output folder of `changeset pack`, which holds `publish-plan.json` and the tarballs under `packages/`. It checks each tarball against the plan's integrity. It writes one `pnpm.overrides` entry per package in the plan into the checkout's `package.json`, pointing at that tarball, and runs `pnpm install --no-frozen-lockfile`. It checks that the Template's own dependencies resolved to the packed versions. Then it runs the Template's scripts by name: `build --mode release`, `lint` and `test`. It stops at the first command that fails, or at the first script the Template lacks, and names it. Exit codes: 0 pass, 1 fail, 2 usage.

The Template is checked out at `v<major>` of the library version. Every 1.x, alphas included, maps to `v1`. A tag and a branch check out the same way. `pnpm -s release:template-gate --print-ref --pack-dir <dir>` prints the ref for the library version in the plan.

### Running it locally

```sh
pnpm run build
pnpm changeset pack --out-dir ../pack
git clone --branch "$(pnpm -s release:template-gate --print-ref --pack-dir ../pack)" \
  https://github.com/phmilk/reforged-ts-template.git ../t
pnpm release:template-gate --template ../t --pack-dir ../pack
```

- Relative paths resolve against the folder you run the command from.
- Keep the clone outside this repository. A Template without its own `pnpm-workspace.yaml` would otherwise be installed as part of this workspace. On Windows, keep its path short: vitest fails at startup when a path under the Template's `node_modules` passes 260 characters.
- The gate leaves the overrides, a lockfile and the build output in the checkout. Use a throwaway clone.
- Packing an unversioned workspace (every package at `0.0.0`) is fine for a local run, because the overrides replace the Template's ranges. It is never fine for publishing.
- Until the Template has a `v1` ref, clone its default branch instead. The release workflow does not fall back: it needs the ref (see [its prerequisites](#prerequisites-outside-this-repository)).

## Leaving pre mode: the 1.0.0 checklist

Checked by hand, then `pnpm changeset pre exit` in a pull request; the next Version Packages pull request releases 1.0.0 of every package, with the changelogs of every alpha rolled in, on `latest`.

- [ ] The eight build steps of [#14](https://github.com/phmilk/reforged-ts/issues/14) are merged.
- [ ] The TSDoc gate is at error and green.
- [ ] The Template gate is green on the last alpha.
- [ ] The docs site is deployed green from `master`.
- [ ] [The compatibility matrix generator](#the-compatibility-matrix) produces the 1.0.0 row without error.
- [ ] The migration page for w3ts 3.x to reforged-ts 1.0 is present with its `renames.json` entries (the major-changeset gate checks this mechanically: it treats the first stable release of `reforged-ts` as a major).

## Deprecating and removing a symbol

The deprecation policy of [#46](https://github.com/phmilk/reforged-ts/issues/46), which the checks encode:

1. **Deprecate in a minor.** The symbol keeps working and its TSDoc gains `@deprecated` with a `{@link}` to the replacement (the TSDoc standard, [ADR 0004](adr/0004-tsdoc-standard-with-compiled-examples.md)). In the same pull request, add its `renames.json` entry with the version pair from the current major to the next one (`reforged-ts@1` to `reforged-ts@2` for a symbol deprecated in 1.x), so the lint rule flags the old name and the next migration table lists it.
2. **Remove in the next major.** The major changeset that removes it trips [the major-changeset gate](#the-major-changeset-gate), which requires the migration page of the pair; its entries are already in the rename map.

A symbol is never removed in a minor.

## Support window

Fixes land only on the latest minor of the latest major. There are no maintenance branches and no backports: a bug found in 1.2 once 1.3 is out is fixed in the next 1.3 patch (or whatever is latest), and 1.2 gets no more releases. Releases are only ever cut from `master`.

## The release workflow

`.github/workflows/release.yml` runs on every push to `master`. Merging to `master` releases, and no one holds a token: the pull requests are opened by the repository's GitHub App, and npm accepts the upload through trusted publishing. A concurrency group keeps two runs from versioning or publishing at once; a newer push waits for the running one. Each job runs on Node 24, pins its actions to a commit, restores no dependency cache, and gets only the permissions listed below. The workflow uses the `changesets/action` v2 sub-actions rather than the combined action, so only the publish job can request an OIDC token.

| Job             | Runs when                                                      | Permissions                                  | What it does                                                                                                                                                                                                                                              |
| --------------- | -------------------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `select`        | always                                                         | `contents: read`                             | `select-mode`: `version` while a changeset releases something, else `publish` when a publishable version is not on npm, else `none`. Writes the mode to the job summary.                                                                                  |
| `version`       | mode `version`                                                 | `contents: read`, the App                    | Runs `pnpm release:gate` (the [major-changeset gate](#the-major-changeset-gate)), then the `version` sub-action with `pnpm release:version`, which opens or updates the Version Packages pull request on `changeset-release/master`, authored by the App. |
| `pack`          | mode `publish`; in [the dry run](#the-dry-run), also `version` | `contents: read`, PRs `read`                 | `pnpm build`, `pnpm changeset pack` (the tarballs and the publish plan), `pnpm release:dist-tag`, then uploads the pack folder as the `release-pack` artifact.                                                                                            |
| `template-gate` | after `pack`                                                   | `contents: read`                             | Downloads the artifact, clones the Template at its ref (`pnpm release:template-clone`, outside the checkout) and runs [the Template gate](#the-template-gate).                                                                                            |
| `publish`       | mode `publish`, after `template-gate`, never in the dry run    | `contents: read`, `id-token: write`, the App | Runs `pnpm release:publish-check`, then the `publish` sub-action on the same artifact: `changeset publish --from-pack-dir` from the checkout, no build, then a git tag (`reforged-ts@1.0.0-alpha.1`) and a GitHub Release per published package.          |

The bytes published are the bytes the Template gate tested: the publish job downloads the artifact the gate downloaded, by its id, and `changeset publish --from-pack-dir` uploads those tarballs as they are. Provenance comes with trusted publishing, because the repository is public.

The tags and the releases are created with the App's token, not the job's default one: a tag created with the default token triggers no workflow, and the `reforged-ts@<major>.<minor>.0` tags must trigger `docs.yml`, which cuts the docs version ([#48](https://github.com/phmilk/reforged-ts/issues/48)).

### The dist-tag

`pnpm release:dist-tag --pack-dir <dir>` (`release/src/dist-tag.ts`) sets the `tag` of every entry of the publish plan in a `changeset pack` output: `next` while `.changeset/pre.json` is in pre mode, else the `latest` Changesets wrote. It refuses a plan that publishes a package at `0.0.0`, and writes the plan to the job summary as a table. The pack job runs it before the upload, so the Template gate and the publish job read the same plan. Exit codes: 0 done, 1 an unreadable or unversioned plan, 2 usage.

### The publish check

`pnpm release:publish-check` (`release/src/publish-check.ts`) runs in the publish job before anything is published and fails with one line per missing prerequisite:

- the job cannot request an OIDC token: `permissions: id-token: write` is missing;
- the publishing tool cannot do trusted publishing: pnpm 10 hands the upload to the npm CLI, which does it from 11.5.1 (Node 24 bundles a recent enough npm); pnpm 11 and later do it themselves;
- a publishable package is not on npm yet: trusted publishing is configured on an existing package only, so a package's first version is published by hand with the first-publish wizard ([#149](https://github.com/phmilk/reforged-ts/issues/149)).

npm does not expose a package's trusted publisher, so a missing or mismatched one shows only at upload, as an `ENEEDAUTH` or 404 from npm.

### The dry run

A rehearsal of the pipeline on the real repository, before the first tokenless alpha and after any change to the workflow or the gates. Start it from the Actions tab (workflow "release", "Run workflow", with "Dry run" ticked, which is the default) or with:

```sh
gh workflow run release.yml --ref master -f dry-run=true
```

It runs `select`, then, by mode:

- `version`: the version job runs the major-changeset gate and `pnpm release:version`, then writes the would-be pull request to its job summary (the changed files, and the diff in a collapsed block) instead of opening it. The pack job applies the same versions before packing, so pack and the Template gate rehearse the release the pull request would publish.
- `publish`: pack and the Template gate, over what `master` holds.
- `none`: nothing after `select`.

It never runs the publish job and never opens a pull request. It needs the same variables, secrets and Template ref as a release, so it also proves them. A dispatch can run from any branch as a dry run; unticking "Dry run" is refused outside `master`.

### Repository variables and secrets

| Name                  | Kind     | Read by              | What                                                                                                                                                                                                |
| --------------------- | -------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `APP_CLIENT_ID`       | variable | `version`, `publish` | The client ID of the repository's GitHub App ([#48](https://github.com/phmilk/reforged-ts/issues/48)).                                                                                              |
| `APP_PRIVATE_KEY`     | secret   | `version`, `publish` | A private key of that App.                                                                                                                                                                          |
| `TEMPLATE_READ_TOKEN` | secret   | `template-gate`      | A fine-grained token with Contents: read on `phmilk/reforged-ts-template` only, while the Template is private. Once it is public the gate clones it without a token and this secret can be deleted. |

No npm token exists anywhere. A job that needs a missing one fails at its first step, naming it: the App steps name `APP_CLIENT_ID` or `APP_PRIVATE_KEY`, and the Template clone names `TEMPLATE_READ_TOKEN` when the Template cannot be read without it, or the token when it cannot read the Template.

### Prerequisites outside this repository

They gate the dry run and the first tokenless publish, not the merge of the workflow:

- **The GitHub App** ([#48](https://github.com/phmilk/reforged-ts/issues/48)): installed on this repository with contents write and pull requests write, its client ID and a private key stored as above.
- **A `v1` ref on the Template**: the gate clones `v<major>` of the library version, and fails naming the ref when the Template has neither a tag nor a branch of that name. Create it on the Template commit that supports the release: `git tag v1 <commit> && git push origin v1`. The Template's own plan cuts a `v1` branch at library 2.0 and keeps `main` as the current major; a `v1` tag now and a `v1` branch then both satisfy the gate, but the tag must be moved (or replaced by the branch) when the Template's `main` moves on.
- **A read-only token for the Template** while it is private (see the table above).
- **The four packages on npm with their trusted publisher**: the first-publish wizard ([#149](https://github.com/phmilk/reforged-ts/issues/149)) publishes `1.0.0-alpha.0` of each and configures the publisher (repository `phmilk/reforged-ts`, workflow `release.yml`, no environment). The workflow file name is part of that configuration: renaming `release.yml` breaks publishing until every package's publisher is updated.

### The Version Packages pull request and CI

The Version Packages pull request changes package manifests and changelogs and adds no changeset (it consumes them), so `release:check-changeset` would fail on it. `ci.yml` ([#48](https://github.com/phmilk/reforged-ts/issues/48)) skips that one step when the pull request's head branch is `changeset-release/master`, the branch the `version` sub-action always uses; every other check runs on it as on any pull request. The App opens it, so CI does run on it.

Merge it once the release run of the latest push to `master` has finished: that run updates the pull request with every changeset on `master`. A changeset merged after it would stay pending, and when only empty changesets are pending `select-mode` answers `none` even while versions are unpublished. If that happens, delete the stranded empty changesets in a pull request (it changes no package, so it needs no changeset): the next run publishes.

### When a job fails

- `version` or `pack`: fix the cause on `master`; the next push reruns everything.
- `template-gate`: nothing was published. A fix in this repository lands on `master` and its push runs everything again; after a fix in the Template, or a moved Template ref, re-run the failed jobs of the run.
- `publish`: re-run the failed job. The packages the failed attempt did publish got their tags and releases then; npm refuses them a second time and Changesets skips them.

## Human steps

Done once each by the maintainer; every release after them is tokenless.

1. For each of the four packages, publish `1.0.0-alpha.0` from a local checkout with a granular npm token protected by 2FA, because npm configures trusted publishing only on a package that exists. The first-publish wizard ([#149](https://github.com/phmilk/reforged-ts/issues/149)) walks through steps 1 to 4 and checks what it can; apply [the first versions](#applying-the-versions) before running it.
2. On npm, add the GitHub Actions trusted publisher for each package: repository `phmilk/reforged-ts`, workflow `release.yml`, no environment.
3. On each package, enable "Require two-factor authentication and disallow tokens".
4. Revoke the token.
5. With [the workflow's prerequisites](#prerequisites-outside-this-repository) in place, run [the dry run](#the-dry-run), then merge the next Version Packages pull request to prove the tokenless publish.
6. At 1.0.0, run `pnpm changeset pre exit` in a pull request once [the checklist](#leaving-pre-mode-the-100-checklist) is green.
