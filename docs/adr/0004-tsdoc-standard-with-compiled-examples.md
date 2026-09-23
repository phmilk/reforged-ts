---
status: accepted
date: 2026-09-23
---

# Doc comments follow TSDoc with declared custom tags, examples are included from compiled files, and library coverage is gated

The public API of a binding library is almost as wide as its implementation, so documentation is most of the product; today 19% of the library's exported members are documented, and the community's annotated native docs (jassdoc) cannot be reused for lack of a license. We write every doc comment in TSDoc syntax, validated by `eslint-plugin-tsdoc` against one `tsdoc.json` shared with TypeDoc, with four declared custom tags (`@native`, `@patch`, `@async`, `@bug`) and `@since` meaning the library version. Every `@example` is included by reference (`{@includeCode}`) from files under `packages/reforged-ts/examples/` that CI compiles with typescript-to-lua and, where the game is not needed, runs on the Lua test harness. Coverage of the library's exported symbols and public members is enforced by `require-jsdoc` and by TypeDoc's `notDocumented` validation, which fails the docs build. The generated Typings carry signature-derived headers only.

## Considered options

- Inline example code inside doc comments: quickest to write, silently rots; rejected because documentation must be kept current by automation.
- JSDoc dialect without a `tsdoc.json`: tolerant of the existing `@note`/`@bug` usage, but no syntax validation and no shared tag vocabulary for TypeDoc.
- Hand-written descriptions for all 1,681 natives in the Typings: out of proportion for the first release.

## Consequences

- A tag not declared in `tsdoc.json` is a lint error, so vocabulary changes are deliberate.
- Undocumented public members break the docs build once the gate is switched to error (build step 8).
- Example files are part of the test surface and must keep compiling across releases.
- `@async` on a native is machine-readable input for a lint rule that flags local-player values used as game state.

Decision record: https://github.com/phmilk/reforged-ts/issues/18
