---
name: add-lint-rule
description: Add a rule to eslint-plugin-reforged with its fixtures, docs page, data file, recommended-config entry and changeset. Use when asked to guard a pitfall at lint level, or to add a rule to eslint-plugin-reforged.
---

# Add a lint rule

One pull request adds one rule, and everything the rule needs lands with it. The how of each step lives in [Adding or changing a rule](../../../packages/eslint-plugin-reforged/AGENTS.md#adding-or-changing-a-rule) of the plugin's `AGENTS.md`; this skill follows its order and names the step it scripts. Read that section, the Layout above it and [Data files](../../../packages/eslint-plugin-reforged/AGENTS.md#data-files) below it before step 1. Run every command from the repository root. Paths below are relative to `packages/eslint-plugin-reforged/`.

## Steps

1. **Name the rule and its pitfall.** Name it in kebab-case like the rules in `src/rules/index.ts`: `no-<pattern>` when it reports a pattern, `prefer-<replacement>` when it steers to a replacement. Write the pitfall it catches in one sentence ending with its catalogue id, a D, C or L heading of #15's catalogue (`git show origin/research/wc3-lua-pitfalls:docs/research/wc3-lua-pitfalls.md`). Take the severity the issue asking for the rule decided: `error` for a pattern that desyncs, crashes or leaks with certainty, `warn` for one wrong in most contexts (spec #50). When the issue decides no severity, or the catalogue has no entry for the pitfall, ask the maintainer before step 2. Done when the name matches no file under `src/rules/`, and the sentence, its id and the severity are written down: the docs page and the changeset reuse them.
2. **Write the rule.** Create `src/rules/<rule>.ts` by steps 1 and 2 of the section. Make it with `createRule`, which gives it its versioned docs URL, and offer the replacement as a suggestion: `fixable` belongs to `no-legacy-w3ts-names` alone. A rule that reads a data file the plugin does not load yet needs its parser first: do step 6 now, then return. Done when `pnpm --filter eslint-plugin-reforged typecheck` exits 0.
3. **Register it.** Add the registry line (step 3), which puts the rule in `configs.recommended` at its severity, then update the rule-table test (step 4). Done when `pnpm --filter eslint-plugin-reforged test plugin.test` fails only on the new rule's docs page, which step 5 writes.
4. **Write the fixtures.** Create `test/rules/<rule>.test.ts` with the cases step 5 of the section lists: valid and invalid, each suggestion's output, the escape and the severity through `lintWithRecommended`. Done when `pnpm --filter eslint-plugin-reforged test rules/<rule>.test` passes and every branch of the rule (each report, each early return, each option) has a case that reaches it.
5. **Write the docs page.** Copy the template and add the README row (step 6). The summary and "Why" carry the sentence and catalogue id of step 1. Done when `pnpm --filter eslint-plugin-reforged test plugin.test` passes and the rules table of `README.md` lists the rule under its severity.
6. **Add or extend the data file**, when the rule reads one (step 7). A new file gets its parser, its shape tests and a row in Data files; an existing file gains entries, each with its reason. Done when `pnpm --filter eslint-plugin-reforged test data.test` passes, or the rule reads no data file.
7. **Add the changeset** (step 8): a minor for `eslint-plugin-reforged`, whose text names the rule, its severity and what it reports, written for the Map project author ([Adding a changeset](../../../docs/release.md#adding-a-changeset)). Add it without the prompt: `pnpm changeset add --minor eslint-plugin-reforged -m "<text>"`. Done when `.changeset/` holds the new file with `"eslint-plugin-reforged": minor`.
8. **Check.** Run `pnpm check`. When the rule asks the checker more than the rules before it, run `pnpm --filter eslint-plugin-reforged measure-cost` too and keep the overhead under the budget of "Cost" in the plugin's [Commands](../../../packages/eslint-plugin-reforged/AGENTS.md#commands). Done when `pnpm check` exits 0.

## Done

The rule is added when the plugin's [Definition of done](../../../packages/eslint-plugin-reforged/AGENTS.md#definition-of-done) holds: its fixtures pass, `configs.recommended` sets it at its severity and the rule-table test says so, its docs page and README row exist, the minor changeset of step 7 is present, and `pnpm check` is green.
