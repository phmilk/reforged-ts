---
title: Timers
sidebar_position: 3
description: Running code later or on a period with the Timer Wrapper, who owns each Timer, waiting inside a function with sleep, and reading game time.
---

# Timers

A `timer` Handle runs a function after a timeout, once or on a period, counted in game time: it stops when the game pauses and does not tick during the map's initialization. The [`Timer`](../api/reforged-ts/classes/Timer.md) Wrapper has three ways to start one, which differ by who owns the Timer.

| You want                                              | Call                                               | Who owns the Timer                           |
| ----------------------------------------------------- | -------------------------------------------------- | -------------------------------------------- |
| Run once, later, and never cancel                     | `Timer.after(timeout, handler)`                    | The library: destroyed after it runs         |
| Run on a period                                       | `Timer.every(interval, handler)`                   | You: `pause()` stops it, `destroy()` ends it |
| Run once but keep a way to cancel, or reuse one Timer | `Timer.create().start(timeout, periodic, handler)` | You                                          |

## Once, later

`Timer.after` creates a Timer, runs `handler` once after `timeout` seconds, and destroys the Timer when the handler returns or throws. It returns nothing, since there is nothing to own:

```ts
import { Init, Timer } from "reforged-ts";

Init.onGameStart(() => {
  Timer.after(5, () => {
    print("Five seconds into the game.");
  });
});
```

## On a period

`Timer.every` runs `handler` every `interval` seconds and returns the Timer, which the handler also receives. Keep it to stop it later:

```ts
import { Init, Timer } from "reforged-ts";

Init.onGameStart(() => {
  let wave = 0;
  Timer.every(30, (timer) => {
    wave += 1;
    print(`Wave ${String(wave)}`);
    if (wave === 10) {
      timer.destroy();
    }
  });
});
```

## A Timer you create

`Timer.create()` gives a Timer you start, pause, resume and destroy yourself. `start(timeout, periodic, handler)` runs `handler` with the Timer at each expiry, and starting it again restarts it with the new timeout. A one-shot that can be cancelled is a created Timer started with `periodic` false:

```ts
import { Timer } from "reforged-ts";

/** Starts a ten-second cooldown; returns the function that cancels it. */
export function startCooldown(onReady: () => void): () => void {
  const timer = Timer.create();
  let running = true;
  const stop = () => {
    if (running) {
      running = false;
      timer.destroy();
    }
  };
  timer.start(10, false, () => {
    stop();
    onReady();
  });
  return stop;
}
```

`elapsed`, `remaining` and `timeout` read where a Timer stands (`remaining` can be wrong after a pause and resume, a game bug its doc comment links). `Timer.fromExpired()` is the lookup of the expiring Timer, kept for parity with the Natives: a handler already receives its Timer.

A Timer counts as an event too: [`TimerEvents.expired(timer)`](../api/reforged-ts/reforged-ts/namespaces/TimerEvents/index.md) subscribes a handler to a Timer's expiry through [`on()`](events.md), next to its own handler. To show a Timer on screen, create a [`TimerDialog`](../api/reforged-ts/classes/TimerDialog.md) for it.

## Waiting in code

[`sleep(seconds)`](../api/reforged-ts/functions/sleep.md) returns a `Promise` that resolves after `seconds` of game time, on a `Timer.after`. Inside an `async` function it reads as a pause, and it works in any context, where the game's own `TriggerSleepAction` works only in a trigger action and kills the thread elsewhere:

```ts
import { Init, sleep } from "reforged-ts";

async function countdown(): Promise<void> {
  for (let seconds = 3; seconds > 0; seconds--) {
    print(String(seconds));
    await sleep(1);
  }
  print("Go!");
}

Init.onGameStart(() => {
  void countdown();
});
```

typescript-to-lua compiles `async` and `await` to coroutines. Code after an `await` runs later, from a Timer's thread: what an event gave you must be read before it ([Events](events.md#event-descriptors-and-on)).

## Game time

[`getElapsedTime()`](../api/reforged-ts/functions/getElapsedTime.md), a System, returns the seconds of game time since the `gameStart` [Init stage](init-stages.md), and `0` before it. It is kept by one periodic Timer the library starts at that stage, so it is the same on every client. Lua's `os.clock` and `os.time` are not: they read each client's own clock ([Runtime facts](runtime-facts.md#what-exists)).

## Initialization

Timers do not tick while the map initializes. A Timer started in `Init.onGlobals` or `Init.onTriggers` starts counting when the game starts; create it there, never at module top level ([Init stages](init-stages.md)).

## In Dev mode

A handler given to `start`, `after` or `every` runs under `pcall` in Dev mode. A failure is shown on screen and printed once per distinct message as `reforged-ts: Timer#1048580 Timer.every failed: <error>`; repeats are counted in `Reforged.debug.report()`, and the Timer keeps running. The mode is the one in force when the handler was given. With Dev mode off, the handler runs as the game runs any function ([Protected callbacks](desync-safety-and-guards.md#protected-callbacks-c4-a-callback-error-kills-the-thread-silently)).

`Reforged.debug.report()` counts Timers exactly, since only the library creates and destroys them: a live count that keeps growing between two reports is a Timer created and never destroyed ([Leak counters](desync-safety-and-guards.md#leak-counters-l1-handles-never-destroyed)).

## Lint rules

- [`no-unsafe-natives`](lint-rules/no-unsafe-natives.md): `TriggerSleepAction`, `PolledWait` and the BJ timer helpers (`CreateTimerBJ`, `StartTimerBJ`, `GetLastCreatedTimerBJ`), which share one global Timer; the replacements are `sleep` and the `Timer` members.
- [`no-unused-handle-result`](lint-rules/no-unused-handle-result.md): a `Timer.create()` whose result is dropped can never be destroyed. `Timer.after` owns its Timer and is not reported.
- [`no-handles-at-module-top-level`](lint-rules/no-handles-at-module-top-level.md): a Timer created when the module loads.
