# Interface: CallbackFailure

Defined in: [reforged/protect.ts:29](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/reforged/protect.ts#L29)

One failing callback and message, as `Reforged.debug.report()` returns it.

## Properties

### count

> `readonly` **count**: `number`

Defined in: [reforged/protect.ts:35](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/reforged/protect.ts#L35)

How many times it failed, the reported first time included.

***

### message

> `readonly` **message**: `string`

Defined in: [reforged/protect.ts:33](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/reforged/protect.ts#L33)

The Lua error text, as pcall returned it.

***

### origin

> `readonly` **origin**: `string`

Defined in: [reforged/protect.ts:31](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/reforged/protect.ts#L31)

Where the callback was registered: `Timer#1048577 Timer.start`.
