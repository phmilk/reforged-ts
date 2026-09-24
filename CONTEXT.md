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

**System**:
A library utility that owns no Handle of its own (`sync`, `file`, `base64`, `gametime`).
_Avoid_: helper, module, util

**Hook**:
A callback the library runs at an Init stage. `addScriptHook` (before/after `main` or `config`) is the deprecated alias.
_Avoid_: lifecycle hook, init hook, plugin

**Event descriptor**:
A value that knows how to register one game event on a Trigger and how to read that event's payload from the trigger context.
_Avoid_: event type, event enum, listener spec

**Subscription**:
The Trigger that `on()` creates for one handler and one Event descriptor; owned by the caller and ended with `destroy()`.
_Avoid_: listener, binding, registration

**Init stage**:
One of the four points of a map's initialization (globals, triggers, init triggers, game start) where library and Map project callbacks run, each under `pcall`.
_Avoid_: hook, lifecycle event, main/config

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
A released version of the game, identified by version and build number (3.0.0.24268). Typings and library releases are tied to a Patch.
_Avoid_: version, update, release (a library release is not a game patch)

**Agent skill**:
A folder holding a `SKILL.md` that scripts one workflow for an AI coding agent to follow when invoked (`add-wrapper`, `map-feature`).
_Avoid_: prompt, recipe, playbook
