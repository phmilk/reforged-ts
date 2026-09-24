---
status: accepted
date: 2026-09-23
---

# The toolchain follows typescript-to-lua's TypeScript peer, and library tests run the compiled Lua on real Lua 5.3

typescript-to-lua 1.37 pins TypeScript to exactly 6.0.2 while TypeScript 7 is already the npm `latest`, and TypeScript 6 removed the `moduleResolution: classic` this library used. We pin TypeScript to whatever tstl's peer dependency says and move only when tstl moves; we compile with `moduleResolution: bundler` and Lua as the only build target (no ESM output). The repository is a pnpm workspace (`packages/reforged-ts`, `packages/reforged-types`, later `packages/eslint-plugin-reforged`). Lint is ESLint 10 with typescript-eslint's type-checked presets, `import-x`, and Prettier 3 run as an ESLint rule, so one command lints and formats. Library tests execute the **compiled Lua** on real Lua 5.3.6 (`lua-wasm-bindings`, the VM tstl's own suite uses) with Native stubs written in Lua and tests written in TypeScript and compiled by tstl; vitest is only the host runner.

## Considered options

- Biome instead of ESLint and Prettier: its plugins are GritQL and syntactic only, so it cannot host the type- and control-flow-aware custom rules the library needs to catch desyncs before compilation.
- wasmoon (real Lua 5.4) or fengari (Lua 5.3 semantics in JavaScript, 32-bit integers) with JavaScript stubs: simpler bridges, wrong runtime. The game runs Lua 5.3.
- Testing the TypeScript sources in Node without a Lua VM: fast, but blind to everything typescript-to-lua changes (`self` parameters, 1-based arrays, string functions).
- A dual ESM/Lua build as voces/w3ts does: costs `.js` suffixes and a resolver plugin with no consumer asking for it.

## Consequences

- `npm install typescript` without a range breaks the build; the version lives in the workspace catalog.
- The test harness is in-house (about 200 lines); no tstl test runner exists.
- A spike ticket verifies `bundler` resolution, the Lua harness and the ESLint 10 stack before the migration starts; if `bundler` fails, the fallback is `nodenext` plus a `.js`-stripping tstl plugin.

Decision record: https://github.com/phmilk/reforged-ts/issues/11

## Amendment (2026-09-24)

The rule of `moduleResolution: bundler` with Lua as the only build target applies to the packages that compile to Lua. The `reforged-types` generator is a Node tool and never runs in a map. It compiles to ESM with `module` and `moduleResolution: nodenext` and runs on Node 22.13 or later. The Typings it generates are still type-checked under `bundler`, as a Map project sees them.

Amendment record: https://github.com/phmilk/reforged-ts/issues/39

## Amendment (2026-09-24)

The test harness is the workspace package `packages/reforged-test`. Its Node side, the glue vitest calls, is a Node tool and never runs in a map: like the generator, it compiles to ESM under `module` and `moduleResolution: nodenext`. Its Lua side, the runner, and its stubs stay under the Lua-only rule. The harness measured about 830 lines (glue plus runner), not the estimated 200.

Amendment record: https://github.com/phmilk/reforged-ts/issues/45
