---
"reforged-ts": major
---

Runtime Guards in Dev mode, `MapPlayer.runLocal`, `Reforged.debug`, and four safe collections: `SyncedMap`, `SyncedSet`, `HandleMap` and `HandleSet`.

**Runtime Guards.** With `Reforged.configure({ devMode: true })`, the library catches the classic Warcraft III scripting pitfalls while the map runs. Each Guard is decided when a callback is registered or when a Wrapper is created or destroyed, never per call, and with Dev mode off none of them runs: the Natives receive the Map project's own functions (`TimerStart` gets a closure that passes the handler its Timer, without `pcall`), `runLocal` is a `GetLocalPlayer()` comparison, `destroy()` calls its Native and forgets the Wrapper, and nothing is counted. Every message starts with `reforged-ts:`.

- **Protected callbacks.** Timer handlers, trigger actions, conditions, filters, `Group.for`, `Force.for`, the `Rectangle` enumerations and `on()` handlers run under `pcall`. A failure is shown on screen for thirty seconds and printed as `reforged-ts: <origin> failed: <Lua error>`, the origin naming the Wrapper and the registering member (`Timer#<id> Timer.start`) or the Event descriptor (`UnitEvents.death`). The other callbacks still run, a failing condition or filter evaluates false, and a repeated failure is counted instead of shown again.
- **Local-only code.** `MapPlayer.runLocal(player, fn)` runs `fn` on that player's client only. In Dev mode, inside it, creating or destroying a Wrapper, `Group.for`, `Force.for` and the first `Frame.fromName` of a frame raise `reforged-ts: <action> inside MapPlayer.runLocal changes game state for one client, which desyncs the game: only visuals belong inside runLocal`.
- **Creation before the globals Init stage** raises, naming `Init.onGlobals`.
- **Use after destroy.** A destroyed Wrapper is a tombstone: any access, a second `destroy()` included, raises `reforged-ts: used after destroy: <Class>#<id>`.
- **Damage re-entrancy.** `Unit.damageTarget` raises when damage handlers nest past a limit, eight by default, set with `Reforged.configure({ damageDepthLimit })`; a single bounce passes.
- **`Reforged.debug`.** `report()` prints and returns the Wrappers created, destroyed and live per class (a heuristic: only what the library saw) and the callback failures with their counts; `reset()` zeroes both.

**Safe collections**, in both modes, with the `Map` and `Set` surface:

- `SyncedMap` and `SyncedSet` iterate in sorted key order (numbers, strings, or any key with a comparator), the same on every client, and never compile to `pairs`. In Dev mode a key of the wrong kind raises where it is inserted.
- `HandleMap` and `HandleSet` are keyed by Wrappers through their Handle: an entry disappears when its key is destroyed, is found through the Wrapper the registry upgraded (`Widget` to `Unit`), and iterates in insertion order.

**Behaviour change, in both modes** (detailed in `migration/behaviour-changes.md`, with the Dev-mode changes): `destroy()` removes the Wrapper from the Handle registry, so `fromHandle` with the Handle of a destroyed object returns a new Wrapper, not the destroyed one.

The "Desync safety and guards" guide lists every Guard with its message, what it catches, how Dev mode is switched and what the report counts.
