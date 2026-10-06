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

**Ban list**:
The Natives the lint plugin forbids outright, whatever their arguments, because every call kills the thread, leaks or desyncs (`TriggerSleepAction`, `CreateTimerBJ`); each entry names its reason and a replacement.
_Avoid_: unsafe natives, unsafe (alone), blacklist

**Dev mode**:
The library state set by `Reforged.configure({ devMode: true })` in which runtime Guards are active; off by default and in release builds.
_Avoid_: debug mode, development build, test mode

**Map project**:
A repository generated from the Template that consumes the library to produce a playable map; the Template fixes the versions of its Toolchain and of the reforged-ts packages.
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

**Rawcode**:
The four-character id of one type of object (`hfoo`, `AHbz`), which a map script holds as an integer (`FourCC("hfoo")`).
_Avoid_: object id, type id, fourcc

**Object kind**:
Which of the seven families a type of object belongs to: unit (heroes included), item, ability, buff, destructable, doodad or upgrade; each Rawcode names an object of one Object kind.
_Avoid_: object type, category, rawcode type

**Editor global**:
A global the World Editor declares in a map folder's `war3map.lua`: a `gg_` one for something placed or created in the editor (`gg_unit_H002_0255`, `gg_trg_Melee_Initialization`), or a `udg_` one for a variable of the Variable Editor (`udg_SpawnType`).
_Avoid_: GUI global, editor variable

**Object data**:
A map's definitions of its types of object (units, items, abilities, buffs, destructables, doodads, upgrades), stored in its `war3map.w3u`, `.w3t`, `.w3a`, `.w3h`, `.w3b`, `.w3d` and `.w3q` files, their `war3mapSkin` counterparts (which hold a Custom object's name), and the strings they reference in `war3map.wts`.
_Avoid_: object editor data, w3o

**Game data set**:
The set of Built-in objects a map selects in its options, one of several a Patch ships (the default, Custom v1, Melee), which differ in which objects exist and in their stats.
_Avoid_: data set (alone), game data, balance

**Built-in object**:
A type of object the game ships in a Patch, the same in every map that selects the same Game data set (`hfoo`); one a map's Object data modifies keeps its Rawcode and is still a Built-in object.
_Avoid_: native object (a Native is something else), melee object, standard object

**Custom object**:
A type of object that exists only in one map's Object data (`h000`), new or derived from a Built-in object.
_Avoid_: map object, custom unit

**Object Editor**:
The World Editor's editor of Object data; an external editor of Object data is not one.
_Avoid_: OE, object editor (for an external tool)

**Studio**:
The Toolchain's local app for editing what code does not express well, one area per thing it edits; today Object data, where it creates, edits and deletes any object of a Map project's map folder. It is not the Object Editor.
_Avoid_: external editor, object editor, web editor

**Object definition**:
A type of object declared in a Map project's code rather than authored in an editor: a new Custom object, or a change to a Built-in object the map folder does not already change. It belongs to the code alone, never also to the map folder.
_Avoid_: code object, compiletime object

**Object sync**:
Writing a Map project's Object definitions into its map folder's Object data, so that the World Editor, HiveWE and any other editor show them before a build.
_Avoid_: inject, export, object generation

**Object manifest**:
The Map project's record of which Rawcodes belong to its Object definitions and what an Object sync last wrote for each, so a later one can replace, remove or detect a change made outside the code.
_Avoid_: lock file, provenance field

**Object adoption**:
Handing an object of the map folder (a Custom object, or a Built-in object the map folder changes) to the code: it becomes an Object definition and enters the Object manifest, while the map folder stays as it was.
_Avoid_: import, convert, export

**Object release**:
The reverse of an Object adoption: an object that belongs to an Object definition goes back to the map folder as the code last defined it, and leaves the code and the Object manifest.
_Avoid_: eject, release (a library release is something else)

**Agent skill**:
A folder holding a `SKILL.md` that scripts one workflow for an AI coding agent to follow when invoked (`add-wrapper`, `map-feature`).
_Avoid_: prompt, recipe, playbook

