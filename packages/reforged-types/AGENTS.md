# reforged-types

The Typings of each supported Patch, generated from the Patch files vendored under `vendor/<Build>/` and the hand-curated Overlay under `overlay/`. Generated files (`<Game version>/`, `<Game version>.d.ts`, `async-natives.json`) are output: change them by curating the Overlay or the generator, then regenerating.

Run every command from the repository root as `pnpm --filter reforged-types <script>`. The root `package.json` belongs to the library and carries no Typings script.

## New Patch loop

Follow these steps in order for a Patch update. The loop is done when the checks of step 6 pass and one commit holds the sources, the Overlay and the output.

1. **Vendor and generate.** Pick the jass-history tag of the new Build (`Reforged-v<a.b.c.build>-...` at `github.com/Luashine/jass-history`) and run `typings:generate <tag>`. It downloads `common.j`, `blizzard.j` and `common.ai` into `vendor/<Build>/` with `provenance.json`, then regenerates every vendored Patch. Keep the previous Build vendored: the comparison in step 2 needs it.
2. **Read the output.** stdout lists, per pair of consecutive vendored Patches, the declarations only the newer one has (`In Patch <new> and not in Patch <old>`), each as `source:line: <Jass declaration>`. The checklist follows. On any error it goes to stderr and the exit code is 1; with warnings only it goes to stdout after the summary line and the exit code is 0.
   - `no Overlay entry for <Jass declaration>; expected <path>`: write the entry at that path.
   - `parameters do not match the Patch`: the Patch renamed or reordered parameters; make the entry's `params` match the Jass signature it prints (count, order, names).
   - `<file>:<line>: unknown line`: the Patch uses grammar the parser rejects; extend `src/parser.ts` with a test in `test/`, never skip the line.
   - Warnings (`orphan Overlay entry`): the entry matches no vendored Patch. See step 5.
3. **Curate.** Write one JSON per missing entry at the printed path, shaped like its neighbours in the same folder (`functions/` or `globals/`). Apply the curation rules below to every entry.
4. **Regenerate.** Run `typings:generate` (no tag) until it exits 0. Every error item of step 2 is gone; any remaining warning is accounted for in step 5.
5. **Settle the Patch metadata.**
   - Set `reforged.patch` in `package.json` and the supported Patch in `README.md` to the new Build.
   - `test/real-inputs.test.ts` and `test/package.test.ts` pin the counts and facts of the supported Patch; update them to the new Build's measured values.
   - When the new Build shares its Game version with the old one (`3.0.0.24268` then `3.0.0.24277`), the new Build generates the `3.0.0/` folder and the old one is only compared against. Delete the old Build's `vendor/` folder once `since` is set; then delete the entries its removal leaves orphaned, since only the removed Natives had them.
6. **Check.** Run `build`, `test` (which includes `typings:check`) and `verify`; all three pass.
7. **Commit** `vendor/`, `overlay/`, the generated output and the metadata of step 5 together, so `typings:check` passes at every commit.

## Curation rules

- `since`: set it to the new Build on each function and global listed in step 2 as only in the newer Patch. Leave it off where the first Patch is uncertain; a type entry has no `since`.
- `returns.nullable`: a handle-returning Native is nullable, except a converter (`Convert*`) and an enum-like constant getter. A string-returning Native follows its seeded family.
- `params[].nullable`: `false` unless the Native is documented or observed to accept nil.
- `async: true` only for a Native whose value is valid for the local player alone (`GetLocalPlayer`); `async-natives.json` is generated from these flags.
- `notes` holds a fact from the project's research, rendered as `@remarks`; no jassdoc prose, which has no license.
- `deprecated` holds the reason, rendered as `@deprecated`.
- A per-parameter `type` override holds TypeScript type text. `Condition` and `Filter` use it (`boolcode`); add another only as a reviewed curation decision.
- `origin: "war3-types-strict"` marks a seeded entry; a new entry is hand-written and has no `origin`.

## Generator changes

Test through Seam 1 (`generate()` in `src/generate.ts`) with the fixture helpers in `test/support/`: small synthetic Patch and Overlay folders in, emitted text and diagnostics asserted. `scripts/seed-from-war3-types-strict.ts` is the one-off seed import, kept for provenance; the build type-checks it but never runs it.
