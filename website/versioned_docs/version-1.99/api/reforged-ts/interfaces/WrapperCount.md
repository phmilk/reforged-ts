# Interface: WrapperCount

Defined in: [reforged/leaks.ts:22](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/reforged/leaks.ts#L22)

One Wrapper class as `Reforged.debug.report()` returns it.

## Properties

### className

> `readonly` **className**: `string`

Defined in: [reforged/leaks.ts:24](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/reforged/leaks.ts#L24)

The Wrapper's class name: `Timer`.

***

### created

> `readonly` **created**: `number`

Defined in: [reforged/leaks.ts:26](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/reforged/leaks.ts#L26)

How many the library created in Dev mode since the last reset.

***

### destroyed

> `readonly` **destroyed**: `number`

Defined in: [reforged/leaks.ts:28](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/reforged/leaks.ts#L28)

How many of those the library destroyed in Dev mode since then.

***

### live

> `readonly` **live**: `number`

Defined in: [reforged/leaks.ts:30](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/reforged/leaks.ts#L30)

`created - destroyed`: how many the library believes still live.
