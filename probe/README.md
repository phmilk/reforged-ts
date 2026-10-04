# The Probe runner

A private workspace package, never published. A **Probe** is a TypeScript file that runs in the real game and records what only the game can tell. Who checks a fact in game: [What stays for a human](#what-stays-for-a-human). The runner builds a Probe into a map folder, starts the game on it, and reads back the **Result file** the Probe run writes in the game's `CustomMapData` folder. The terms are defined in [`CONTEXT.md`](../CONTEXT.md); why this package copies the Template's pipeline is [ADR 0010](../docs/adr/0010-probe-runner-copies-the-template-pipeline.md).

## What stays for a human

A fact to check in game is a Probe run the agent writes and runs itself, by default. A human gets only:

- **a check made by looking at the screen:** a visual result, a frame's layout, an effect, a sound;
- **multiplayer:** two or more clients, such as host election (#131).

Such a check is an issue labelled `ready-for-human`, naming which of these it is. During a run, a human also logs in to Battle.net when the run's notification asks (the step "No `BEGIN` after `--begin-timeout` seconds" of [Running a Probe run](#running-a-probe-run)).

`probe:run` needs native Windows with the game installed. An agent without them stops at a `ready-for-agent` check in game: it reports the fact as unverified, says in the issue that the check needs a machine with the game, and leaves the label for an agent on one.

## Commands

Run from the repository root:

| Command                                 | What it does                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm probe:build [<probe>…]`           | Builds each Probe named, or every Probe when none is: compiles it with typescript-to-lua, bakes a fresh runId and the Patch of the Typings' manifest into the bundle (the Typings of the Game version of the newest Build vendored in `packages/reforged-types/vendor/`), composes the map script and stages the map folder in `.probe/build/<probe>/staging/probe.w3m`. Needs no game; CI runs it. Exit code 1 on a failure. |
| `pnpm probe:run <probe>`                | Run by the agent, on native Windows: finds the game, builds the Probe as `probe:build` does, starts the game on the staged folder, passes the screens before the map, ends the game once the Result file ends or stalls, then prints the run as `probe:read` does. Blocks until the run ends: see [Running a Probe run](#running-a-probe-run). Exit codes are `probe:read`'s; 4 on a failure.                                 |
| `pnpm probe:read <probe>`               | Reads the Probe's Result file, prints the state of its last run on one line, then its records, one per line. Read-only: it writes, starts and stops nothing, and on Windows reads the process list.                                                                                                                                                                                                                           |
| `pnpm probe:nullability-report <probe>` | Writes the section of the Nullability sweep's Slice `<probe>` into `docs/research/nullability-sweep.md` from the Probe's last run, in place of its previous one: see [The Nullability sweep](#the-nullability-sweep). Reads the Overlay and never writes it. Exit code 1 on a failure.                                                                                                                                        |
| `pnpm probe:nullability-converters`     | Writes the converter table of the Nullability sweep, `probes/nullability/converter-constants.ts`, from the vendored `common.j` of the Typings' Patch and the Overlay: see [The case generators](#the-case-generators). Run it after a new Patch or an Overlay change to the `converter` family; a test fails until it has run. Exit code 1 on a failure.                                                                      |
| `pnpm probe:nullability-curate <probe>` | Applies the verdicts of the Slice `<probe>`, from the Probe's last run, to the Overlay, `packages/reforged-types/overlay/`, for its group's curation pull request: see [The curation](#the-curation). It writes local files only, and refuses a Slice with a `mismatch`, one line per Native. Exit code 1 on a failure.                                                                                                       |

A known failure (a bad Probe name, a type error in a Probe, no game or no `CustomMapData` folder found) prints one line, `<command> failed: <message>`; a bug prints its stack.

### Running a Probe run

The agent runs Probe runs, end to end, with `pnpm probe:run <probe>`; during a run, a human steps in only to log in to Battle.net when the game asks, called by a notification. The command runs on native Windows only (from WSL, run it in a Windows shell) and blocks until the run ends: the agent starts it in the background and follows its output.

It finds the game in this order, as the Template's `pnpm test:map` does, before it builds:

1. `--game-executable <file>`, relative to the repository root;
2. `WC3_EXECUTABLE`, naming the game's executable, also relative to the repository root;
3. the Battle.net install locations: `Warcraft III\_retail_\x86_64\Warcraft III.exe` under `Program Files (x86)`, then `Program Files`.

It refuses to start while a `Warcraft III.exe` already runs: `probe:read` looks the game up by image name. It reads the client's Build from the `Version` of the active row of the `.build.info` nearest above the executable (`Warcraft III\.build.info`, which the Battle.net app writes), and refuses, naming both Builds, a client that is not on the Patch of the Typings: a run tests the Build the Typings declare, or none (the per-Patch re-run of the `new-patch` skill says what to do then). The client's Build is kept in the Probe's state file beside the runId, for the report. Then:

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

The [Nullability sweep](../CONTEXT.md) measures the `returns.nullable` of the handle-returning Natives in Slices, each a Probe named by what it holds, `nullability-<family>[-<part>]`: one Nullability family, or a part of one, as `nullability-converters-1` or `nullability-filters` (#371). A Slice's Probe builds its case list, one direct call of one Native each, with the case generators of its family (below), and hands it to the case runner, `probes/nullability/case-runner.ts`, which every Slice shares, with its `skip` list: `runCases(p, CASES, { skip: SKIP })`. The case runner first records the whole case list, one `CASE` record per case, so the report knows the cases a crash left unrun, and puts it on disk with a checkpoint. Then, for each case in order, it adds `PENDING label=<native> <case>`, puts every line on disk with a checkpoint, calls the Native under `pcall` and records what it returned:

```text
<seq> CASE case=<label> group=a|b native=<native>
<seq> CALL case=<label> group=a|b native=<native> outcome=handle id=<GetHandleId> type=<tostring>
<seq> CALL case=<label> group=a|b native=<native> outcome=nil
<seq> CALL case=<label> group=a|b native=<native> outcome=odd type=<tostring>
<seq> CALL case=<label> group=a|b message=<error> native=<native> outcome=error
<seq> SKIP case=<label> group=a|b native=<native> reason=crashed
```

Those are return cases. A Native that returns nothing gets call cases instead (below), whose records carry three more fields.

Group `a` is a case of live arguments, `b` one of a stale handle. A `handle` may have the id 0 (`TriggerAddAction` on a destroyed trigger): it is not `nil`. `odd` is a value that is neither `nil` nor a userdata, a wrong return type in the Typings to file as its own issue (as #280); `error` is a call that raised. A case's checkpoint comes after its `PENDING` line, so a crash in the call, in either group, leaves that line last on disk, with every result before it, and names the case; a Slice never calls `p.checkpoint()` itself. A case of the Probe's `skip` list is not called, and its `SKIP` line, put on disk with a checkpoint of its own, keeps the crash in the result; [the crash loop](#the-crash-loop) says when a case goes on it. A skip entry that names no case fails the run.

`pnpm probe:nullability-report <probe>` reads the Probe's last run through the reader of `probe:read`. It reports a `finished` run, and an `incomplete` or `crashed` one, whose last `PENDING` case without a `CALL` is `crashed` and whose cases after it are `not run`. It refuses, on one line, a `running` run (close the game first), a `failed` one (with its `ERROR` message) and a `not-started` one (with the stale runId of the Result file, when there is one). Each Native, in the order of the case list, gets a verdict from its cases and from the Nullability family its Overlay entry names in `returns.family`, read as JSON from `packages/reforged-types/overlay/`, the first of these that holds: `nullable (proved)` when a case returned `nil`; `unsafe` when a case crashed or was skipped; `review` when a case was `odd`, raised an error or was not run; `nullable (rule)` when its family is nullable (below); `non-null (evidence, handle id 0)` when every case returned a handle, one of id 0 at least; `non-null (evidence)` when every case returned a handle. An error is reviewed, not unsafe: the arguments are well-typed, so it points first at the Probe, a Fixture or a wrong type in the Typings (filed on its own, as #280), and it is curated as a crash only once it proves to be the Native's own behaviour. An `unsafe` Native is proposed nullable whatever its family: a crashed case is a required case that returned no handle, and a Patch that fixes the crash most likely returns nothing there, which would widen a non-null return. The verdict is compared with the entry's `returns.nullable`: `mismatch` when the Overlay says `false` and the verdict is neither `non-null (evidence)` nor `non-null (evidence, handle id 0)`, so `unsafe` and `review` as well as `nullable (proved)` and `nullable (rule)`, since a non-null return without evidence on the adopted Patch is the bet that costs a major; `consistent` otherwise, so always when the Overlay says `true`; a Native with no entry, or no family, fails the command. A case the Slice lists but a crash left `not run` gives `review`; a required case the Slice never lists, the report cannot see, since the cases' labels are free text: the case generators (below) expand every required case of a Native, and a review checks each generator against its family's rule once. The command writes the Slice's section of `docs/research/nullability-sweep.md`, headed by the Probe, the Patch the run's `BEGIN` line names (the one its build compiled against, whatever the manifest says by the time of the report), the client's Build `probe:run` recorded (`not recorded` for a run without one), the date and the runId, with one table per Native and a proposed `notes` text below it, or only "review" for `review` and for an `unsafe` Native whose cases that did not crash gave anything but a handle, then one table per parameter of call cases (below), and replaces only that section when it runs again. The command prints one line per Native and per parameter. When the section it replaces was written under another Build, it then prints each change from it, which the Patch adoption pull request carries, while git keeps the old section: a verdict that differs (`, a new unsafe` when it became `unsafe`), a case whose outcome differs, a case added or gone, a Native or parameter added or gone; a handle's id or type is never a change. The Nullability sweep is re-run on every Patch adoption (the `new-patch` skill).

### The crash loop

`probe:run` exits 2, `crashed` (a stall included), naming the pending case `<native> <case>`. Then:

1. **Confirm.** Run the Slice again, unchanged. A crash is confirmed when a later unchanged run crashes on the same case. When the confirming run does not, the crash may be intermittent: run the Slice once more, unchanged, and a crash there confirms it too (#364). Until it is skipped, the report gives a `nil` call case that crashed `review`, never `non-null (crashed)`: narrowing a parameter is breaking, so only a confirmed crash narrows it.
2. **Skip.** Add the case's label, `<native> <case>`, to the Slice's `skip` list and run it again. Each crash skips one case, so the loop ends.
3. **Stop and ask the human** when:
   - the run names no pending case, or a pending step that is not a case (a crash while building the Fixtures, before the cases);
   - neither of the two unchanged runs after a crash crashes on the same case: a crash not reproduced is never recorded as `unsafe`;
   - the stall capture, `.probe/<probe>/stall.png`, shows neither a crash nor a hang (a Probe stuck, say);
   - the Slice reaches 3 skipped cases: about three crashes are expected across the whole sweep, so three in one Slice point at a broken Fixture or a wrong cut.

The `skip` list is committed in the Slice's Probe source, one label per entry, each with a comment naming the Patch and the runId it crashed on, so the Slice reproduces and the per-Patch re-run knows it:

```ts
const SKIP = [
  // Crashed on <Patch>, runs <runId> and <runId> (the confirming run).
  "GetExpiredTimer one call",
  // Crashed on <Patch>, runs <runId> and <runId> (the second confirming run);
  // not run <runId> (the first): intermittent, N of M runs.
  "CreateFogModifierRadiusLoc radius: 2147483647",
];
```

An intermittent crash skips its case like any other and counts toward the 3-skip stop. The report's proposed `notes` do not say the crash is intermittent: the curation pull request writes that sentence by hand, with its count, crashed in N of M runs.

### Call cases and the parameter verdict

A Native that returns nothing has no return value to measure: its call cases measure whether one of its parameters takes `nil`. The 16 `filter` parameters outside `TriggerRegister*` (`EnumDestructablesInRect`, `EnumItemsInRect`, the four `ForceEnum*` and the ten `GroupEnum*`) run in a Slice of their own, `nullability-filters`. A call case (`CallCase` in the case runner) names the parameter it measures, `param`, what it passes there, `argument` (`nil`, an `always-true` filter or another `live` one), and what it counts, `counted` (`unit`, `player`, `item` or `destructable`); its `call` calls the Native and returns the count it enumerated, the units of the group it filled, say. It runs under the same `PENDING`, checkpoint and `pcall`, and its records carry the three fields:

```text
<seq> CASE argument=nil|always-true|live case=<label> counted=<counted> group=a|b native=<native> param=<param>
<seq> CALL argument=<argument> case=<label> count=<count> counted=<counted> group=a|b native=<native> outcome=completed param=<param>
<seq> CALL argument=<argument> case=<label> counted=<counted> group=a|b message=<error> native=<native> outcome=error param=<param>
<seq> SKIP argument=<argument> case=<label> counted=<counted> group=a|b native=<native> param=<param> reason=crashed
```

A call that returned no integer, a float or no number at all, records an `error`. A Native has return cases or call cases, never both. Each parameter gets a verdict from its cases, the first of these that holds: `non-null (crashed)` when a `nil` case was skipped, a crash [the crash loop](#the-crash-loop) confirmed; `nullable (completed)` when every case completed, a `nil` one at least; `review` otherwise (an error, a crash with a live filter, a case not run, no `nil` case, a `nil` case that crashed in this run only). Making a parameter non-null narrows it, which is breaking: hence before 1.0.0, and only for a confirmed crash. The verdict is compared with the entry's `params[].nullable`, `mismatch` when they disagree, and gets a proposed sentence for the Native's `notes`, naming the parameter: the Overlay has no `params[].notes`, so the sentence joins the Native's `notes`, its `@remarks`. A `nil` case's count is compared with the counts of the `always-true` cases of its own group: when they differ, the section prints the difference, `Count difference: nil: <case> <count>; always-true: <case> <count>`, for the pull request. When no group has both a completed `nil` case and a completed `always-true` case, there is nothing to compare and no difference is printed.

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
  - per numeric parameter, the constructor's odd values, one at a time: `0`, a negative, a coordinate outside the world, `2147483647` (`GetStartLocPrio`'s two integers); no rawcode or string odd value;
  - with no parameters, one call.
- **converter**:
  - the integer of every `common.j` constant of its type;
  - `-1`;
  - the first integer past the last constant;
  - `2147483647` and `-2147483648`;
  - for the six types with no constant (`mapsetting`, `mapvisibility`, the four `ability*levelarrayfield`): `0`, `1`, `-1`, `2147483647`.
- **optional-property**, **event-response**, **callback-getter** and **lookup**, nullable by their nature: one cheap case that should return nothing, where one exists (a call outside the context, an unsaved key, an index out of range), with no event Fixture. A member whose cheap case returns a handle stays nullable, `nullable (rule)`. Cases that may crash (`GetExpiredTimer`) follow [the crash loop](#the-crash-loop).

A Slice that leaves a required case unrun (no Fixture for a stale state, say) cannot make that Native non-null: its verdict is `review`.

### The case generators

A Slice declares its Natives, not every case: one generator per family, in `probes/nullability/`, expands a Native's required cases as the list above gives them, one value varied at a time, so a review checks each generator against its family's rule once. Each returns the Native's return cases (`ReturnCase`, never a call case: those of `nullability-filters` are its own), every (a) case before any (b) case; `inGroupOrder(...)` (`expand.ts`) joins a Slice's Natives into one case list, every (a) case of the Slice before any (b) case.

| Family                          | Generator                                                                                      | The Slice declares                                 | Labels                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| converter                       | `converterCases(native)` (`converter.ts`)                                                      | the converter only                                 | each constant's name (`RACE_HUMAN`; constants of one integer as `ITEM_TYPE_POWERUP or ITEM_TYPE_TOME`, called once), then `-1`, `past the last constant` (the greatest constant plus one, which for a rawcode field is not the last in `common.j`), `2147483647`, `-2147483648`, each unless a constant holds it; `0`, `1`, `-1`, `2147483647` with no constant |
| constructor                     | `constructorCases(native, params, call)` (`constructor.ts`)                                    | each parameter, typical, by kind (below)           | `typical arguments` (or `one call` with no parameter), then `<param>: <phrase>`: `0`, `negative` (`-1`), `outside the world` (`1000000`), `2147483647`, `unknown rawcode` (`'zzzz'`), `empty string`, `unknown name`, and each stale state the parameter declares                                                                                               |
| registration                    | `registrationCases(native, params, call)` (`constructor.ts`)                                   | as a constructor, its `trigger` parameter required | the constructor's, `<trigger>: destroyed trigger` among them, and `<filter>: nil`                                                                                                                                                                                                                                                                               |
| enum-getter, intrinsic-property | `enumGetterCases`, `intrinsicPropertyCases` (`getter.ts`)                                      | as a constructor                                   | `typical arguments` (or `one call`), `<player>: empty slot`, `<player>: neutral player`, the constructor's numeric ones (`<param>: 0`, `negative`, `outside the world`, `2147483647`), and each stale state; no rawcode or string odd value                                                                                                                     |
| event-response, callback-getter | `eventResponseCase(native, call)`, `callbackGetterCase(native, call)` (`nullable.ts`)          | the call                                           | `outside its event`, `outside its callback`                                                                                                                                                                                                                                                                                                                     |
| lookup, optional-property       | `lookupCase(native, label, call)`, `optionalPropertyCase(native, label, call)` (`nullable.ts`) | the call and its label                             | the Slice's: `unsaved key`, `unit with no rally point`                                                                                                                                                                                                                                                                                                          |

A parameter is declared with the helper of its kind (`parameters.ts`), in the Native's order, and `call` receives the arguments as one tuple: `numeric(name, typical)`, `rawcode(name, typical)`, `text(name, typical)`, `handle(name, live, [[phrase, stale], ...])` with each stale state its type has, `[]` when it has none (the argument is required, so a Slice cannot forget it), `trigger(name, live, destroyed)`, `filter(name, live, [[phrase, stale], ...])` for a boolexpr the Typings take as nullable, `player(name)` (`Player(0)`, from the Fixtures; only a getter also builds and runs the empty slot and Neutral Passive, so a constructor never fails on an empty-slot Fixture it does not use) and `fixed(name, value)` for a value never varied, a boolean, a callback or an enum constant. An odd value equal to the typical one is not run twice, and the arguments are Fixtures built before the cases, never in a call:

```ts
const cases = inGroupOrder(
  converterCases("ConvertRace"),
  registrationCases(
    "TriggerRegisterPlayerUnitEvent",
    [
      trigger("whichTrigger", liveTrigger(), destroyedTrigger()),
      player("whichPlayer"),
      fixed("whichPlayerUnitEvent", EVENT_PLAYER_UNIT_DEATH),
      filter("filter", liveFilter(), [
        ["destroyed boolexpr", destroyedBoolExpr()],
      ]),
    ],
    ([t, p, e, f]) => TriggerRegisterPlayerUnitEvent(t, p, e, f),
  ),
);
```

The converter generator reads the converter table, `probes/nullability/converter-constants.ts`, the integer of every `common.j` constant of each converter's type, which the game cannot read: `pnpm probe:nullability-converters` writes it from the vendored `common.j` of the Typings' Patch and the Overlay's `converter` family, and a test fails until it runs again after a new Patch or a change to that family. The labels name the cases in the `skip` lists and the `PENDING` lines, so the generators' tests (`test/lua/nullability-generators.test.ts`) pin them.

The proposed `notes`, published as `@remarks`, give the reason in game terms, never the family's name. A case's label is a phrase (`outside its event`, `unsaved key`), so the text names it in parentheses, never after "for". A parameter's text is a sentence of its Native's `notes`, since the Overlay has no `params[].notes`:

| Verdict                                 | Proposed `notes`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `non-null (evidence)`                   | `Returned a handle in every case of the nullability sweep (<cases>) on <Patch>; evidence, not proof.`                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `non-null (evidence, handle id 0)`      | the above, then `The handle had id 0 in <a case\|n cases> (<cases>).`                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| converter backed non-null               | `Returned a handle for every common.j constant of its type and for <boundaries> (nullability sweep, <Patch>); <id rule>. Evidence, not proof.`, or for a type with no constant `Returned a handle for <integers>, its type having no common.j constant (nullability sweep, <Patch>); <id rule>. Evidence, not proof.`; the id rule is `the handle's id is the integer passed in`, or the bit flag `1 << ((i - 1) & 31)` (`ConvertMouseButtonType`); the full text above when a constant was not passed or no rule gives every id |
| `nullable (proved)`                     | `Returned nothing in <a case\|n cases> of the nullability sweep (<cases>) on <Patch>.`                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `nullable (rule)`                       | `May return nothing <reason>. Returned a handle in every case of the nullability sweep (<cases>) on <Patch>.`, then, when one was of id 0, the id-0 sentence above                                                                                                                                                                                                                                                                                                                                                               |
| `unsafe`                                | `Crashed the game in <a case\|n cases> of the nullability sweep (<cases>) on <Patch>.`, then, for a nullable family, `May return nothing <reason>.`, then `Returned a handle in every other case (<cases>).` and, when one was of id 0, the id-0 sentence above; "review" when another case gave anything but a handle                                                                                                                                                                                                           |
| `nullable (proved)` with a crashed case | `Crashed the game in <a case\|n cases> of the nullability sweep (<cases>) on <Patch>.`, then the `nullable (proved)` text                                                                                                                                                                                                                                                                                                                                                                                                        |
| parameter `nullable (completed)`        | `A nil <param> keeps every <counted> (nullability sweep, <Patch>).`; when the counts differ, or when there is nothing to compare them with, `A nil <param> is accepted (nullability sweep, <Patch>).`, a difference going in the pull request                                                                                                                                                                                                                                                                                    |
| parameter `non-null (crashed)`          | `Crashes the game with a nil <param> (nullability sweep, <Patch>).`                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

The `<reason>` per family: "outside its event" (event-response), "outside its enum or filter callback" (callback-getter), "when nothing is found" (lookup), "when the object has none" (optional-property).

A converter's case list runs to thousands of characters, so its `notes` say the measured fact instead (#406): the report checks each case's label against the converter table of the run's Patch, read from its vendored `common.j`, and its id against the id rules of `src/nullability/converter-notes.ts`. The full case lists stay in the report's tables.

### The curation

The report never writes the Overlay; `pnpm probe:nullability-curate <probe>` does, for review (#406). It reads the Slice's last run and its verdicts as the report does, then writes `packages/reforged-types/overlay/`:

- `returns.nullable: false` only for a `non-null (evidence)` or `non-null (evidence, handle id 0)` verdict of a family that may be non-null; it never sets `true`, so it never widens a return.
- the proposed `notes`, after `params`, of every Native whose entry holds none: the Native's text, or the sentences of its parameters for a Native of call cases (a `filter`'s; `params[].nullable` never changes). An entry that holds `notes` keeps them, from their first Build (#365) or written by hand (`TriggerAddAction`'s), and the command prints the proposal for the review. A proposal of "review" writes nothing.
- nothing at all when the Slice has a `mismatch`: it refuses with one line per Native and parameter.

It writes local files only, and prints one line per Native. The Overlay still changes only through a reviewed pull request (#296):

- **One curation pull request per Slice group**, the Slices sharing a name prefix: converters, event-responses, lookups, callbacks-and-properties, getters, constructors, registrations, filters, risky. It opens once every Slice of its group has run, runs the command on each, and carries the Overlay, the regenerated Typings and the report's sections, so a family's rule is reviewed once, over all its Natives. A Slice's own pull request never changes the Overlay.
- **A `mismatch` is a `bug` issue per Native**, as #280 was, opened from the pull request of the Slice that found it and closed by its group's curation pull request (`Closes #…`), which fixes it by hand: a breaking widening the agent stops on first (#365).
- **The changeset** names `reforged-types`, `minor` when a return narrows or widens, `patch` when only `notes` change; `reforged-ts` only when a Wrapper changes.

## Layout

- `probes/`: the Probes, and `tsconfig.json`, the typescript-to-lua project every Probe compiles with. `calibration.ts` measures the Preload limits the Result file's format was frozen on, checks C1 to C8 of #298, in test files of its own under `CustomMapData\reforged-ts\calibration\`; its doc comment lists what it records, and its last step, C8, calls `EndGame(false)` 3 seconds after `END`, which a run of `probe:run` never reaches: it ends the game at `END` (#360). `hello`, `failing`, `held` and `failing-later` exist for the runner's own tests. `probes/nullability/` holds what the Slices of the Nullability sweep share: the case runner, the Fixtures, the case generators and the converter table, and `records.d.ts`, the format of the case runner's records, which the report imports too. `src/nullability/converters.ts` renders the converter table.
- `game/`: the in-game module (`runner.ts`, the entry of every bundle), what it shares with the Probes (`errors.ts`, the message of a raised value) and the types a Probe sees (`probe.ts`).
- `probe.w3m/`: the map folder, a copy of the Template's; `PROVENANCE.md` lists every file copied from the Template.
- `src/`: the commands, compiled to `build/`; `src/machine.ts` is the one way they reach the machine, which the tests replace with a fake. `src/read.ts` is the reader the package's other scripts import. `src/nullability/` is the Nullability sweep's report and its curation.
- `test/`: the Node tests of the commands, and under `lua/` the in-game module's tests, and those of the Probes' bundles, on the `reforged-test` harness, which share `lua/bundle.ts` and `lua/stubs.d.ts`, the stub helpers they call, with `lua/probes/`, Probes of those tests only. `test/fixtures/nullability/` holds the report's fixture Overlay and, under `vendor/`, a fixture `common.j` of three converters; `test/support/nullability.ts` the Slice's build the report's and the curation's tests share. `test/fixtures/bridge/` is the bridge: `manifest.json`, whose Patch the Lua tests' builds bake, and the lines of the hello Probe's Result file, `hello.txt` as the finished run leaves it and `hello-checkpoint.txt` as its second checkpoint does, `PENDING` lines, encoded values and a continuation line included, and `failing.txt`, those of the failing Probe's, ending in `ERROR` and `END status=failed`. The Lua tests assert the runner writes them and the Node tests assert the reader decodes them back.
- `.probe/`: ignored: the builds, the state files and the compiled Lua tests.
