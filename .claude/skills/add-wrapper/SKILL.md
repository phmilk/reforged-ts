---
name: add-wrapper
description: Cover a Native in the library end to end, from its owner to the changeset. Use when asked to cover a Native, to add a member to a Wrapper, or to close a Native the Wrapper coverage report lists as missing.
---

# Add a Wrapper member

One member covers one Native, or one family of Natives that differ only by optional parameters (ADR 0008). The rules each step applies live behind its pointers: [ADR 0008](../../../docs/adr/0008-wrapper-coverage-rule-and-no-bj-mirroring.md) and its amendment for ownership, the doc comment of `Handle` in `packages/reforged-ts/src/handles/handle.ts` and the README's "Rules for library code" for the member's shape, [ADR 0003](../../../docs/adr/0003-creation-throws-lookup-returns-undefined.md) for its error mode, [`docs/documentation.md`](../../../docs/documentation.md) for its doc comment and example, and `packages/reforged-ts/test/README.md` for its test. Work on a branch from `master` and run every command from the repository root.

## Steps

1. **Find the owner.** Run `pnpm coverage:report`. While a Native is missing it exits 1 and prints it as `missing: <Wrapper> (<handle type>): <Jass declaration>`: that Wrapper owns it. Ownership is the amendment of ADR 0008 (the first parameter's handle type, else the returned wrapped type), read from the Native's entry in `packages/reforged-types/<Game version>/manifest.json`; the Wrapper's class is the one whose doc comment carries `@native <handle type>`. Done when the Native is printed as missing under its Wrapper. When the report lists it as covered in `wrapper-coverage/report.md`, it already has its member and nothing is added; when it is unowned, it is for a System or stays in the Typings: stop and say so.
2. **Check the Overlay entry.** Read `packages/reforged-types/overlay/<source>/functions/<Native>.json` against the Curation rules of `packages/reforged-types/AGENTS.md`: the return's and each parameter's `nullable`, and `async` (absent means not async). When one is wrong or missing, fix the entry first and regenerate as steps 3 and 4 of its New Patch loop say; the fix adds a `reforged-types` changeset in step 7. Done when the entry states nullability and `async` as the rules set them and `pnpm typings:check` exits 0.
3. **Add the member** to the owner's file under `packages/reforged-ts/src/`:
   - its name follows the members next to it: the Native's verb and noun without the handle type (`SetSoundChannel` is `sound.setChannel`), a getter and setter pair for a value both read and written;
   - its shape follows the Handle base: a lookup returns `this.fromHandle(...)`, typed `X | undefined`; a creation returns `this.expect(...)`, non-null, and throws (ADR 0003); a Native allocating another Wrapper's Handle goes through that Wrapper's `expect`;
   - its doc comment carries the tags of the [required-tag matrix](../../../docs/documentation.md#required-tags-per-symbol-kind) for its kind: `@native` always, `@patch` when the `since` of its manifest entry is above 3.0.0.24268, `@async` when `packages/reforged-types/async-natives.json` lists it, `@throws` on a creation.

   Done when `pnpm typecheck` exits 0 and `pnpm docs:audit handles/<file>.ts` reports no finding.

4. **Show a class-level feature.** When the member is one a reader of the class looks for (a factory, a new way to use the Wrapper), write or extend a region of the class's example under `packages/reforged-ts/examples/harness/` and include it in the class's `@example`, as [Examples](../../../docs/documentation.md#examples) says; a plain getter, setter or action needs none. Done when `pnpm examples:build` exits 0, or the member needs no example.
5. **Test it on the harness.** Add one `nativeCase` to the `describeNatives` table of the Wrapper's test file, `packages/reforged-ts/test/<file>.test.ts` (The gap suites): its `line` asserts the arguments the member passes to the stubbed Native. A lookup's case sets `returns` to the Wrapper, asserting registry identity, and a second case has the Native answer nil; a creation adds a `raisedIn` test beside the table. The Lua tests all run through one harness spec, so one file's tests run by name: `pnpm exec vitest run --project reforged-ts packages/reforged-ts/test/harness/lua.spec.ts -t "<file>.test"`. Done when that run passes, lists the new case, and fails with the member's Native call removed.
6. **Close the report.** Run `pnpm coverage:report`; it rewrites `wrapper-coverage/report.json` and `report.md`, which the pull request commits. A Native that cannot be wrapped is excluded instead, in `wrapper-coverage/exclusions.json` with the source the amendment of ADR 0008 requires, and gets no member. Done when the report prints `0 missing; 0 problems` and `report.md` names the member's class as covering the Native, or names its exclusion.
7. **Add the changeset** without the prompt, as "Adding a changeset" of `docs/release.md` shows: `--minor reforged-ts` for a new member, `--patch reforged-ts` for a fix of one, its text naming the member and what it does for a Map project author. Done when `.changeset/` holds the new file.
8. **Check.** Run `pnpm check`. Done when it exits 0.

## Done

The Native is covered when `pnpm coverage:report` lists it as covered by the member's class (or excluded with its source), `pnpm check` exits 0, and the changeset of step 7 is committed.
