# Type Alias: WrapperClass\<C\>

> **WrapperClass**\<`C`\> = `object` & `0` *extends* `1` & `C`\[`"handle"`\] ? `object` : `unknown`

Defined in: [handles/handle.ts:62](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/handle.ts#L62)

A Wrapper class as its static members see it: the type of `this` inside a
static member such as `fromHandle`.

## Type Declaration

### name

> `readonly` **name**: `string`

The class's name, which a creation error names.

### prototype

> `readonly` **prototype**: `C`

The class's prototype: its instances are the Wrappers it returns.

## Type Parameters

### C

`C` *extends* [`Handle`](../classes/Handle.md)\<`handle`\>

The Wrapper the class creates.

## Remarks

The abstract base itself is not one: `typeof Handle` has a `Handle<any>`
prototype, and `0 extends 1 & H` holds only when `H` is `any`, so
`Handle.fromHandle(h)` asks for a property `typeof Handle` lacks and does
not compile. The library exports the type because `fromHandle`'s
signature names it; Map project code has no need to write it.
