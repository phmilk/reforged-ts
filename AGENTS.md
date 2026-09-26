# reforged-ts

TypeScript API for Warcraft III custom maps, compiled to Lua with typescript-to-lua. A fork of [cipherxof/w3ts](https://github.com/cipherxof/w3ts) targeting Warcraft III 3.0.0 and later. The project vocabulary lives in `CONTEXT.md`; use its terms.

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues and are driven with the `gh` CLI. The wayfinder map for the first release is issue #1; its tickets are sub-issues with native "blocked by" dependencies. The Template's issues live in `phmilk/reforged-ts-template`. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage labels are used as-is: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. Two kind labels sit next to them: `spec` on an issue created with `to-spec`, `ticket` on one created with `to-tickets`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` at the repo root and ADRs under `docs/adr/`. See `docs/agents/domain.md`.

## Changesets

Every pull request adds one changeset under `.changeset/`, without the prompt: `pnpm changeset add --minor <package> -m "<changelog entry>"` (`--major`, `--minor`, `--patch` take comma-separated package names), or `pnpm changeset add --empty` for a change that publishes nothing. The file shape, pre mode and the release steps are in `docs/release.md`.

## Packages

Before changing a package, read its nested `AGENTS.md` when it has one: `packages/reforged-types` (the Typings generator) and `packages/eslint-plugin-reforged` (the lint rules of the Guards: adding or changing a rule, its fixtures, docs page and data files).
