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

**Wrapper**:
A library class that owns one Handle and exposes its Natives as typed members (`Unit`, `Timer`, `Frame`).
_Avoid_: handle class, model, entity

**System**:
A library utility that owns no Handle of its own (`sync`, `file`, `base64`, `gametime`).
_Avoid_: helper, module, util

**Hook**:
A callback the library runs before or after the map script's `main` or `config` entry point.
_Avoid_: lifecycle hook, init hook, plugin

**Map project**:
A repository that consumes the library to produce a playable map, normally generated from the Template.
_Avoid_: consumer, user code, game project

**Template**:
The starter repository a Map project is generated from.
_Avoid_: boilerplate, starter kit, example map

**Toolchain**:
The tools that turn a Map project's TypeScript into a Lua map script: TypeScript, typescript-to-lua, lint and build.
_Avoid_: build system, pipeline, stack

**Patch**:
A released version of the game, identified by version and build number (3.0.0.24268). Typings and library releases are tied to a Patch.
_Avoid_: version, update, release (a library release is not a game patch)
