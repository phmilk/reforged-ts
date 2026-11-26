---
status: accepted
date: 2026-11-26
---

# The harness simulates only on the test's order

The Shipped stubs never fired anything on their own: a test found the Trigger it wanted, by scanning the registrations, and fired it with `__stub_fire_trigger` and a Firing context it built, or fired one timer with `__stub_fire_timer`. A map's code says `on(UnitEvents.death, …)` and never names a Trigger, so the test spoke the harness's language, not the game's: which Triggers an event reaches, the player-unit registration of each slot, the unit one, a disabled one, the filter, was the test's to know and to get wrong.

The harness simulates what the game would do, and only on the test's order. Nothing happens on its own: no timer expires while the test is not looking, no event fires because a state changed. When the test orders something, the harness does what the game would do for it, whole:

- **The Event dispatch.** One event, fired with `game.fire(event, context)` or by a Game action, reaches every Trigger registered for it, as the game would: in registration order, a disabled or destroyed Trigger skipped, the registration's filter evaluated, each Trigger's condition before its action and both before the next Trigger. `game.fire` derives the subject from the Firing context by the event's family (the owner of `GetTriggerUnit` for a `playerunitevent`, `GetTriggerUnit` for a `unitevent`, `GetTriggerPlayer` for a `playerevent`, none for a `gameevent`) and writes no state.
- **The Dispatching Natives.** A Native the map calls fires its event inside the call where a Probe showed that the game fires it synchronously (`UnitDamageTarget`, `KillUnit`), and fires nothing where the game fires nothing.
- **The Game clock.** Game time is the Test game's own and starts at 0; only `game.advanceTime(seconds)` moves it, firing the timers and the timer events that expire inside the window, in the order of their instants.

## Considered options

- Manual firing only, as the harness had it: the test picks each Trigger and fires it, and fires each timer one at a time after finding it. It keeps the stubs small, and it is what the library's own tests still use, through `__stub_fire_trigger` and `__stub_fire_timer`, which stay. For a Map project it is the problem itself: the test must know how the library registers an event, so it breaks when the library changes how, it fires a Trigger the game would not fire (a disabled one, a filter that refuses, another player's), and it never fires the second Trigger the map registered for the same event.

## Consequences

- A test of a Map project names no Trigger and no `__stub_*` helper: it says what happens (`game.kill`, `game.fire`, `game.advanceTime`) and checks what the player observes.
- An event no Game action and no Dispatching Native covers goes through `game.fire`; a new Game action enters when a Map project needs it, with the Probe of its order.
- The triggers stub remembers every registration that names its event, with its subject and its filter, so that the dispatch finds the Triggers; firing one Trigger the test holds, `__stub_fire_trigger`, is unchanged.
- A Native named by a Firing context answers its value during the dispatch, one without a Stub included, and nil outside it.
- What no Probe has measured is not simulated: no death from a lethal `UnitDamageTarget`, no wait, no game rule with a duration. A stub schedules nothing by itself, and an event happens only on the test's order or inside a Dispatching Native.

Decision record: https://github.com/phmilk/reforged-ts/issues/970
