# Interface: EventDescriptor\<P\>

Defined in: [events/descriptor.ts:31](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/events/descriptor.ts#L31)

An Event descriptor: how one game event registers on a Trigger and how its
payload is read from the trigger context. Its functions take no `self`.

## Remarks

The library's descriptors live in the events namespaces (`UnitEvents`,
`PlayerEvents` and the others) and are passed to `on()`. Every payload
field is set unless the descriptor's comment says it can be `undefined`:
a guaranteed field the game leaves empty raises
`reforged-ts: missing <field> in the <descriptor> payload`, a library or
engine bug rather than the Map project's mistake.

## Type Parameters

### P

`P`

The payload the handler receives.

## Properties

### damage?

> `readonly` `optional` **damage?**: `true`

Defined in: [events/descriptor.ts:43](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/events/descriptor.ts#L43)

Set on the events that run inside a damage context.

***

### name?

> `readonly` `optional` **name?**: `string`

Defined in: [events/descriptor.ts:37](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/events/descriptor.ts#L37)

The descriptor's name (`UnitEvents.death`), which a Dev-mode report of
a failing handler or `when` names. The library's descriptors all carry
one; a descriptor without one is reported as `on`.

***

### read

> `readonly` **read**: () => `P`

Defined in: [events/descriptor.ts:41](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/events/descriptor.ts#L41)

Reads the payload from the running trigger context.

#### Returns

`P`

***

### register

> `readonly` **register**: (`trigger`) => `void`

Defined in: [events/descriptor.ts:39](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/events/descriptor.ts#L39)

Registers the event on `trigger`.

#### Parameters

##### trigger

[`Trigger`](../classes/Trigger.md)

#### Returns

`void`
