# w3ts (fork)

TypeScript wrappers and utilities over the Warcraft III Lua scripting API, compiled to Lua with typescript-to-lua. This context covers the library itself; consuming map projects and the game engine are outside it.

## Language

**Native**:
A function, type or constant the game exposes to map scripts in Lua (`CreateUnit`, `unit`, `bj_MAX_PLAYERS`).
_Avoid_: game API, JASS function, builtin

**Handle**:
The game's opaque reference to an engine object (`unit`, `timer`, `framehandle`); the thing a Wrapper holds. Its numeric id is a property of the handle, not the handle itself.
_Avoid_: object, pointer, id

**Typings**:
The TypeScript declarations (`.d.ts`) that describe the Natives of one game Patch.
_Avoid_: types, definitions, common.j

**Overlay**:
Hand-curated facts about the Natives (nullability, deprecation, notes) merged over the Typings at generation time; never edited in the generated file.
_Avoid_: patch file, fixups, manual types

**Wrapper**:
A library class that owns one Handle and exposes its Natives as typed members (`Unit`, `Timer`, `Frame`).
_Avoid_: handle class, model, entity

**Static namespace**:
A library class of static members only, over one facility of the whole game rather than one Handle (`Camera`, `Input`, `Terrain`, `File`); a class, not a TypeScript namespace, so the Wrapper coverage report counts its calls.
_Avoid_: singleton, module, utility class

**Owner**:
The Wrapper a Native belongs to: the one whose handle type is the Native's first parameter, or, for a Native with no handle first that returns a wrapped handle type, that type's Wrapper (`CreateTimer` to `Timer`). A Native with neither is unowned.
_Avoid_: owning class, home, target Wrapper

**Wrapper coverage report**:
The generated list, per Wrapper, of the Natives it owns and whether each is covered (some class calls it, not necessarily the Owner), excluded with a reason, or missing; `pnpm check` fails on a missing one.
_Avoid_: coverage (alone, which is test coverage), API audit, native checklist

**System**:
A library utility that wraps no Handle, even when it uses some for its own work (`sync`, `host`, `file`, `binary`, `base64`, `gametime`).
_Avoid_: helper, module, util

**Hook**:
A callback the library runs at an Init stage. `addScriptHook` (before/after `main` or `config`) is the deprecated alias.
_Avoid_: lifecycle hook, init hook, plugin

**Event descriptor**:
A value that knows how to register one game event on a Trigger and how to read that event's payload from the trigger context.
_Avoid_: event type, event enum, listener spec

**Subscription**:
What `on()` returns for one handler and one Event descriptor: it holds the one Trigger `on()` created for them, is owned by the caller and is ended with `destroy()`, which destroys that Trigger only.
_Avoid_: listener, binding, registration

**Init stage**:
One of the four points of a map's initialization (globals, triggers, init triggers, game start) where library and Map project callbacks run, each under `pcall`.
_Avoid_: hook, lifecycle event, main/config

**Guard**:
A check that catches a known Warcraft III scripting pitfall (desync, crash, leak) before it reaches players: at the type level, in the lint plugin, or at run time in Dev mode.
_Avoid_: safety check, validation, sanity check

**Dev mode**:
The library state set by `Reforged.configure({ devMode: true })` in which runtime Guards are active; off by default and in release builds.
_Avoid_: debug mode, development build, test mode

**Map project**:
A repository that consumes the library to produce a playable map, normally generated from the Template.
_Avoid_: consumer, user code, game project

**Template**:
The starter repository a Map project is generated from.
_Avoid_: boilerplate, starter kit, example map

**Seed**:
A file the Template ships that becomes the Map project author's own after generation (`AGENTS.md`, `CONTEXT.md`, the Agent skills); the Template refreshes its copy on each library release, a generated Map project never does.
_Avoid_: template file, scaffold, boilerplate file

**Reference consumer**:
The Template in its role as the Map project every library release must build, with the packed packages, before it is published.
_Avoid_: example project, demo map, integration test

**Toolchain**:
The tools that turn a Map project's TypeScript into a Lua map script: TypeScript, typescript-to-lua, lint and build.
_Avoid_: build system, pipeline, stack

**Patch**:
A released version of the game, identified by its Build (3.0.0.24268). Typings and library releases are tied to a Patch.
_Avoid_: version, update, release (a library release is not a game patch)

**Build**:
The full four-component number that identifies one Patch (3.0.0.24268); its first three components are its Game version.
_Avoid_: version, patch number, build number

**Game version**:
The first three components of a Build (3.0.0), shared by every Patch released under that number; a Map project selects its Typings by Game version.
_Avoid_: version (alone), Patch (one Game version can span several Builds)

**Agent skill**:
A folder holding a `SKILL.md` that scripts one workflow for an AI coding agent to follow when invoked (`add-wrapper`, `map-feature`).
_Avoid_: prompt, recipe, playbook

**Probe**:
A TypeScript file of the Probe runner (`probe/probes/<probe>.ts`, named in kebab-case) that runs in the real game to measure what only the game can tell (whether a Native returns nothing, what a `Preload` line survives), and writes what it measures as records of its Result file. It exports `run(p)` and may import the library.
_Avoid_: probe map (the Lua pasted into the World Editor, #9), test, script

**Probe run**:
One run of a built Probe in the game: the build bakes a fresh runId, a human launches the game on it and closes it, and the agent reads the Result file. A Result file whose runId is not the last build's belongs to no current Probe run.
_Avoid_: session, execution, test run

**Probe runner**:
The private workspace package `probe/` and its three commands: `probe:build` compiles a Probe into a map folder, `probe:launch` starts the game on it, `probe:read` reads its Result file and says how the Probe run ended.
_Avoid_: harness (the Lua test harness), launcher, probe map

**Result file**:
The file a Probe run writes through `Preload` in the game's `CustomMapData` folder, `reforged-ts\probes\<probe>.txt`, one line per record: a `BEGIN` line naming the Probe and its runId, the Probe's records, `PENDING` before a risky step, `ERROR` when the Probe throws, and last a `CHECKPOINT` line or an `END` line with the run's status. A checkpoint is one full rewrite of the file with everything recorded so far, so a crash loses only what came after the last one.
_Avoid_: log, output file, save file

**Nullability sweep**:
Measuring in the game the `returns.nullable` of the 394 handle-returning Natives, in Slices, each reported against the Overlay in `docs/research/nullability-sweep.md` by `pnpm probe:nullability-report <probe>`, which never writes the Overlay.
_Avoid_: nullability audit, null check, nullability test

**Slice**:
One batch of the Nullability sweep: one Probe (`nullability-slice-1`), which calls its Natives in hand-listed cases, and one section of the sweep's report.
_Avoid_: batch, phase, chunk

**Fixture**:
A factory, inside a Probe, for a Handle in a known state (live, dead, removed, destroyed), built with Natives only, so a case names the state it tests. A **stale handle** is one whose object is dead, removed or destroyed: the Handle is still held, and the object behind it is no longer alive or no longer there.
_Avoid_: setup, mock, stub (the Lua test harness's stand-ins); test fixture (a file a vitest test reads)
