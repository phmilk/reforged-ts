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
- Until the Template has a `v1` ref, clone its default branch instead.

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
