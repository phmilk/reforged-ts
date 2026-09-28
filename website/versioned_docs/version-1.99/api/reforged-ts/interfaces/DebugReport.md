# Interface: DebugReport

Defined in: [reforged/index.ts:56](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/reforged/index.ts#L56)

What `Reforged.debug.report()` returns.

## Properties

### failures

> `readonly` **failures**: readonly [`CallbackFailure`](CallbackFailure.md)[]

Defined in: [reforged/index.ts:74](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/reforged/index.ts#L74)

Each callback that failed under the protection of Dev mode, once per
distinct message, in the order they first failed, with how many times
it failed. Empty with Dev mode off.

***

### wrappers

> `readonly` **wrappers**: readonly [`WrapperCount`](WrapperCount.md)[]

Defined in: [reforged/index.ts:68](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/reforged/index.ts#L68)

The Wrappers the library created and destroyed in Dev mode, one row per
class with the live difference, sorted by live descending: a leak shows
as a live count that keeps growing between reports. A heuristic: it
counts only the creations and destructions the library saw, so a unit
that decayed or an effect the game removed stays live here, and a
lookup (`fromHandle`, `fromEvent`) is never counted. Exact for the
classes only the library creates and destroys (`Point`, `Group`,
`Force`, `Timer`, `Trigger`, `Effect`, `Frame`). Empty with Dev mode
off.
