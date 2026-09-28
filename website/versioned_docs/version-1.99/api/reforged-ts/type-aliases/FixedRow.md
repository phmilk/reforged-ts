# Type Alias: FixedRow\<P\>

> **FixedRow**\<`P`\> = [`EventRow`](../interfaces/EventRow.md)\<\[\], `P`\> & `object`

Defined in: [events/rows.ts:41](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/events/rows.ts#L41)

A row whose member is the descriptor itself, registered with no arguments
(`PlayerEvents.leave`).

## Type Declaration

### fixed

> `readonly` **fixed**: `true`

Set: the member is the descriptor.

## Type Parameters

### P

`P`

The payload the event gives.
