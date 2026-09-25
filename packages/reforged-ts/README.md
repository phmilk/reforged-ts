# reforged-ts

TypeScript Wrappers and Systems over the Lua API of Warcraft III Reforged, for custom maps compiled to Lua with [typescript-to-lua](https://typescripttolua.github.io/). A Wrapper owns one Handle and exposes its Natives as typed members (`Unit`, `Timer`, `Frame`); a System is a utility that wraps no Handle (`sync`, `host`, `file`, `base64`).

A fork of [cipherxof/w3ts](https://github.com/cipherxof/w3ts) targeting Warcraft III 3.0.0 and later. The [w3ts documentation](https://cipherxof.github.io/w3ts/) describes the upstream API this fork started from.

**Supported Patch: 3.0.0.24268** (Game version 3.0.0). The `reforged.patch` field of `package.json` carries the same Build.

<!-- Placeholder link: the docs site (#40) replaces it with the llms.txt of this version. -->

**For AI agents:** the documentation of this version, as one plain-text file for a language model, is [llms.txt](https://phmilk.github.io/reforged-ts/llms.txt).

## Status

Alpha. The 1.0.0 line is under construction: expect API changes until the migration steps to the 3.0.0 API land.

## Install

```sh
npm install reforged-ts reforged-types
```

or `pnpm add reforged-ts reforged-types`. `reforged-types` is a peer dependency: it holds the Typings of the game's Natives. `reforged-test` is an optional peer dependency, for a Map project that runs its tests on Lua outside the game. Each peer range is a caret on the version the library was released with, so your package manager warns when a major does not match.

Add the typescript-to-lua language extensions and the Typings of your Game version to `types` in the Map project's `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["@typescript-to-lua/language-extensions", "reforged-types/3.0.0"]
  }
}
```

The package ships the compiled Lua and its declarations under `dist`. typescript-to-lua resolves it by `main`, like any typescript-to-lua library.

## Events

Two surfaces over one `Trigger`. The `Trigger` Wrapper is one to one with the Natives whose first parameter is a trigger: its registrations take Wrappers and return the Trigger, so a Trigger is one chained expression. `on(descriptor, handler, when?)` subscribes a handler to an Event descriptor: it creates one Trigger, runs `when`, if given, as the trigger's condition, hands the handler the event's typed payload and returns the Subscription the caller ends with `destroy()`.

```ts
import { on, UnitEvents } from "reforged-ts";

const subscription = on(UnitEvents.death, ({ unit, killer }) => {
  // killer is undefined for a unit that died without one
});
subscription.destroy();
```

The first release ships `UnitEvents` (death, attack, damage, spells, orders, items and equipment, training, construction, research and upgrades finished, hero levels and skills, ownership, summons, selection and transport, each with an `Of(unit)` twin for one Unit where the Patch has a unit event), `PlayerEvents` (chat, leave, keys, mouse, sync data, alliance changes, victory and defeat), `TimerEvents`, `DialogEvents`, `FrameEvents`, `RegionEvents` and `TrackableEvents`. Every response Native a descriptor reads for a Wrapper is also a lookup on that Wrapper (`Unit.fromKilling()`, `Item.fromEquipped()`), `undefined` when the game has nothing.

### Which events are descriptors

Every game event is reachable through `Trigger`. An event also ships as a descriptor when it is among the events Map projects register most, when its payload needs more than one Native, or when its response Natives are easy to misuse (a killer that may be missing, a spell target of several kinds). These stay Trigger-only in the first release, and each becomes one row of the descriptor table when a Map project asks for it:

- game state, player state and variable limits, and unit state limits;
- train, construct, research and upgrade starts and cancels, and the hero revive events;
- decay, hidden, detected, rescued, stack, a unit sold by a shop, and a unit acquiring a target or one in range;
- a widget's death, a unit coming in range, and the command, upgrade command and elapsed-time events;
- the tournament, game-loaded, save and other game events, and the end of a cinematic;
- the arrow keys and the generic player key event (`EVENT_PLAYER_KEY`).

## Tests

Tests are optional. [`reforged-test`](https://github.com/phmilk/reforged-ts/tree/master/packages/reforged-test), an optional peer dependency, runs tests compiled by typescript-to-lua on real Lua 5.3 with the Natives stubbed in Lua, and reports them to vitest. A Map project that does not test needs nothing from it.

## License

MIT. See [LICENSE](./LICENSE), which keeps the upstream copyright line next to the fork's.
