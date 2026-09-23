# PROTOTYPE: API ergonomics on Unit, Timer and events

**Throwaway.** Nothing here is production code. It answers wayfinder ticket
[#13](https://github.com/phmilk/reforged-ts/issues/13): _how should the improved
API feel on unit creation and lookup, timers and callbacks, and event
subscription (including a 3.0.0 event such as equip/unequip)?_

It materialises the top proposals of the design review
([#12](https://github.com/phmilk/reforged-ts/issues/12)): a generic, class-aware
`Handle.fromHandle` without the `initHandle` trick (P2), one factory error mode
(P3), lifecycle stages (P4), typed event registration (P6).

## Run

The prototype only type-checks; it does not compile to Lua and never runs in the game.

```sh
npm install                                   # once, at the repo root
npx tsc -p prototype/api-ergonomics/tsconfig.json
```

Exit code 0 means every sketch and every usage example type-checks against the
current Typings (`war3-types-strict/1.33.0`). The two 3.0.0 natives the examples
need are stubbed in `natives-3.0.0.stub.d.ts`.

## Read in this order

| File | What it shows |
|---|---|
| `today.usage.ts` | The three surfaces written with **today's** API (`handles/*`). |
| `proposed/handle.ts` | New base: constructors only store the Handle; one generic `fromHandle`; the registry upgrades a `Widget` to a `Unit`; **creation throws, lookup returns `undefined`**. |
| `proposed/unit.ts`, `proposed/item.ts`, `proposed/player.ts` | Minimal Wrappers on the new base. |
| `proposed/timer.ts` | Handler receives the `Timer`; `Timer.after` / `Timer.every` conveniences. |
| `proposed/events.ts` | **V1** the evolved `Trigger` (typed inputs, same shape as today). **V2** event descriptors + `on()` returning a `Subscription`. |
| `proposed/lifecycle.ts` | `Init.onGlobals` / `onTriggers` / `onGameStart` under `pcall`, replacing `addScriptHook`. |
| `proposed.usage.ts` | The same three surfaces with the new API, V1 and V2 side by side. |

## What to react to

1. **Error mode.** `Unit.create(...)` throws (via `error`) when the Native returns nothing and is typed non-null; `Unit.fromHandle` / `fromEvent` / `getItemInSlot` return `undefined`. Rule in one sentence: _creation throws, lookup returns undefined._ Alternative kept in comments: everything `| undefined`.
2. **Registry upgrade.** `Widget.fromEvent()` then `Unit.fromHandle(sameHandle)` returns a real `Unit` and replaces the cached `Widget`. Alternative: throw on class mismatch.
3. **Timer handler.** `timer.start(1, true, (t) => ...)` passes the `Timer`; `Timer.fromExpired()` stays for parity. `Timer.after(0.5, cb)` destroys itself; `Timer.every(1, cb)` returns the `Timer` you own.
4. **Events: V1 or V2 or both.** V1 keeps the `Trigger` shape (1:1, tutorial-friendly). V2 adds `on(UnitEvents.death, ({ unit, killer }) => ...)`: typed payload, one `Trigger` per subscription, `subscription.destroy()`. Both can coexist (V2 is built on V1).
5. **Subscription ownership.** One `Trigger` per `on()` call (simple, explicit, destroyable). Alternative not sketched: one shared `Trigger` per event descriptor with an internal handler list (fewer Handles, harder to reason about ordering).
6. **Lifecycle.** `Init.onGlobals`, `Init.onTriggers`, `Init.onGameStart` (names after Blizzard's stages) under `pcall`, `addScriptHook` kept as a deprecated alias.
7. **Names.** `MapPlayer`, `Point`, `Rectangle` stay (design review P10).
