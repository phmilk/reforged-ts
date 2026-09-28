# Interface: EventRow\<A, P\>

Defined in: [events/rows.ts:24](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/events/rows.ts#L24)

One row of an events namespace (`PlayerEvents`, `DialogEvents` and the
others): how its event registers and how its payload is read. Its
functions take no `self`, as the arrows of a row written under
`@noSelfInFile` do.

## Type Parameters

### A

`A` *extends* readonly `unknown`[]

The arguments the member takes, after the Trigger.

### P

`P`

The payload the event gives.

## Properties

### fixed?

> `readonly` `optional` **fixed?**: `true`

Defined in: [events/rows.ts:33](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/events/rows.ts#L33)

Set when the member is the descriptor, registered with no arguments.

***

### read

> `readonly` **read**: (`event`) => `P`

Defined in: [events/rows.ts:31](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/events/rows.ts#L31)

Reads the payload from the trigger context. `event` names the descriptor
(`PlayerEvents.chat`) for `required`.

#### Parameters

##### event

`string`

#### Returns

`P`

***

### register

> `readonly` **register**: (`trigger`, ...`args`) => `void`

Defined in: [events/rows.ts:26](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/events/rows.ts#L26)

Registers the event on `trigger` for the member's arguments `args`.

#### Parameters

##### trigger

[`Trigger`](../classes/Trigger.md)

##### args

...`A`

#### Returns

`void`
