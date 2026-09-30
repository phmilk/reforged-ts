# The Probe runner

A private workspace package, never published. A **Probe** is a TypeScript file that runs in the real game and records what only the game can tell. The runner builds a Probe into a map folder, and reads back the **Result file** the Probe run writes in the game's `CustomMapData` folder. The terms are defined in [`CONTEXT.md`](../CONTEXT.md); why this package copies the Template's pipeline is [ADR 0010](../docs/adr/0010-probe-runner-copies-the-template-pipeline.md).

## Commands

Run from the repository root:

| Command                       | What it does                                                                                                                                                                                                                                                                       |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm probe:build [<probe>…]` | Builds each Probe named, or every Probe when none is: compiles it with typescript-to-lua, bakes a fresh runId into the bundle, composes the map script and stages the map folder in `.probe/build/<probe>/staging/probe.w3m`. Needs no game; CI runs it. Exit code 1 on a failure. |
| `pnpm probe:read <probe>`     | Reads the Probe's Result file, prints the state of its last run on one line, then its records, one per line. Read-only.                                                                                                                                                            |

A known failure (a bad Probe name, a type error in a Probe, no `CustomMapData` folder found) prints one line, `<command> failed: <message>`; a bug prints its stack.

### States of a Probe run

`probe:read` compares the Result file with the runId of the Probe's last build, kept in `.probe/<probe>.json`:

| State         | When                                                                | Exit code |
| ------------- | ------------------------------------------------------------------- | --------- |
| `finished`    | the file holds the last build's runId and ends with `END status=ok` | 0         |
| `not-started` | there is no file, or it holds another runId, which the status shows | 3         |

Exit code 4 is the command's own failure (usage, a known failure or a bug), so a failure never reads as a state. The root scripts run the package's with `pnpm --dir probe`, not `pnpm --filter`, which would turn every non-zero exit code into 1.

### Where the Result file is

`<CustomMapData>\reforged-ts\probes\<probe>.txt`, where `CustomMapData` is found in this order:

1. `WC3_USER_FOLDER`, naming the game's user folder (the `Warcraft III` folder that holds `CustomMapData`);
2. on Windows, the `Personal` value of `HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders` (the Documents known folder, which may be redirected to OneDrive), with its `%VAR%`s expanded, then `Warcraft III\CustomMapData`.

The home folder's `Documents` is never used: it can exist and not be the folder the game writes to. Elsewhere, set `WC3_USER_FOLDER`.

## Writing a Probe

A Probe is `probes/<probe>.ts`, named in kebab-case ASCII (`hello`, `native-nullability`). Every TypeScript file directly in `probes/` is a Probe; a module Probes share goes in a subfolder. It exports `run`, which the runner calls once the map is initialised, from a 0-second timer under `xpcall`:

```ts
import type { ProbeContext } from "../game/probe";

export function run(p: ProbeContext): void {
  p.record("greeting", { word: "hello", count: 1 });
}
```

`p.record(kind, fields)` adds one line, `<seq> <kind> <key>=<value> ...`, its fields sorted by key. For now, kinds, keys and values stay in the safe alphabet: printable ASCII without space, `=`, `%`, `"` or `\`. A Probe may import `reforged-ts`, which resolves to the workspace sources; the runner itself calls Natives only.

The Result file of a finished run of `hello`:

```text
1 BEGIN probe=hello run=<runId>
2 greeting count=1 word=hello
3 END status=ok
```

## Layout

- `probes/`: the Probes, and `tsconfig.json`, the typescript-to-lua project every Probe compiles with.
- `game/`: the in-game module (`runner.ts`, the entry of every bundle) and the types a Probe sees (`probe.ts`).
- `probe.w3m/`: the map folder, a copy of the Template's; `PROVENANCE.md` lists every file copied from the Template.
- `src/`: the commands, compiled to `build/`. `src/read.ts` is the reader the package's other scripts import.
- `test/`: the Node tests of the commands, and under `lua/` the in-game module's tests on the `reforged-test` harness. `test/fixtures/bridge/hello.txt` is the bridge: the lines of the hello Probe's Result file, which the Lua test asserts the runner writes and the Node test asserts the reader reads back.
- `.probe/`: ignored: the builds, the state files and the compiled Lua tests.
