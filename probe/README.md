# The Probe runner

A private workspace package, never published. A **Probe** is a TypeScript file that runs in the real game and records what only the game can tell. The runner builds a Probe into a map folder, starts the game on it, and reads back the **Result file** the Probe run writes in the game's `CustomMapData` folder. The terms are defined in [`CONTEXT.md`](../CONTEXT.md); why this package copies the Template's pipeline is [ADR 0010](../docs/adr/0010-probe-runner-copies-the-template-pipeline.md).

## Commands

Run from the repository root:

| Command                       | What it does                                                                                                                                                                                                                                                                                                                  |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm probe:build [<probe>…]` | Builds each Probe named, or every Probe when none is: compiles it with typescript-to-lua, bakes a fresh runId into the bundle, composes the map script and stages the map folder in `.probe/build/<probe>/staging/probe.w3m`. Needs no game; CI runs it. Exit code 1 on a failure.                                            |
| `pnpm probe:launch <probe>`   | Run by the human, as `! pnpm probe:launch <probe>` in the agent's session; the agent never runs it. Finds the game, fails before building when it is not found, builds the Probe as `probe:build` does, starts the game detached on the staged folder and prints the human's part of the Probe run. Exit code 1 on a failure. |
| `pnpm probe:read <probe>`     | Reads the Probe's Result file, prints the state of its last run on one line, then its records, one per line. Read-only.                                                                                                                                                                                                       |

A known failure (a bad Probe name, a type error in a Probe, no game or no `CustomMapData` folder found) prints one line, `<command> failed: <message>`; a bug prints its stack.

### Launching a Probe run

`probe:launch` finds the game in this order, as the Template's `pnpm test:map` does:

1. `--game-executable <file>`, relative to the repository root;
2. `WC3_EXECUTABLE`, naming the game's executable, also relative to the repository root;
3. the Battle.net install locations: `Warcraft III\_retail_\x86_64\Warcraft III.exe` under `Program Files (x86)`, then `Program Files`, on Windows; the `.app`'s inner binary under `/Applications` on macOS.

It starts the game with `-loadfile <staged folder> -launch -editor -windowmode windowed`: no menu, and the saved Battle.net login. The command returns once the game has started, and prints what to do next: wait until the game shows "Probe `<probe>` finished", close it, then say "done", or "crashed" if the game died before that message. The agent then reads the run with `probe:read`.

`--wine-path <wine>` starts the game through Wine, with the staged folder as a `Z:` path, `--game-executable` as a path Wine understands and `--wine-prefix <folder>` as `WINEPREFIX`. This form is copied from the Template and not guaranteed.

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

`p.record(kind, fields)` adds one line, `<seq> <kind> <key>=<value> ...`, its fields sorted by key. A value may be any string, an error message or the `tostring` of a Handle: the writer percent-encodes every byte outside printable ASCII, and every space, `=`, `%`, `"` and `\`, as `%XX` in uppercase hexadecimal. Kinds and keys are written as they are: one outside the safe alphabet, printable ASCII without space, `=`, `%`, `"` or `\`, or an empty one, raises an error that fails the Probe run; a numeric key is written as `tostring` gives it, so `{ 0: "a" }` records the key `0`. So every line stays inside #298's limits, printable ASCII without `"` or `\`, and the writer splits a line longer than 200 bytes into continuation lines `<seq>+ <next bytes>`, at most 200 bytes each. `probe:read` joins the continuation lines, then decodes the values, reading their bytes as UTF-8: a byte outside a valid UTF-8 sequence, such as `string.char(200)` or a character cut in the middle, reads as its `%XX` escape, so no byte is lost. A line holding anything the writer does not write, a character it always escapes, a lowercase escape or the escape of a byte it keeps, is not a Result file line, and the read fails; of a Result file of another run, only the BEGIN line is read. `probe:read` prints a value as it is, or as a JSON string when the value is empty or holds a space, a `"`, or a control or format character, so each record stays on one line. A Probe may import `reforged-ts`, which resolves to the workspace sources; the runner itself calls Natives only.

The Result file of a finished run of `hello`, whose second record holds every byte of ASCII the writer escapes and some UTF-8:

```text
1 BEGIN probe=hello run=<runId>
2 greeting count=1 word=hello
3 encoded ascii=%00%01%02%03%04%05%06%07%08%09%0A%0B%0C%0D%0E%0F%10%11%12%13%14%15%16%17%18%19%1A%1B%1C%1D%1E%1F%20%22%25%3D%5C%7F utf8=h%C3%A9llo,%20w%C3%B6rld:%20%E2%9C%93%20%E6%97%A5%E6%9C%AC%E8%AA
3+ %9E
4 END status=ok
```

## Layout

- `probes/`: the Probes, and `tsconfig.json`, the typescript-to-lua project every Probe compiles with.
- `game/`: the in-game module (`runner.ts`, the entry of every bundle) and the types a Probe sees (`probe.ts`).
- `probe.w3m/`: the map folder, a copy of the Template's; `PROVENANCE.md` lists every file copied from the Template.
- `src/`: the commands, compiled to `build/`; `src/machine.ts` is the one way they reach the machine, which the tests replace with a fake. `src/read.ts` is the reader the package's other scripts import.
- `test/`: the Node tests of the commands, and under `lua/` the in-game module's tests on the `reforged-test` harness. `test/fixtures/bridge/hello.txt` is the bridge: the lines of the hello Probe's Result file, encoded values and a continuation line included, which the Lua test asserts the runner writes and the Node test asserts the reader decodes back.
- `.probe/`: ignored: the builds, the state files and the compiled Lua tests.
