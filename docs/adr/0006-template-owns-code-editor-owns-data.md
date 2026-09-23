---
status: accepted
date: 2026-09-23
---

# The Template owns code, the World Editor owns data, and every library release must build the Template before it ships

The upstream template's open issues all trace to compile-time object-data editing (`war3-transformer` and its object-data library mis-round-tripping map files), while its core pipeline (editor map folder, tstl `luaBundle`, editor script concatenated first, pure-TypeScript MPQ writer, `-loadfile` launch) has worked for years. The new Template, `phmilk/reforged-ts-template`, keeps that core and draws the boundary explicitly: the World Editor owns terrain, object data and placed units; TypeScript owns code; GUI/JASS triggers keep working because the editor's script runs first in the same Lua global scope. Compile-time object editing and JSX frames are out of the Template and may return only as optional packages. The Template is the library's Reference consumer: the library's CI packs its packages, installs them into the Template and builds it before every publish, so a release that breaks the Template does not ship. The Lua test harness is published as `reforged-test` so Map projects test logic without the game.

## Considered options

- Keeping `war3-transformer` for `compiletime()` and object data: the feature users ask about most, and the feature that breaks most; deferred to an optional package with a correct object-data library.
- A Deno pipeline as voces/fixus uses: proven, but a second runtime next to the pnpm toolchain the library already requires.
- A `create-reforged-ts` scaffolder instead of a template repository: better first-run experience, but one more artefact to keep in sync; deferred until the Template is stable.

## Consequences

- Object data lives only in the editor; a Map project that needs generated object data waits for the optional package.
- The library's release pipeline has a hard dependency on the Template repository being buildable.
- The MPQ writer must be proven against the 3.0 editor's `.w3i` version 39 before the Template is built (verification ticket on the map); the fallback is a parser fix or opaque handling of the w3i.

Decision record: https://github.com/phmilk/reforged-ts/issues/23