**Probe**:
A TypeScript file of the Probe runner (`probe/probes/<probe>.ts`, named in kebab-case) that runs in the real game to measure what only the game can tell (whether a Native returns nothing, what a `Preload` line survives), and writes what it measures as records of its Result file. It exports `run(p)` and may import the library.
_Avoid_: probe map (the Lua pasted into the World Editor, #9), test, script

**Probe run**:
One run of a built Probe in the game, from start to end by the agent: the build bakes a fresh runId, `probe:run` starts the game on it, passes the screens before the map, ends the game once the Result file ends or stalls, and reads it. A human steps in only to log in to Battle.net when the game asks. A Result file whose runId is not the last build's belongs to no current Probe run.
_Avoid_: session, execution, test run

**Probe runner**:
The private workspace package `probe/` and its commands: `probe:build` compiles a Probe into a map folder, `probe:run` runs it in the game end to end, `probe:read` reads its Result file and says how the Probe run ended, `probe:nullability-report` reports a Slice, `probe:nullability-curate` applies a Slice's verdicts to the Overlay.
_Avoid_: harness (the Lua test harness), launcher, probe map

**Result file**:
The file a Probe run writes through `Preload` in the game's `CustomMapData` folder, `reforged-ts\probes\<probe>.txt`, one line per record: a `BEGIN` line naming the Probe, its runId and the Patch of the Typings it was built against, the Probe's records, `PENDING` before a risky step, `ERROR` when the Probe throws, and last a `CHECKPOINT` line or an `END` line with the run's status. A checkpoint is one full rewrite of the file with everything recorded so far, so a crash loses only what came after the last one.
_Avoid_: log, output file, save file

**Nullability sweep**:
Measuring in the game the `returns.nullable` of the 394 handle-returning Natives, in Slices, each reported against the Overlay in `docs/research/nullability-sweep.md` by `pnpm probe:nullability-report <probe>`, which never writes the Overlay, and curated into it by `pnpm probe:nullability-curate <probe>` in one reviewed pull request per group of Slices, and re-run on every Patch adoption, every Slice on the adopted Build.
_Avoid_: nullability audit, null check, nullability test

**Nullability family**:
The kind of handle-returning Native the curation rule types by: whether it may be typed non-null at all, and which cases the Nullability sweep runs before it is. A converter, enum-getter, constructor, registration or intrinsic-property Native may be non-null; an event-response, callback-getter, lookup or optional-property Native is nullable, since by its nature it may have nothing to return.
_Avoid_: category, kind, group (a Slice's case group)

**Placeholder handle**:
A handle the game returns in place of nothing, in a case where the Native could not do what it was asked (an unknown name or rawcode, a removed or destroyed argument), recognisable by an id no successful call of that Native returns (0 or -1). A handle of id 0 that a successful call returns (a converter's integer 0, an enum-getter's constant of integer 0, the first terrain deformation) is not a placeholder.
_Avoid_: sentinel, null handle

**Slice**:
One batch of the Nullability sweep: one Probe, named by what it holds, `nullability-<family>[-<part>]` (`nullability-converters-1`, `nullability-filters`), which declares its Natives of one Nullability family and runs the cases its family's case generator expands, and one section of the sweep's report.
_Avoid_: batch, phase, chunk

**Fixture**:
A factory, inside a Probe, for a Handle in a known state (live, dead, removed, destroyed), built with Natives only, so a case names the state it tests. A **stale handle** is one whose object is dead, removed or destroyed: the Handle is still held, and the object behind it is no longer alive or no longer there.
_Avoid_: setup, mock, stub (the Lua test harness's stand-ins); test fixture (a file a vitest test reads)

**Crashing case**:
A case of the Nullability sweep in which the game crashed: one Native with one argument value or Handle state (`CreateImage` with image type 2147483647, `GetExpiredTimer` in a trigger's action), on one Build. A Native with a Crashing case is not on the Ban list: its other cases ran.
_Avoid_: unsafe (alone), crash (alone, which is the event, not the case), crashing Native
