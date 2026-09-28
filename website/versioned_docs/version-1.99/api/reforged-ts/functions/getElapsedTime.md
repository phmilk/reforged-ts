# Function: getElapsedTime()

> **getElapsedTime**(): `number`

Defined in: [system/gametime.ts:19](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/gametime.ts#L19)

Gets the game time since the game started, from a periodic Timer the
library starts at the `gameStart` stage.

## Returns

`number`

The elapsed game time, in seconds; 0 before the `gameStart`
stage.

## Remarks

The Timer is created after `MarkGameStarted`, where w3ts created it at
the end of `main`. Timers do not tick during initialization, so the value
is the same on a running game.
