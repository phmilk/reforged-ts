# The library's tests

Two kinds of test live here, and `pnpm test` at the root runs both in one vitest run (projects `reforged-ts` and `reforged-ts-node` of the root `vitest.config.ts`).

| Folder     | What                                                      | Compiled by                                   | Runs on                   |
| ---------- | --------------------------------------------------------- | --------------------------------------------- | ------------------------- |
| `.` (this) | Lua tests, `*.test.ts`, and their helpers in `support/`   | typescript-to-lua (`tsconfig.json`)           | the reforged-test harness |
| `harness/` | The global setup that compiles the Lua tests and the spec | vitest, from source (`harness/tsconfig.json`) | Node                      |
| `node/`    | Node tests of the package, `*.test.ts`                    | vitest, from source (`node/tsconfig.json`)    | Node                      |

`tsconfig.json` here excludes `harness/` and `node/`, so typescript-to-lua never compiles a Node file. A new Lua test is a `*.test.ts` file in this folder (or a subfolder other than those two); a new Node test is a `*.test.ts` file under `node/`. Each folder's `tsconfig.json` is the one the editor and the lint's project service find for its files.

## Lua tests

Written as the [reforged-test README](../../reforged-test/README.md) describes: `/** @noSelfInFile */`, the runner from `reforged-test/lua`, the library through relative imports into `../src`. The helpers in `support/` are compiled with them:

- `defined(value, what)`: the value of a factory or lookup that may return undefined, or an error naming it.
- `handleRef(kind, handle)`: a handle as the call log renders it, `timer#1048578`.
- `withNative(name, replacement, body)`: the per-test Native override (below).
- `raisedIn(call)`: the message of the error `call` raised, bare only when Lua's `file:line:` position for it lies inside `call`; how a test proves a creation error points at the line that called the creation member (below).
- `withPrint(body)`: the lines `body` printed, with `print` put back afterwards; how a test asserts on the failure line of an Init stage callback.
- `reloadModules(family, entry)`: runs a family of the library's modules again in the same Lua state (`reloadModules("src.init.", "src.init.index")`) and returns the entry's new exports; how a test stands in for a root that executes twice.
- The editor's script, stubbed (`editor-script.ts`): `defineEditorScript(names)` defines the named entry points (`config`, `main`, `InitBlizzard`, `InitGlobals`, `InitCustomTriggers`, `RunInitializationTriggers`, `MarkGameStarted`) as functions that log their names on `editorLog`, `main` calling the init functions it finds. The library wraps them when it loads, so a test imports one of the modules that call it ahead of the library: `bundle-position.ts` (all but `InitBlizzard`), `bundle-position-without-triggers.ts` (no `InitCustomTriggers`), `entry-points.ts` (`config` and `main`) or, for the map header position, `header-position.ts` (only `InitBlizzard`, `InitGlobals` and `MarkGameStarted`; the test defines the rest itself afterwards). `header-position-with-metatable.ts` also installs `mapMetatable` on `_G` ahead of the library, logging the reads of absent globals and the writes of new ones on `mapMetatableLog`, as an undeclared-global warner would.

Stub helpers the tests call (`__stub_fire_timer`, `__stub_record`) are declared in `stubs.d.ts`.

### Overriding a Native for one test

`withNative` replaces one Native global for the length of `body` and puts back what was there before (the stub, or nil), also when `body` throws. It returns what `body` returns. The replacement's calls are recorded in the call log like any stub's, so `toContainCall` still sees them, and it may return nil even where the Typings say the Native never does:

```ts
const item = withNative(
  "UnitItemInSlot",
  () => undefined,
  () => unit.getItemInSlot(2),
);
expect(item).toBeUndefined();
expect(stubCalls()).toContainCall(`UnitItemInSlot(${unitRef}, 2)`);
```

Use it instead of editing the shipped stub files when one test needs a Native to fail or to return a handle it controls.

### Where a creation error points

A creation member throws `reforged-ts: failed to create <Wrapper> (<detail>)` at the Map project's line that called it. `toThrow` only matches a substring, so it cannot tell a right error level from a wrong one; `raisedIn` can. Make the creation call as a statement inside `call`, never as its return value (a returned call is a Lua tail call that drops `call`'s frame), and compare the bare message:

```ts
const message = withNative(
  "CreateTimer",
  () => undefined,
  () =>
    raisedIn(() => {
      Timer.create();
    }),
);
expect(message).toEqual("reforged-ts: failed to create Timer");
```

An error that points into the library comes back as `src/handles/handle.lua:84: reforged-ts: …`, and one with no position as `(no position) reforged-ts: …`, so the comparison fails for either wrong level.

## Node tests

### Declaration fixtures

`node/declarations.test.ts` emits the library's declarations from the sources, installs them with the package's `package.json` in a temporary Map project (with `reforged-types/3.0.0` and the typescript-to-lua language extensions in `types`) and type-checks every file under `node/fixtures/declarations/` there with the workspace TypeScript.

- A file in `positive/` must produce no diagnostic.
- A file in `negative/` states each error it expects with a trailing comment on the offending line, `// error TS2322` (several codes separated by spaces), and must produce exactly those: a diagnostic not stated fails the test, and so does a stated one that does not occur.

A fixture imports the library as a Map project does, `import { Unit } from "reforged-ts"`, and is a module (it has an `export`). In the editor and the lint, `node/fixtures/declarations/tsconfig.json` maps `reforged-ts` to the sources.

### The rename map

`node/renames.test.ts` validates `migration/renames.json`, the removed and renamed symbols the migration guide and the legacy-names lint rule read, through the loader in `node/support/renames.ts`: the file must match `migration/renames.schema.json`, every entry must carry the first release's version pair (`w3ts@3` to `reforged-ts@1`), no `old` symbol may appear twice, every replacement in `new` must be a class or a public static or instance member of one in the library's emitted declarations, and every member a build step removes must have an entry. A step that removes or renames a public symbol appends its entries to the map and its list of removed members to the test, and its behaviour changes that are not renames to `migration/behaviour-changes.md`.
