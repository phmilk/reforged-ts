# Type Alias: UnitEventDescriptors\<T\>

> **UnitEventDescriptors**\<`T`\> = `{ readonly [K in keyof T]: T[K] extends UnitEventTwin<infer R> ? (unit: Unit) => EventDescriptor<PayloadOf<T[R & keyof T]>> : EventDescriptor<PayloadOf<T[K]>> }`

Defined in: [events/unit/rows.ts:78](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/unit/rows.ts#L78)

The descriptors a table gives: `name` per row, registered for every
player's units, and `nameOf(unit)` per twin, registered on one Unit. It is
the type of `UnitEvents`, and each member keeps its entry's doc comment.

## Type Parameters

### T

`T`

The table: one entry per member.
