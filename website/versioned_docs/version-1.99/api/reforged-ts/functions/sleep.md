# Function: sleep()

> **sleep**(`seconds`): `Promise`\<`void`\>

Defined in: [utils/index.ts:16](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/utils/index.ts#L16)

Waits for `seconds` of game time, on a one-shot Timer
([Timer.after](../classes/Timer.md#after)): `await sleep(2)` inside an `async` function.

## Parameters

### seconds

`number`

The game time to wait, in seconds.

## Returns

`Promise`\<`void`\>

A `Promise` that resolves once the time has passed.

## Remarks

Resolves with no value: it is typed `Promise<void>`, where w3ts typed it
`Promise<null>`; the value at run time is nil either way.
