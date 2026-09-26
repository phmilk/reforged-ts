---
name: add-lint-rule
description: Add a lint rule to eslint-plugin-reforged end to end, from the pitfall to the changeset. Use when asked to guard a pitfall at lint level, or to add a rule to eslint-plugin-reforged.
---

# Add a lint rule

One pull request adds one rule, and everything the rule needs lands with it. The how of each step lives in [Adding or changing a rule](../../../packages/eslint-plugin-reforged/AGENTS.md#adding-or-changing-a-rule) of the plugin's `AGENTS.md`: read that section, the Layout above it and [Data files](../../../packages/eslint-plugin-reforged/AGENTS.md#data-files) below it before step 1. Work on a branch from `master` and run every command from the repository root. Paths below are relative to `packages/eslint-plugin-reforged/`, except the root `.changeset/`.

## Steps

1. **Name the rule and its pitfall.** Name it in kebab-case like the files under `src/rules/`: `prefer-<replacement>` when the pattern is sound except that a library replacement exists (`prefer-handle-map`), otherwise `no-<pattern>`. State the pitfall it catches in one sentence with its catalogue id, a D, C or L heading of #15's catalogue (`git show origin/research/wc3-lua-pitfalls:docs/research/wc3-lua-pitfalls.md`). Take the severity the issue asking for the rule decided: `error` for a pattern that desyncs, crashes or leaks with certainty, `warn` for one wrong in most contexts (spec #50). When the issue decides no severity, or the catalogue has no entry for the pitfall, ask the maintainer before step 2. Done when `src/rules/<rule>.ts` is a new file whose header comment holds the sentence, the id and the severity, as the other rule files do; the docs page and the changeset reuse them.
2. **Write the rule** (steps 1 and 2 of the section). Make it with `createRule`, which gives it its versioned docs URL. Offer a suggestion when a replacement keeps behaviour; `fixable` belongs to `no-legacy-w3ts-names` alone. When the rule reads a data file, do step 6 now, then return: the rule, its fixtures and the rule-table test need the data. Done when `pnpm --filter eslint-plugin-reforged typecheck` exits 0.
3. **Register it** (steps 3 and 4). The registry line puts the rule in `configs.recommended` at its severity. Done when `pnpm --filter eslint-plugin-reforged test plugin.test` fails only on the new rule's docs page, which step 5 writes.
4. **Write the fixtures** (step 5). Done when `pnpm --filter eslint-plugin-reforged test rules/<rule>.test` passes, every message id of `meta.messages` appears in an invalid case, and every option of `schema` in a valid case.
5. **Write the docs page** (step 6). Its summary and "Why" carry the sentence and catalogue id of step 1. Done when `pnpm --filter eslint-plugin-reforged test plugin.test` passes and the rules table of `README.md` lists the rule under its severity.
6. **Add or extend the data file** (step 7), when the rule reads one. Done when `pnpm --filter eslint-plugin-reforged test test/data.test` passes, or the rule reads no data file.
7. **Add the changeset** (step 8): a minor for `eslint-plugin-reforged`, whose text names the rule, its severity and what it reports, written for the Map project author ([Adding a changeset](../../../docs/release.md#adding-a-changeset)). Add it without the prompt: `pnpm changeset add --minor eslint-plugin-reforged -m "<text>"`. Done when the root `.changeset/` holds the new file with `"eslint-plugin-reforged": minor`.
8. **Check.** Run `pnpm check`. When the rule asks the checker more than the rules before it, run `pnpm --filter eslint-plugin-reforged measure-cost` too (see "Cost" under the plugin's [Commands](../../../packages/eslint-plugin-reforged/AGENTS.md#commands)). Done when `pnpm check` exits 0 and, when `measure-cost` ran, its median overhead is under one fifth.

## Done

The rule is added when the plugin's [Definition of done](../../../packages/eslint-plugin-reforged/AGENTS.md#definition-of-done) holds: its fixtures pass, `configs.recommended` sets it at its severity and the rule-table test says so, its docs page and README row exist, the minor changeset of step 7 is present, and `pnpm check` is green.
