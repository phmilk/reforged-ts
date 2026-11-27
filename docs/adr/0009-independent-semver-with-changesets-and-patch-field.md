---
status: accepted
date: 2026-09-23
---

# Packages are versioned independently with Changesets, and each one declares the game Patch it supports

The workspace publishes four packages that change for different reasons: the Typings follow game Patches, the library follows features, the test harness and the lint plugin follow both. We version them independently with semver, all starting at 1.0.0, and drive releases with Changesets: every pull request carries a changeset, CI maintains a "Version Packages" pull request, and merging it publishes to npm through trusted publishing (OIDC, automatic provenance; the very first publish of each package is manual because npm configures trusted publishing on an existing package), creates GitHub Releases and per-package tags. Each `package.json` declares the minimum supported game Patch in a `reforged.patch` field; a Patch that adds natives is a minor everywhere, a Patch that breaks a native the public API depends on is a library major only when the public API breaks. The compatibility matrix is generated from those fields at release, never written by hand. A major changeset cannot merge without its migration page and its `renames.json` entries.

## Considered options

- Lockstep versioning (one version for all packages): simpler matrix, but forces Typings bumps for library changes and library bumps for Patch-only Typings changes.
- Semantic-release over conventional commits: automatic, but the changelog text is the commit subject and the monorepo support is weaker than Changesets'.
- Versioning the library after the game (`3.0.x`): couples semver to Blizzard's numbering and cannot express a generator fix or an API break.

## Consequences

- The first release of each package requires a human with an npm token and 2FA once; every later release is tokenless.
- A renamed public symbol without a `renames.json` entry blocks the release; the lint and the migration guide read the same file.
- Fixes go only to the latest minor of the latest major; the docs site keeps three minors per major.
- During the build phase the `next` dist-tag carries `1.0.0-alpha.N` so the Template develops against real packages.

Decision record: https://github.com/phmilk/reforged-ts/issues/25

## Amendment (2026-11-27)

[ADR 0031](0031-a-releases-channel-follows-the-branch-it-runs-from.md) decides a release's dist-tag by the branch it runs from. The consequence "during the build phase the `next` dist-tag carries `1.0.0-alpha.N`" no longer holds: a release from `master` publishes on `latest`, the alphas of the build phase included, so the Template and every Map project install the current alpha without `@next`. The `next` dist-tag carries the prereleases of a major prepared on the Next branch.

Amendment record: https://github.com/phmilk/reforged-ts/issues/1062
