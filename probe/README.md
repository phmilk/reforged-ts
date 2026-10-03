# The Probe runner

A private workspace package, never published. A **Probe** is a TypeScript file that runs in the real game and records what only the game can tell. A fact to check in game is a Probe run by default: what stays for a human is [listed below](#what-stays-for-a-human). The runner builds a Probe into a map folder, starts the game on it, and reads back the **Result file** the Probe run writes in the game's `CustomMapData` folder. The terms are defined in [`CONTEXT.md`](../CONTEXT.md); why this package copies the Template's pipeline is [ADR 0010](../docs/adr/0010-probe-runner-copies-the-template-pipeline.md).

## What stays for a human

A fact to check in game is a Probe run the agent writes and runs itself, by default. A human gets only:

- **a check made by looking at the screen:** a visual result, a frame's layout, an effect, a sound;
- **multiplayer:** two or more clients, such as host election (#131);
- **the Battle.net login**, when a run's notification asks (step 3 of [Running a Probe run](#running-a-probe-run)).

Such a check is an issue labelled `ready-for-human`, naming which of these it is.

## Commands

Run from the repository root:

| Command                                 | What it does                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm probe:build [<probe>…]`           | Builds each Probe named, or every Probe when none is: compiles it with typescript-to-lua, bakes a fresh runId and the Patch of the Typings' manifest into the bundle, composes the map script and stages the map folder in `.probe/build/<probe>/staging/probe.w3m`. Needs no game; CI runs it. Exit code 1 on a failure.                                                                     |
| `pnpm probe:run <probe>`                | Run by the agent, on native Windows: finds the game, builds the Probe as `probe:build` does, starts the game on the staged folder, passes the screens before the map, ends the game once the Result file ends or stalls, then prints the run as `probe:read` does. Blocks until the run ends: see [Running a Probe run](#running-a-probe-run). Exit codes are `probe:read`'s; 4 on a failure. |
| `pnpm probe:read <probe>`               | Reads the Probe's Result file, prints the state of its last run on one line, then its records, one per line. Read-only: it writes, starts and stops nothing, and on Windows reads the process list.                                                                                                                                                                                           |
| `pnpm probe:nullability-report <probe>` | Writes the section of the Nullability sweep's Slice `<probe>` into `docs/research/nullability-sweep.md` from the Probe's last run, in place of its previous one: see [The Nullability sweep](#the-nullability-sweep). Reads the Overlay and never writes it. Exit code 1 on a failure.                                                                                                        |

A known failure (a bad Probe name, a type error in a Probe, no game or no `CustomMapData` folder found) prints one line, `<command> failed: <message>`; a bug prints its stack.

### Running a Probe run

The agent runs Probe runs, end to end, with `pnpm probe:run <probe>`; during a run, a human steps in only to log in to Battle.net when the game asks, called by a notification. The command runs on native Windows only (from WSL, run it in a Windows shell) and blocks until the run ends: the agent starts it in the background and follows its output.

It finds the game in this order, as the Template's `pnpm test:map` does, before it builds:

1. `--game-executable <file>`, relative to the repository root;
2. `WC3_EXECUTABLE`, naming the game's executable, also relative to the repository root;
3. the Battle.net install locations: `Warcraft III\_retail_\x86_64\Warcraft III.exe` under `Program Files (x86)`, then `Program Files`.

It refuses to start while a `Warcraft III.exe` already runs: `probe:read` looks the game up by image name. Then:

1. **Start.** It builds the Probe, with a fresh runId, and starts the game with `-loadfile <staged folder> -launch -editor -windowmode windowed`: no menu, and the game's own saved login. It keeps the game's PID.
2. **The screens before the map.** The runner writes the Result file's `BEGIN` line, and a `CHECKPOINT` line, in `main`, during loading, before "Press any key to continue". Once the `BEGIN` of the current run is on disk, the command posts a space key to the game's window (`PostMessage`: no focus needed, minimized included), and again every 2 seconds until the Probe writes past what `BEGIN` wrote: the screen may show after `BEGIN`, and a key posted before it is lost (#361). It never sends a key before `BEGIN`, so nothing is ever typed into the Battle.net login; in the game, a space only moves the camera to the last alert.
3. **No `BEGIN` after `--begin-timeout` seconds (60 by default).** The command captures the game's window to `.probe/<probe>/no-begin.png` (a minimized window is shown first, without being activated, since it has no picture), prints `waiting for a human: no BEGIN after 60s, capture at <png>…` and keeps waiting, up to 15 minutes. The agent reads the capture: when it shows the Battle.net login, the agent sends a push notification, the human logs in, the map loads, and the same command posts the key on `BEGIN` and carries on. When it shows anything else, the agent stops the command, which ends the game, and reports what it saw.
4. **A stall: the Result file unchanged for `--stall-timeout` seconds (120 by default) after the key.** The command captures the window to `.probe/<probe>/stall.png`, then ends the game; the run reads as `crashed`, its pending step named.
5. **The end.** Right after reading `END`, `ok` or `failed`, the command ends the game.

The command ends the game with `taskkill /F /PID <pid>` (the game ignores a plain `taskkill`), the process it started only, on every way out once the game has started: after `END`, a stall, the end of the human wait, Ctrl+C or a stop of the command, or its own failure. A game that exits by itself is a crash: there is nothing to end. A command killed outright cannot end its game: end it with the `taskkill` of the PID its `started` line printed.

It prints one progress line per event, with the time since the start:

```text
Built Probe hello, run <runId>: <staged folder>
started pid=21900
BEGIN at 12s
key sent at 13s
checkpoint at 41s, pending "CreateTimer valid"
END at 73s status=ok
killed pid=21900 at 74s after END
```

Last, it prints exactly what `probe:read` prints for the run and exits with its code: 0 `finished`, 1 `failed`, 2 `crashed` (a stall included), 3 `not-started` (no `BEGIN` ever came); 4 is the command's own failure.

### States of a Probe run

`probe:read` compares the Result file with the runId of the Probe's last build, kept in `.probe/<probe>.json`:

| State         | When                                                                                                            | Exit code |
| ------------- | --------------------------------------------------------------------------------------------------------------- | --------- |
| `finished`    | the file holds the last build's runId and ends with `END status=ok`                                             | 0         |
| `failed`      | the file holds the last build's runId and ends with `END status=failed`; the status shows `ERROR`               | 1         |
| `running`     | the file holds the last build's runId and ends with `CHECKPOINT`, and `Warcraft III.exe` runs (Windows, WSL)    | 2         |
| `crashed`     | the file holds the last build's runId and ends with `CHECKPOINT`, and no `Warcraft III.exe` runs (Windows, WSL) | 2         |
| `incomplete`  | the file holds the last build's runId and ends with `CHECKPOINT`, elsewhere, where no process is looked for     | 2         |
| `not-started` | there is no file, or it holds another runId, which the status shows                                             | 3         |

A run that ends with a checkpoint shows the label of its last `PENDING` line, the step it was in, or "no pending step". On Windows the game's process is looked for with `tasklist /FI "IMAGENAME eq Warcraft III.exe"`, a query of the process list that stops nothing, and under WSL with the same `tasklist.exe` through interop; elsewhere the run stays `incomplete`. After `probe:run` the game is gone, so a run that ends with a checkpoint reads as `crashed`.

Exit code 4 is the command's own failure (usage, a known failure or a bug), so a failure never reads as a state. The root scripts run the package's with `pnpm --dir probe`, not `pnpm --filter`, which would turn every non-zero exit code into 1.

### Where the Result file is

`<CustomMapData>\reforged-ts\probes\<probe>.txt`, where `CustomMapData` is found in this order:

1. `WC3_USER_FOLDER`, naming the game's user folder (the `Warcraft III` folder that holds `CustomMapData`);
2. on Windows, the `Personal` value of `HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders` (the Documents known folder, which may be redirected to OneDrive), with its `%VAR%`s expanded, then `Warcraft III\CustomMapData`;
3. under WSL, the Documents known folder as Windows gives it (`[Environment]::GetFolderPath('MyDocuments')` through `powershell.exe`, redirection included), at its `wslpath -u` path, then `Warcraft III/CustomMapData`.

The home folder's `Documents` is never used: it can exist and not be the folder the game writes to. Elsewhere, set `WC3_USER_FOLDER`.

## Writing a Probe

A Probe is `probes/<probe>.ts`, named in kebab-case ASCII (`hello`, `native-nullability`). Every TypeScript file directly in `probes/` is a Probe; a module Probes share goes in a subfolder. It exports `run`, which the runner calls once the map is initialised, from a 0-second timer under `xpcall`. The map's Melee Initialization runs as the Template's does, except `MeleeInitVictoryDefeat`, which the runner replaces with a no-op: with no enemy player, the game would end in victory within seconds, and its Quit Game would end the Probe run (#348). Only the Probe, or `probe:run` once the Result file ends or stalls, ends a game:

```ts
import type { ProbeContext } from "../game/probe";

export function run(p: ProbeContext): void {
  p.record("greeting", { word: "hello", count: 1 });
}
```

`p.pending(label)` adds the line `<seq> PENDING label=<label>` before a risky step, so a crash in that step names it. `p.checkpoint()` puts every line so far on disk: it rewrites the Result file in full, `PreloadGenClear`, `PreloadGenStart`, one `Preload` per line and `PreloadGenEnd`, ending with the line `<seq> CHECKPOINT`, and shows "Probe `<probe>`: checkpoint N, M records so far." on screen. The Probe chooses when: a line reaches the disk only at the next checkpoint or at the end, so a crash loses what came after the last checkpoint. The `CHECKPOINT` line ends its rewrite only: the next line added takes its seq, and the file at the end holds no `CHECKPOINT` line.

The run ends when `run` returns: the runner adds `END status=ok`, writes the Result file and shows "Probe `<probe>` finished: N records. Close the game." for an hour. A Probe working on timers or events calls `p.hold()` in `run`, and `END` then waits for `p.finish()`, which it calls once its work is done (`probes/held.ts`). `p.finish()` ends the run whenever it is called, held or not; after the end it does nothing, and `p.record`, `p.pending` and `p.checkpoint` raise an error. Timers run in game time, which slows while another window has the focus: the calibration run (#326) saw a 30-second timer take 40 seconds, so a held Probe checkpoints well within `probe:run`'s stall timeout. The runner never calls `EndGame` at the end: on 3.0 it only takes the client to the main menu (#326), and `probe:run` ends the game anyway.

When `run` throws, held or not, the runner catches the error with `xpcall`, adds `ERROR message=<message>`, then `END status=failed`, writes the Result file and shows "Probe `<probe>` failed after N records. Close the game." with the message (`probes/failing.ts`). An Error thrown from TypeScript is recorded as `<name>: <message>`, without its stack, which the game cannot give: it has no `debug` library. An error thrown later is caught the same way when it comes from a callback of `p.after(seconds, callback)`, the runner's timer for a held Probe's later steps: `ERROR`, then `END status=failed` (`probes/failing-later.ts`), or, once the run has ended, the failure on screen only. One thrown from a timer or an event the Probe started itself is not caught: the run never ends, and reads as `crashed`. `p.after` and `p.show(text, seconds)`, which shows a message as the runner's own are shown, both work after the end, for a step that must come after `END`.

`p.record(kind, fields)` adds one line, `<seq> <kind> <key>=<value> ...`, its fields sorted by key. A value may be any string, an error message or the `tostring` of a Handle: the writer percent-encodes every byte outside printable ASCII, and every space, `=`, `%`, `"` and `\`, as `%XX` in uppercase hexadecimal. Kinds and keys are written as they are: one outside the safe alphabet, printable ASCII without space, `=`, `%`, `"` or `\`, or an empty one, raises an error that fails the Probe run; a numeric key is written as `tostring` gives it, so `{ 0: "a" }` records the key `0`. So every line stays inside #298's limits, printable ASCII without `"` or `\`, and the writer splits a line longer than 200 bytes into continuation lines (the game cuts a `Preload` string at 259 bytes with no error, measured in #326, so 200 keeps a margin) `<seq>+ <next bytes>`, at most 200 bytes each. `probe:read` joins the continuation lines, then decodes the values, reading their bytes as UTF-8: a byte outside a valid UTF-8 sequence, such as `string.char(200)` or a character cut in the middle, reads as its `%XX` escape, so no byte is lost. A line holding anything the writer does not write, a character it always escapes, a lowercase escape or the escape of a byte it keeps, is not a Result file line, and the read fails; of a Result file of another run, only the BEGIN line is read. `probe:read` prints a value as it is, or as a JSON string when the value is empty or holds a space, a `"`, or a control or format character, so each record stays on one line. A Probe may import `reforged-ts`, which resolves to the workspace sources; the runner itself calls Natives only.

The Result file of a finished run of `hello`, which records each step after its `PENDING` line and checkpoints after each, and whose second record holds every byte of ASCII the writer escapes and some UTF-8:

```text
1 BEGIN patch=<patch> probe=hello run=<runId>
2 PENDING label=greet
3 greeting count=1 word=hello
4 PENDING label=encode
5 encoded ascii=%00%01%02%03%04%05%06%07%08%09%0A%0B%0C%0D%0E%0F%10%11%12%13%14%15%16%17%18%19%1A%1B%1C%1D%1E%1F%20%22%25%3D%5C%7F utf8=h%C3%A9llo,%20w%C3%B6rld:%20%E2%9C%93%20%E6%97%A5%E6%9C%AC%E8%AA
5+ %9E
6 END status=ok
```

Its second checkpoint left the same lines with `6 CHECKPOINT` last in place of the `END` line; a crash there reads as `crashed`, pending step `encode`.

The Result file of `failing`, which records one line, then throws, and what `probe:read failing` prints of it, with exit code 1:

```text
1 BEGIN patch=<patch> probe=failing run=<runId>
2 step name=before
3 ERROR message=Error:%20The%20step%20%22after%22%20broke.
4 END status=failed
```

```text
failed: Probe failing, run <runId>, 1 record, then the error "Error: The step \"after\" broke."
step name=before
```

## The Nullability sweep

The [Nullability sweep](../CONTEXT.md) measures the `returns.nullable` of the handle-returning Natives in Slices, each a Probe named `nullability-slice-<n>` (#327). A Slice's Probe lists its cases, one direct call of one Native each, and hands them to the case runner, `probes/nullability/case-runner.ts`, which every Slice shares, with its `skip` list: `runCases(p, CASES, { skip: SKIP })`. The case runner first records the whole case list, one `CASE` record per case, so the report knows the cases a crash left unrun, and puts it on disk with a checkpoint. Then, for each case in order, it adds `PENDING label=<native> <case>`, puts every line on disk with a checkpoint, calls the Native under `pcall` and records what it returned:

```text
<seq> CASE case=<label> group=a|b native=<native>
<seq> CALL case=<label> group=a|b native=<native> outcome=handle id=<GetHandleId> type=<tostring>
<seq> CALL case=<label> group=a|b native=<native> outcome=nil
<seq> CALL case=<label> group=a|b native=<native> outcome=odd type=<tostring>
<seq> CALL case=<label> group=a|b message=<error> native=<native> outcome=error
<seq> SKIP case=<label> group=a|b native=<native> reason=crashed
```

Group `a` is a case of live arguments, `b` one of a stale handle. A `handle` may have the id 0 (`TriggerAddAction` on a destroyed trigger): it is not `nil`. `odd` is a value that is neither `nil` nor a userdata, a wrong return type in the Typings to file as its own issue (as #280); `error` is a call that raised. A case's checkpoint comes after its `PENDING` line, so a crash in the call, in either group, leaves that line last on disk, with every result before it, and names the case; a Slice never calls `p.checkpoint()` itself. After a crash, add the pending step `probe:read` names, `<native> <case>`, to the Probe's `skip` list and run it again: the case is not called, and its `SKIP` line, put on disk with a checkpoint of its own, keeps the crash in the result. A skip entry that names no case fails the run.

`pnpm probe:nullability-report <probe>` reads the Probe's last run through the reader of `probe:read`. It reports a `finished` run, and an `incomplete` or `crashed` one, whose last `PENDING` case without a `CALL` is `crashed` and whose cases after it are `not run`. It refuses, on one line, a `running` run (close the game first), a `failed` one (with its `ERROR` message) and a `not-started` one (with the stale runId of the Result file, when there is one). Each Native, in the order of the case list, gets a verdict from its cases and from the Nullability family its Overlay entry names in `returns.family`, read as JSON from `packages/reforged-types/overlay/`, the first of these that holds: `nullable (proved)` when a case returned `nil`; `unsafe` when a case crashed, was skipped or raised an error; `review` when a case was `odd` or not run; `nullable (rule)` when its family is nullable (below); `non-null (evidence, handle id 0)` when every case returned a handle, one of id 0 at least; `non-null (evidence)` when every case returned a handle. The verdict is compared with the entry's `returns.nullable`: `mismatch` when the Overlay says `false` and the verdict is `nullable (proved)` or `nullable (rule)`, `consistent` otherwise; a Native with no entry, or no family, fails the command. A case the Slice lists but a crash left `not run` gives `review`; a required case the Slice never lists, the report cannot see, since the cases' labels are free text: the Slice's review checks its case list against the cases per family (below). The command writes the Slice's section of `docs/research/nullability-sweep.md`, headed by the Probe, the Patch the run's `BEGIN` line names (the one its build compiled against, whatever the manifest says by the time of the report), the date and the runId, with one table per Native and a proposed `notes` text below it, or only "review" for `unsafe` and `review`, and replaces only that section when it runs again.

### The cases per family

Every handle-returning Native of `common.j` names its Nullability family in its Overlay entry (`packages/reforged-types/AGENTS.md`). A Native of `converter`, `enum-getter`, `constructor`, `registration` or `intrinsic-property` is typed non-null only when its Slice ran every case below and each returned a handle. A case is any well-typed argument value: an unknown rawcode, an integer out of range, a stale handle and a call outside the Native's context all count; `nil` in a non-null parameter does not. Vary one argument at a time, never the cartesian product.

- **constructor**:
  - (a) one call with typical arguments;
  - per numeric parameter, one odd value at a time: `0`, a negative, a coordinate outside the world, `2147483647`;
  - per rawcode parameter, an unknown rawcode;
  - per string parameter, `""` and an unknown name;
  - (b) each handle parameter in every stale state its type has;
  - a constructor with no parameters runs one call.
- **registration**: the constructor's cases, plus the trigger destroyed, plus a `nil` `filter` where the Overlay types it nullable (this measures the `TriggerRegister*` among the 21 `filter` parameters).
- **enum-getter** and **intrinsic-property**:
  - each handle parameter live and in every stale state;
  - a `player` parameter runs a user slot (`Player(0)`), an empty slot and a neutral player;
  - with no parameters, one call.
- **converter**:
  - the integer of every `common.j` constant of its type;
  - `-1`;
  - the first integer past the last constant;
  - `2147483647` and `-2147483648`;
  - for the six types with no constant (`mapsetting`, `mapvisibility`, the four `ability*levelarrayfield`): `0`, `1`, `-1`, `2147483647`.
- **optional-property**, **event-response**, **callback-getter** and **lookup**, nullable by their nature: one cheap case that should return nothing, where one exists (a call outside the context, an unsaved key, an index out of range), with no event Fixture. A member whose cheap case returns a handle stays nullable, `nullable (rule)`. Cases that may crash (`GetExpiredTimer`) follow "Crashed Probe runs" (#364).

A Slice that leaves a required case unrun (no Fixture for a stale state, say) cannot make that Native non-null: its verdict is `review`.

The proposed `notes`, published as `@remarks`, give the reason in game terms, never the family's name:

| Verdict                            | Proposed `notes`                                                                                              |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `non-null (evidence)`              | `Returned a handle in every case of the nullability sweep (<cases>) on <Patch>; evidence, not proof.`         |
| `non-null (evidence, handle id 0)` | the above, then `For <cases>, a handle of id 0.`                                                              |
| `nullable (proved)`                | `Returns nothing for <cases> (nullability sweep, <Patch>).`                                                   |
| `nullable (rule)`                  | `May return nothing <reason>. Returned a handle in every case of the nullability sweep (<cases>) on <Patch>.` |

The `<reason>` per family: "outside its event" (event-response), "outside its enum or filter callback" (callback-getter), "when nothing is found" (lookup), "when the object has none" (optional-property).

## Layout

- `probes/`: the Probes, and `tsconfig.json`, the typescript-to-lua project every Probe compiles with. `calibration.ts` measures the Preload limits the Result file's format was frozen on, checks C1 to C8 of #298, in test files of its own under `CustomMapData\reforged-ts\calibration\`; its doc comment lists what it records, and its last step, C8, calls `EndGame(false)` 3 seconds after `END`, which a run of `probe:run` never reaches: it ends the game at `END` (#360). `hello`, `failing`, `held` and `failing-later` exist for the runner's own tests. `probes/nullability/` holds what the Slices of the Nullability sweep share, `records.d.ts`, the format of the case runner's records, which the report imports too, included.
- `game/`: the in-game module (`runner.ts`, the entry of every bundle), what it shares with the Probes (`errors.ts`, the message of a raised value) and the types a Probe sees (`probe.ts`).
- `probe.w3m/`: the map folder, a copy of the Template's; `PROVENANCE.md` lists every file copied from the Template.
- `src/`: the commands, compiled to `build/`; `src/machine.ts` is the one way they reach the machine, which the tests replace with a fake. `src/read.ts` is the reader the package's other scripts import. `src/nullability/` is the Nullability sweep's report.
- `test/`: the Node tests of the commands, and under `lua/` the in-game module's tests, and those of the Probes' bundles, on the `reforged-test` harness, which share `lua/bundle.ts` and `lua/stubs.d.ts`, the stub helpers they call, with `lua/probes/`, Probes of those tests only. `test/fixtures/nullability/` is the report's fixture Overlay. `test/fixtures/bridge/` is the bridge: `manifest.json`, whose Patch the Lua tests' builds bake, and the lines of the hello Probe's Result file, `hello.txt` as the finished run leaves it and `hello-checkpoint.txt` as its second checkpoint does, `PENDING` lines, encoded values and a continuation line included, and `failing.txt`, those of the failing Probe's, ending in `ERROR` and `END status=failed`. The Lua tests assert the runner writes them and the Node tests assert the reader decodes them back.
- `.probe/`: ignored: the builds, the state files and the compiled Lua tests.
