---
name: new-patch
description: Adopt a new game Patch end to end, from the Typings to the pull request. Use when handed a new Patch or Build, a jass-history tag, or a "New Patch detected" issue.
---

# New Patch

One pull request adopts one Patch. The detail of each step lives in two documents this skill points at: the New Patch loop and the Curation rules of `packages/reforged-types/AGENTS.md`, and "The `reforged.patch` field" and "Choosing the bump for a Patch" of `docs/release.md`. Read both sections of the nested `AGENTS.md` before step 1. Run every command from the repository root, on a branch from `master`.

## Steps

1. **Vendor and generate.** Take the jass-history tag you were handed or the issue names; for a Build without its tag, find it in `gh api "repos/Luashine/jass-history/tags?per_page=100" --jq ".[].name"`. Run `pnpm typings:generate <tag>` and keep its whole output, stdout and stderr: it is the failure list. Done when the output prints `Vendored <tag>: Patch <Build> at commit <sha>` and `packages/reforged-types/vendor/<Build>/` holds the three Patch files and `provenance.json`, next to the previous Build's folder (loop step 1).
2. **Read the failure list.** Sort its items as loop step 2 says: the declarations only the new Patch has, then each checklist item. Done when every item has its kind and the fix it needs.
3. **Curate.** Write one Overlay entry per missing Native at the path its item prints, by the Curation rules; fix the other error items as loop step 2 says. Done when every error item of the failure list has its entry or fix.
4. **Regenerate.** Run `pnpm typings:generate` without the tag, returning to step 3 for whatever it still prints. Done when it exits 0 and every remaining warning is accounted for (loop step 5).
5. **Review the generated diff.** Compare the new output with the old: `git diff -- packages/reforged-types/<Game version>` when the new Build keeps the Game version, `git diff --no-index packages/reforged-types/<old Game version> packages/reforged-types/<new Game version>` when it opens a new one. Find every signature change (a parameter, a return type, a nullability), removal and hierarchy change (the `extends` of a handle type). Record each as **breaking** when code that compiled against the old Typings may no longer compile, else **additive**. Done when every changed declaration of the diff is on the record with its verdict.
6. **Cover the new Natives.** This step applies once the Wrapper coverage report lands (#163), when the root `package.json` has `coverage:report`; until then, say in the pull request that it waits for #163. Run `pnpm coverage:report`. Wrap each new Native a Wrapper owns with the `add-wrapper` skill, or exclude it in the report's exclusions with a reason naming its tracking issue (`gh issue create` when none exists). Done when the report lists none of the new Natives as missing.
7. **Bump `reforged.patch`.** Move the fields and the rest of the Patch metadata as loop step 5 and "Which fields move" of `docs/release.md` say. Done when `pnpm release:check-patches` exits 0 and names the new Build for `reforged-types` and `reforged-ts`.
8. **Write the changesets.** Give each package its bump by "Choosing the bump for a Patch" of `docs/release.md`, from the record of step 5 and the Wrappers of step 6, and name each breaking change in the text. Add them without the prompt ("Adding a changeset"). Done when `pnpm release:check-changeset` exits 0 and a changeset names every breaking change of the record.
9. **Check and commit.** Run `pnpm check` and `pnpm --filter reforged-types verify`, then commit as loop step 7 says. Done when both exit 0 and `git status` is clean.
10. **Open the pull request** against `master` with `gh pr create`. Its body turns the failure list into a checklist, one checked box per item with its fix, and carries the record of step 5 and the outcome of step 6; it closes the "New Patch detected" issue when there is one. Done when the pull request exists and every item of the failure list is a checked box.

## Done

The Patch is adopted when `pnpm typings:generate` and `pnpm typings:check` exit 0, the coverage report lists no new Native as missing (once #163 lands), `pnpm release:check-patches` names the new Build, and the changesets of step 8 are committed.
