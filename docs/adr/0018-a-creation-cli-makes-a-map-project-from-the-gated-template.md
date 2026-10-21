---
status: accepted
date: 2026-10-21
---

# A creation CLI, `create-reforged-map`, makes a Map project from the Template the release gate builds

Starting a map takes several commands today: **Use this template** on `phmilk/reforged-ts-template` (a GitHub account), a clone, `pnpm install`, `pnpm template:detach`, then a commit of what it deleted. Missing one leaves the Template maintenance files (the tracker docs, the sync script, the Template-only workflows) in the new project, which also keeps the Template's name in its `package.json` and README. ADR 0006 deferred a scaffolder until the Template was stable, for one more artefact to keep in sync. The Template now holds its maintenance list in `template-maintenance.json` and removes it with its own `pnpm template:detach` (phmilk/reforged-ts-template#93), and the maintainer decided a one-command start is worth building (#549).

We decide that a creation CLI, `create-reforged-map`, is a package of this monorepo, released by the same changesets as the others so that it ships in step with the Template the release gate builds. `npx create-reforged-map@next my-map` and `pnpm create reforged-map@next my-map` make a ready Map project: the CLI downloads the Template at `v<major>`, the line the release gate checks out for the library's major (`templateRef`), writes it into the new folder, initialises git, installs, runs the Template's own `pnpm template:detach` and makes a first commit, with no GitHub account. It embeds no Template file and keeps no copy of the maintenance list, so nothing is copied twice and nothing drifts; the Template gate runs the packed CLI on every release, so a change to the Template that breaks it does not ship. Its behaviour lives in one module, `create`, that takes the answers, a Template source and a `Runner`, so its tests run on a Template archive built in the test, with no network and no process. **Use this template** stays documented as the other way in.

## Considered options

- A `create-reforged-ts` scaffolder, the name ADR 0006 used. Both names are free on npm (checked on 2026-10-21); `create-reforged-map` says what it makes, a Map project.
- Embedding the Template's files in the CLI. One `npx` with no download, but two copies of the Template to hold equal, the drift ADR 0006 feared.
- Downloading the Template's default branch. It is ahead of what the last release gated; `v<major>` is the line the release gate built with the packed packages.
- A repository of its own for the CLI. It would release apart from the library and the Template gate could not run the CLI of the same release.
- Leaving the Template maintenance out by a list in the CLI. The Template's manifest stays the one list; the CLI runs `template:detach` and reads nothing from the manifest.

## Consequences

- The workspace publishes a seventh package once the Template gate covers the CLI (#663); until then it is private and nothing releases it.
- The CLI carries the Template ref as a constant, which a test holds equal to `templateRef` of the library's version.
- The Template keeps three anchors the CLI writes at (`package.json`'s `name` and `description`, the README's title, `AGENTS.md`'s "Your project"); a missing anchor fails the creation and the Template gate.
- The map folder keeps the Template's name until the Template's tests read it from `reforged.config.ts`.
- The CLI is a convenience, never a boundary: the Template stays public and can be cloned or used as a template, so the guards of the Template-only workflows hold whatever the CLI does (ADR 0017).

Decision record: https://github.com/phmilk/reforged-ts/issues/657
