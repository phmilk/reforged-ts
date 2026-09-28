# Interface: ReforgedDebug

Defined in: [reforged/index.ts:82](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/reforged/index.ts#L82)

The type of `Reforged.debug`: what Dev mode counted, and a way to start
counting afresh. Every member prints that Dev mode is off, and returns
an empty result, when it is.

## Methods

### report()

> **report**(): [`DebugReport`](DebugReport.md)

Defined in: [reforged/index.ts:98](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/reforged/index.ts#L98)

Prints what Dev mode counted, one line per row after a header, and
returns it.

#### Returns

[`DebugReport`](DebugReport.md)

The Wrapper rows and the failures; both empty with Dev mode
off, when it prints only that Dev mode is off.

#### Remarks

The Wrappers created, destroyed and live per class come first, most live
first, then the callbacks that failed and how many times each failed
with the same message. A repeated failure is reported on screen once,
then only counted here. The Wrapper counts are a heuristic, and the
report says so in a line of its own: only the creations and
destructions the library saw.

#### Example

```ts
// Dev mode on, then the report after a while: a Timer that fails every tick
// is reported on screen once and counted, and each Wrapper class the library
// created shows its live count.
import { Init, Reforged, Timer } from "reforged-ts";

Reforged.configure({ devMode: true });

Init.onGameStart(() => {
  Timer.every(1, () => {
    error("tick failed");
  });

  Timer.after(10, () => {
    const { failures, wrappers } = Reforged.debug.report();
    // failures: one row, "Timer#<id> Timer.every", its count one per tick
    // so far. wrappers: among others a "Timer" row, created 2, destroyed 0,
    // live 2 while this handler runs (its one-shot Timer is destroyed after).
    print(`${String(failures.length)} failing callback(s)`);
    print(`${String(wrappers.length)} class(es) counted`);
  });
});
```

***

### reset()

> **reset**(): `void`

Defined in: [reforged/index.ts:105](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/reforged/index.ts#L105)

Zeroes the counts: every Wrapper row goes back to zero (a Wrapper
created before the reset is not counted destroyed after it), the
failures are forgotten, and the next failure of each callback is
reported on screen again.

#### Returns

`void`
