# Class: Timer

Defined in: [handles/timer.ts:18](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/timer.ts#L18)

A timer: a countdown in game seconds that runs a handler when it expires,
once or periodically.

## Remarks

- Game time follows the game speed, and stands still while the game is
  paused.
- `Timer.after` and `Timer.every` cover the common cases; `create` then
  `start` gives a Timer that can be paused, resumed and started again.

## Example

**A countdown and a delayed call**

```ts
// A ten-second countdown printed each second: the Timer returned by every
// is the caller's to destroy. Then a one-off call, whose Timer destroys
// itself.
import { Init, Timer } from "reforged-ts";

Init.onGameStart(() => {
  let left = 10;
  Timer.every(1, (timer) => {
    left -= 1;
    print(`${String(left)} seconds left`);
    if (left === 0) {
      timer.destroy();
    }
  });

  Timer.after(10.5, () => {
    print("Go!");
  });
});
```

## Native

[timer](/typings/3.0.0/interfaces/timer) ([jassbot](https://lep.duckdns.org/jassbot/doc/timer))

## Extends

- [`Handle`](Handle.md)\<`timer`\>

## Properties

### handle

> `readonly` **handle**: `timer`

Defined in: [handles/handle.ts:132](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/handle.ts#L132)

The Handle this Wrapper owns, to pass to a Native the library does not
wrap.

#### Remarks

Do not keep it after `destroy()`: the game frees the object behind it.

#### Inherited from

[`Handle`](Handle.md).[`handle`](Handle.md#handle)

## Accessors

### elapsed

#### Get Signature

> **get** **elapsed**(): `number`

Defined in: [handles/timer.ts:37](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/timer.ts#L37)

Gets the time since the timer last started.

##### Native

[TimerGetElapsed](/typings/3.0.0/functions/TimerGetElapsed) ([jassbot](https://lep.duckdns.org/jassbot/doc/TimerGetElapsed))

##### Bug

After `resume`, it counts only the time since the resume.

##### Returns

`number`

The elapsed time, in seconds.

***

### id

#### Get Signature

> **get** **id**(): `number`

Defined in: [handles/handle.ts:148](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/handle.ts#L148)

Gets the game's numeric id of the Handle.

##### Remarks

Ids are not recycled immediately when the object is destroyed (a new
Handle created right after gets the next id), and they are allocated
deterministically from map start. An id is never data: key a collection
on the Handle (or use `HandleMap` and `HandleSet`), never on its id.

##### Native

[GetHandleId](/typings/3.0.0/functions/GetHandleId) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetHandleId))

##### Returns

`number`

The id, unique among the live Handles.

#### Inherited from

[`Handle`](Handle.md).[`id`](Handle.md#id)

***

### remaining

#### Get Signature

> **get** **remaining**(): `number`

Defined in: [handles/timer.ts:48](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/timer.ts#L48)

Gets the time left before the timer expires.

##### Native

[TimerGetRemaining](/typings/3.0.0/functions/TimerGetRemaining) ([jassbot](https://lep.duckdns.org/jassbot/doc/TimerGetRemaining))

##### Bug

The value can be wrong for a timer that was paused and later
resumed: http://www.wc3c.net/showthread.php?t=95756.

##### Returns

`number`

The remaining time, in seconds.

***

### timeout

#### Get Signature

> **get** **timeout**(): `number`

Defined in: [handles/timer.ts:57](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/timer.ts#L57)

Gets the timeout the timer was last started with.

##### Native

[TimerGetTimeout](/typings/3.0.0/functions/TimerGetTimeout) ([jassbot](https://lep.duckdns.org/jassbot/doc/TimerGetTimeout))

##### Returns

`number`

The timeout, in seconds.

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [handles/timer.ts:70](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/timer.ts#L70)

Destroys the Timer through its Native.

#### Returns

`void`

#### Remarks

In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
a second `destroy()` included, raises
`reforged-ts: used after destroy: <Class>#<id>`, and
`Reforged.debug.report()` counts it destroyed.

#### Native

[DestroyTimer](/typings/3.0.0/functions/DestroyTimer) ([jassbot](https://lep.duckdns.org/jassbot/doc/DestroyTimer))

***

### pause()

> **pause**(): `Timer`

Defined in: [handles/timer.ts:83](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/timer.ts#L83)

Stops the countdown where it is; `resume` continues it.

#### Returns

`Timer`

This Timer, for chaining.

#### Native

[PauseTimer](/typings/3.0.0/functions/PauseTimer) ([jassbot](https://lep.duckdns.org/jassbot/doc/PauseTimer))

#### Bug

The game clears the periodic flag: a periodic Timer paused then
resumed runs its remaining time and one more timeout, then stops. Start it
again with `start` to keep it periodic.

***

### resume()

> **resume**(): `Timer`

Defined in: [handles/timer.ts:94](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/timer.ts#L94)

Continues a paused countdown from where `pause` stopped it; a running
Timer is left as it is.

#### Returns

`Timer`

This Timer, for chaining.

#### Native

[ResumeTimer](/typings/3.0.0/functions/ResumeTimer) ([jassbot](https://lep.duckdns.org/jassbot/doc/ResumeTimer))

***

### start()

> **start**(`timeout`, `periodic`, `handler`): `Timer`

Defined in: [handles/timer.ts:115](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/timer.ts#L115)

Starts the Timer; each expiry runs `handler` with this Timer.

#### Parameters

##### timeout

`number`

The time to each expiry, in seconds.

##### periodic

`boolean`

Whether the Timer starts again after each expiry;
`false` runs the handler once.

##### handler

(`timer`) => `void`

The function run at each expiry, given this Timer.

#### Returns

`Timer`

This Timer, for chaining.

#### Remarks

In Dev mode the handler runs under `pcall`: a failure is shown on
screen and printed as
`reforged-ts: Timer#<id> Timer.start failed: <error>`, once per distinct
message (repeats are counted in `Reforged.debug.report()`), and the game
thread survives it. The mode is the one in force when `start` is called.
With Dev mode off the handler runs unprotected, as the game runs any
function.

#### Native

[TimerStart](/typings/3.0.0/functions/TimerStart) ([jassbot](https://lep.duckdns.org/jassbot/doc/TimerStart))

***

### after()

> `static` **after**(`timeout`, `handler`): `void`

Defined in: [handles/timer.ts:139](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/timer.ts#L139)

Runs `handler` once after `timeout` seconds, on a Timer created for it and
destroyed after the handler returns or throws (the error still
propagates). Nothing is owned, so nothing is returned: a one-shot that can
be cancelled is `Timer.create().start(timeout, false, handler)`.

#### Parameters

##### timeout

`number`

The delay, in seconds.

##### handler

() => `void`

The function to run once the delay is over.

#### Returns

`void`

#### Remarks

In Dev mode the handler is protected as `start`'s is, and its
failure is reported as `Timer#<id> Timer.after`; the Timer is destroyed
first.

#### Throws

In Dev mode, when called before the globals Init stage or inside
`MapPlayer.runLocal`, as `create` does.

#### Native

[CreateTimer](/typings/3.0.0/functions/CreateTimer) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateTimer))

#### Native

[TimerStart](/typings/3.0.0/functions/TimerStart) ([jassbot](https://lep.duckdns.org/jassbot/doc/TimerStart))

#### Native

[DestroyTimer](/typings/3.0.0/functions/DestroyTimer) ([jassbot](https://lep.duckdns.org/jassbot/doc/DestroyTimer))

***

### create()

> `static` **create**(): `Timer`

Defined in: [handles/timer.ts:27](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/timer.ts#L27)

Creates a stopped timer; `start` sets it running.

#### Returns

`Timer`

The new timer.

#### Throws

In Dev mode, when called before the globals Init stage or inside
`MapPlayer.runLocal`. The game always returns a timer, so the creation
message `reforged-ts: failed to create Timer` is not expected.

#### Native

[CreateTimer](/typings/3.0.0/functions/CreateTimer) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateTimer))

***

### every()

> `static` **every**(`interval`, `handler`): `Timer`

Defined in: [handles/timer.ts:164](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/timer.ts#L164)

Runs `handler` every `interval` seconds with the Timer, which the caller
owns: `pause` stops it, `destroy` ends it.

#### Parameters

##### interval

`number`

The time between two runs, in seconds.

##### handler

(`timer`) => `void`

The function run at each expiry, given the Timer.

#### Returns

`Timer`

The running Timer.

#### Remarks

In Dev mode the handler is protected as `start`'s is, and its
failure is reported as `Timer#<id> Timer.every`: a handler failing on
every tick is reported once and counted after that.

#### Throws

In Dev mode, when called before the globals Init stage or inside
`MapPlayer.runLocal`, as `create` does.

#### Native

[CreateTimer](/typings/3.0.0/functions/CreateTimer) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateTimer))

#### Native

[TimerStart](/typings/3.0.0/functions/TimerStart) ([jassbot](https://lep.duckdns.org/jassbot/doc/TimerStart))

***

### fromExpired()

> `static` **fromExpired**(): `Timer` \| `undefined`

Defined in: [handles/timer.ts:200](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/timer.ts#L200)

Gets the Timer whose expiry is running.

#### Returns

`Timer` \| `undefined`

The expired Timer, or `undefined` outside a Timer's expiry.

#### Remarks

A handler receives its Timer; this lookup stays for parity with the
Natives.

#### Native

[GetExpiredTimer](/typings/3.0.0/functions/GetExpiredTimer) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetExpiredTimer))

***

### fromHandle()

> `static` **fromHandle**\<`C`\>(`this`, `handle`): `C` \| `undefined`

Defined in: [handles/handle.ts:195](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/handle.ts#L195)

Gets the Wrapper for `handle`, making it on first use. The same Handle
always gives the same object; when the object cached for it is of a less
specific class than the one asked for (a `Timer` cached,
`MyTimer.fromHandle` asked), a new object of the class asked for replaces
it. `Unit.fromHandle(h)` is typed `Unit | undefined`.

#### Type Parameters

##### C

`C` *extends* [`Handle`](Handle.md)\<`handle`\>

The Wrapper of the class it is called on.

#### Parameters

##### this

[`WrapperClass`](../type-aliases/WrapperClass.md)\<`C`\>

##### handle

`C`\[`"handle"`\] \| `undefined`

A Handle of the class's Native type.

#### Returns

`C` \| `undefined`

The Wrapper, or `undefined` when `handle` is undefined.

#### Remarks

It creates no Handle, so none of the creation Guards of Dev mode apply:
wrap a Handle that Native code outside the library returned.

#### Inherited from

[`Handle`](Handle.md).[`fromHandle`](Handle.md#fromhandle)
