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

Alphas go to npm under the `next` dist-tag, so a Map project installs one with `pnpm add reforged-ts@next`. Changesets refuses `changeset publish --tag` in pre mode and when publishing from packed tarballs, so the tag is not a command-line option: the release workflow writes `next` into the `tag` of each entry of the publish plan (`publish-plan.json`) before publishing.

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

When the release workflow is already on `master`, its Version Packages pull request carries the same result and can be merged instead.

## Leaving pre mode: the 1.0.0 checklist

Checked by hand, then `pnpm changeset pre exit` in a pull request; the next Version Packages pull request releases 1.0.0 of every package, with the changelogs of every alpha rolled in, on `latest`.

- [ ] The eight build steps of [#14](https://github.com/phmilk/reforged-ts/issues/14) are merged.
- [ ] The TSDoc gate is at error and green.
- [ ] The Template gate is green on the last alpha.
- [ ] The docs site is deployed green from `master`.
- [ ] The compatibility matrix generator produces the 1.0.0 row without error.
- [ ] The migration page for w3ts 3.x to reforged-ts 1.0 is present with its `renames.json` entries (the major-changeset gate checks this mechanically: it treats the first stable release of `reforged-ts` as a major).

## Support window

Fixes land only on the latest minor of the latest major. There are no maintenance branches and no backports: a bug found in 1.2 once 1.3 is out is fixed in the next 1.3 patch (or whatever is latest), and 1.2 gets no more releases. Releases are only ever cut from `master`.

## Human steps

Done once each by the maintainer; every release after them is tokenless.

1. For each of the four packages, publish `1.0.0-alpha.0` from a local checkout with a granular npm token protected by 2FA, because npm configures trusted publishing only on a package that exists. The first-publish wizard ([#149](https://github.com/phmilk/reforged-ts/issues/149)) walks through steps 1 to 4 and checks what it can; apply [the first versions](#applying-the-versions) before running it.
2. On npm, add the GitHub Actions trusted publisher for each package: repository `phmilk/reforged-ts`, workflow `release.yml`, no environment.
3. On each package, enable "Require two-factor authentication and disallow tokens".
4. Revoke the token.
5. Run the release workflow's dry run, then merge the next Version Packages pull request to prove the tokenless publish.
6. At 1.0.0, run `pnpm changeset pre exit` in a pull request once [the checklist](#leaving-pre-mode-the-100-checklist) is green.
