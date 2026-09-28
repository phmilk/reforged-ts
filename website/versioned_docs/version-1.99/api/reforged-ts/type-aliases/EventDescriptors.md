# Type Alias: EventDescriptors\<T\>

> **EventDescriptors**\<`T`\> = `{ readonly [K in keyof T]: T[K] extends EventRow<infer A, infer P> ? T[K] extends { fixed: true } ? EventDescriptor<P> : (args: A) => EventDescriptor<P> : never }`

Defined in: [events/rows.ts:52](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/events/rows.ts#L52)

The members a table gives: the descriptor for a fixed row, a function of
the row's arguments for any other. It is the type of each events
namespace but `UnitEvents`, and each member keeps its row's doc comment.

## Type Parameters

### T

`T`

The table: one row per member.
