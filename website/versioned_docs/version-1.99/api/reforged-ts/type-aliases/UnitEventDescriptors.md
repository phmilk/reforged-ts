# Type Alias: UnitEventDescriptors\<T\>

> **UnitEventDescriptors**\<`T`\> = `{ readonly [K in keyof T]: EventDescriptor<PayloadOf<T[K]>> }` & `` { readonly [K in keyof T as T[K] extends { twin: unitevent } ? `${K & string}Of` : never]: (unit: Unit) => EventDescriptor<PayloadOf<T[K]>> } ``

Defined in: [events/unit/rows.ts:66](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/events/unit/rows.ts#L66)

The descriptors a table gives: `name` per row, registered for every
player's units, and `nameOf(unit)` per row with a twin, registered on one
Unit. It is the type of `UnitEvents`.

## Type Parameters

### T

`T`

The table: one row per `name`.
