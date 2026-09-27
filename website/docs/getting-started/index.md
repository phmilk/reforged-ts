---
title: Getting started
description: Start a Map project from the Template, the supported path, and the Toolchain it needs.
---

# Getting started

A Map project starts from the [Template](https://github.com/phmilk/reforged-ts-template): a repository with a Warcraft III map, its code in TypeScript, and the Toolchain already set up. The Template is the supported path: every library release is built against it before it is published, so a project generated from it compiles with the versions it pins. This page goes from nothing to a map running in the game.

## What you need

| What             | Version                                                              | Why                                                                                                                         |
| ---------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Warcraft III     | 3.0.0 or later, with a Battle.net login saved on the machine         | `pnpm test:map` starts the game on the built map. The game is online-only.                                                  |
| The World Editor | The one that ships with the game                                     | It owns the map's data (terrain, object data, placed units). The map is saved as a folder, with Lua as its script language. |
| Node             | 24 (the Template's `.node-version`); the packages need 22.13         | The build, the tests and the tools run on it.                                                                               |
| pnpm             | 12 (the Template's `packageManager`; `npm install --global pnpm@12`) | The package manager of the Template.                                                                                        |

The Template pins the rest of the Toolchain, so there is nothing else to install: TypeScript at the exact version typescript-to-lua supports (6.0.2 with typescript-to-lua 1.37), typescript-to-lua with its language extensions, the [Typings](../guides/typings.md) of the Patch (`reforged-types`), ESLint with `eslint-plugin-reforged`, and vitest with the Lua test harness (`reforged-test`). [Compatibility](../compatibility/index.mdx) lists which versions go together for each release.

On Linux the game runs through Wine: set `winePath` in `reforged.config.ts`.

## Create the project

1. On the [Template's page](https://github.com/phmilk/reforged-ts-template), click **Use this template** and create your repository.
2. Clone it and open a terminal in the clone.
3. Install: `pnpm install`. The install also writes the files under `src/generated` (the build mode and the typings of the map's editor globals).

   During the build phase the library publishes its packages as `1.0.0-alpha.N` under npm's `next` dist-tag. The [Template's README](https://github.com/phmilk/reforged-ts-template#the-library-packages) says which install applies today; to build against a local clone of the library instead, run `pnpm use:local ../reforged-ts`.

4. Open the map folder, `maps/reforged-ts-template.w3m`, in the World Editor and save it. Leave Scenario > Map Options > Script Language on Lua: the build appends your code to the script the editor writes. To rename the map, save it under `maps` with the new name and set `mapFolder` in `reforged.config.ts`.
5. Build: `pnpm build`. It prints the packed archive, `dist/reforged-ts-template.w3m`.
6. Play: `pnpm test:map` builds, then opens the game on the built map, windowed. When the game is not in a Battle.net install location, set the `WC3_EXECUTABLE` environment variable to its executable.

## The starter code

`src/main.ts` is the entry point. The Template's starter prints a line when the game starts, prints the name of every unit that dies, and counts the minutes played:

```ts title="src/main.ts"
import { Init, on, Reforged, Timer, UnitEvents } from "reforged-ts";
import { devMode } from "./generated/env";

// First statement: the mode decides whether the library's runtime checks run.
// `pnpm build` generates devMode = true, `pnpm build --mode release` false.
Reforged.configure({ devMode });

// An Init stage: the game has started. Create Handles from an Init stage,
// never while the script loads.
Init.onGameStart(() => {
  print("reforged-ts-template: game started");

  // A Subscription: a handler on an Event descriptor. on() returns it; call
  // destroy() on it to end the Subscription.
  on(UnitEvents.death, ({ unit }) => {
    print(`${unit.name} died`);
  });

  // A repeating Timer, every 60 seconds. Timer.every returns it; pause() or
  // destroy() it to stop.
  let minutes = 0;
  Timer.every(60, () => {
    minutes += 1;
    print(`${String(minutes)} min played`);
  });
});
```

Three ideas carry every Map project:

- **Dev mode.** `Reforged.configure({ devMode })` is the first statement. In a development build it turns the library's runtime Guards on; a release build turns them off and pays nothing for them. [Desync safety and guards](../guides/desync-safety-and-guards.md) lists what they catch.
- **Init stages.** Code at the top level of a module runs while the game loads the script, before the game is ready for Handles. Map code starts from the four Init stages of [`Init`](../api/reforged-ts/variables/Init.md): `onGlobals`, `onTriggers`, `onInitTriggers` and `onGameStart`. [Runtime facts](../guides/runtime-facts.md#the-entry-points) explains why.
- **Wrappers and Event descriptors.** `Unit`, `Timer` and the other Wrappers own one Handle each and expose its Natives as typed members. `on()` subscribes a handler to an Event descriptor such as `UnitEvents.death` and hands it the event's payload, already wrapped. The [API reference](../api/index.md) documents every member.

## The commands

| Command                     | What it does                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `pnpm build`                | Builds the map in dev mode, the library's runtime checks on, into `dist`.                                          |
| `pnpm build --mode release` | Builds the map in release mode, the runtime checks off: the build you ship.                                        |
| `pnpm dev`                  | Watches `src` and the map folder and rebuilds on every change.                                                     |
| `pnpm test:map`             | Builds, then launches the game on the built map folder.                                                            |
| `pnpm test`                 | Runs the tests without the game, the map's on the Lua harness ([Testing your map](../guides/testing-your-map.md)). |
| `pnpm lint`                 | Runs ESLint with the rules of `eslint-plugin-reforged` ([Lint rules](../guides/lint-rules/index.md)).              |
| `pnpm check`                | Runs lint, the type check and the tests, and stops at the first failure: the definition of done.                   |

## The project's layout

- `src/`: the map's code, `src/main.ts` first. The build compiles it with typescript-to-lua into one Lua bundle and appends it to the script the World Editor saved.
- `maps/`: the map folder. The World Editor owns it; the build copies it, adds the code and packs the archive into `dist/`.
- `reforged.config.ts`: the build's configuration (the map folder, the output folder, the mode). It is committed, so it holds only what every machine shares.
- `tests/lua/` and `tests/stubs/`: the map's tests on the Lua harness and the Native stubs they need.
- `AGENTS.md` and `CONTEXT.md`: the instructions and the glossary a coding agent reads. They are Seeds: yours after generation. Add your map's own terms to `CONTEXT.md`.

## Next

- [Handles and Wrappers](../guides/handles-and-wrappers.md): the first of the concept guides, one page per idea of the library, in the order they build on each other.
- [Runtime facts](../guides/runtime-facts.md): what the game's Lua has and lacks, measured in the game.
- [Desync safety and guards](../guides/desync-safety-and-guards.md): the pitfalls the type layer, the lint and Dev mode catch.
- [Testing your map](../guides/testing-your-map.md): running map logic on the Lua harness without the game.
- [Typings](../guides/typings.md): the declarations of the Natives, per Patch.
