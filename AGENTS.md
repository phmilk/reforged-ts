# reforged-ts

## Overview

reforged-ts is a TypeScript API over the Natives of Warcraft III 3.0.0 and later, compiled to Lua with typescript-to-lua; a fork of [cipherxof/w3ts](https://github.com/cipherxof/w3ts). The workspace publishes four packages: the library (Wrappers and Systems), the Typings, the Lua test harness and the lint plugin (the lint layer of the Guards). The Template (`phmilk/reforged-ts-template`) is the Reference consumer every library release must build. The Template's `AGENTS.md` is a Seed that becomes a Map project's own file; this file is not a Seed. `CONTEXT.md` is the vocabulary: use its terms.

## Commands

Run each from the repository root; `package.json` holds what each one runs.

- `pnpm check`: before you report a task done (see "Definition of done").
- `pnpm build`: after changing a package another one consumes, before running that one's tests on their own.
- `pnpm test`: after a change, for every vitest project and the Typings drift check. One package's scripts and tests: the README's "Commands".
- `pnpm format`: when `pnpm lint` reports formatting or a fixable finding.
- `pnpm typecheck`: while you edit, faster than a full check.
- `pnpm typings:generate`: after an Overlay edit or for a new Patch; the loop is in `packages/reforged-types/AGENTS.md`.
- `pnpm changeset add`: the changeset of a pull request. Run it without the prompt, as `docs/release.md` ("Adding a changeset") shows.

## Layout

- `packages/reforged-ts/`: the library, the Wrappers and Systems, and under `examples/` the compiled files every `@example` includes.
- `packages/reforged-types/`: the Typings, their generator and the Overlay. Read its `AGENTS.md` before changing the package.
- `packages/reforged-test/`: the Lua test harness the library's tests run on.
- `packages/eslint-plugin-reforged/`: the lint layer of the Guards. Read its `AGENTS.md` before adding or changing a rule, its fixtures, docs page or data files.
- `website/`: the pages of the docs site.
- `docs/adr/`: the decisions, numbered. `docs/research/`: the research they rely on (the probe map of the game's Lua).
- `docs/release.md`: changesets, versions and the release workflow.
- `release/`: the release scripts, a private workspace package.
- `test/`: the workspace-level tests: the tarballs, and under `conventions/` the checks on this file and the editor settings.
- `.claude/skills/`: the Agent skills, listed under "Agent skills".

## Rules

- Every public symbol carries TSDoc with the tags the [required-tag matrix](https://github.com/phmilk/reforged-ts/issues/18) sets for its kind (ADR 0004).
- Every member backed by a Native carries `@native` naming the Natives behind it.
- `*BJ` functions are never mirrored: what one offers is reimplemented over Natives (ADR 0008).
- A Wrapper covers every Native whose first parameter is its Handle type, or excludes it with a reason (ADR 0008).
- Every pull request carries a changeset, the empty one when nothing published changes (`docs/release.md`).
- Every `@example` is included with `{@includeCode}` from a compiled file under `packages/reforged-ts/examples/` (ADR 0004).
- Library code follows the README's "Rules for library code": read them before writing a Wrapper or a System.

## Runtime constraints

The game's Lua, as measured by the probe map (`docs/research/probe-map.lua`, results in #9):

- Lua is 5.3: `<const>`, `<close>` and `coroutine.close` are 5.4 and do not exist.
- Integers are 32-bit and wrap (`math.maxinteger + 1` is `-2147483648`): keep integer arithmetic inside that range.
- `debug`, `require`, `package`, `io`, `collectgarbage`, `dofile`, `loadfile`, `os.getenv` and `warn` do not exist: code and tests use the rest of the standard library.
- `load` works.
- `pairs` order is deterministic per game build but not guaranteed: iterate `SyncedMap` and `SyncedSet` wherever the order reaches game state.
- `config` runs before `main`. `InitGlobals`, `MarkGameStarted` and `InitBlizzard` exist before the map script and the rest is defined after it, so Native calls wait for an Init stage.
- Handle identity is stable across Natives: a Handle is a safe table key.
- Handle ids are not recycled immediately and are never data: key on the Handle, not on its id.
- The World Editor crashes on save when a pasted script contains a percent character: build one with `string.char(37)`.
- Async Natives (`GetLocalPlayer` and every Native the Typings mark `@async`) feed visuals only, never game state.

## Agent skills

### Domain docs

Single-context: `CONTEXT.md` at the repo root and ADRs under `docs/adr/`. See `docs/agents/domain.md`.

### Issue tracker

Issues live in this repo's GitHub Issues and are driven with the `gh` CLI. The wayfinder map for the first release is issue #1; its tickets are sub-issues with native "blocked by" dependencies. The Template's issues live in `phmilk/reforged-ts-template`. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage labels are used as-is: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. Two kind labels sit next to them: `spec` on an issue created with `to-spec`, `ticket` on one created with `to-tickets`. See `docs/agents/triage-labels.md`.

### Skills

One line per Agent skill: its `SKILL.md`, then its trigger. When your agent does not load skills, read the `SKILL.md` whose trigger matches the task and follow its steps.

- [new-patch](.claude/skills/new-patch/SKILL.md): adopt a new game Patch, from a jass-history tag or a "New Patch detected" issue.

## Definition of done

- `pnpm check` is green.
- A changeset is present: one naming each changed package, the empty one when no package changed.
- Every new public symbol carries its TSDoc and a compiled example.
