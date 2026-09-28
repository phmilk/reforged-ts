# Interface: ReforgedEntry

Defined in: [reforged/index.ts:109](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/reforged/index.ts#L109)

The type of `Reforged`: the configuration call, its read, and `debug`.

## Properties

### debug

> `readonly` **debug**: [`ReforgedDebug`](ReforgedDebug.md)

Defined in: [reforged/index.ts:135](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/reforged/index.ts#L135)

What Dev mode counted: the Wrappers created and destroyed per class, and
the callback failures it suppressed.

***

### devMode

> `readonly` **devMode**: `boolean`

Defined in: [reforged/index.ts:130](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/reforged/index.ts#L130)

Whether the library is in Dev mode: false until `configure` sets it.

## Methods

### configure()

> **configure**(`options`): `void`

Defined in: [reforged/index.ts:128](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/reforged/index.ts#L128)

Records the configuration: Dev mode, and the damage depth limit it
enforces.

#### Parameters

##### options

[`ReforgedOptions`](ReforgedOptions.md)

The configuration. An absent `devMode` means off:
`configure({})` after `configure({ devMode: true })` turns Dev mode off.
An absent `damageDepthLimit` keeps the current limit (eight until set);
it is read when damage is dealt, so a new one applies at once.

#### Returns

`void`

#### Remarks

Call it once, first thing in the entry point. In Dev mode (on before the
call or after it), a call after the Map project registered a callback
(through `Init`, `addScriptHook` or a member that hands a function to a
Native, such as `Timer.start`; the library's own registrations do not
count) prints a warning naming the first registration, and records the
values anyway:
`reforged-ts: Reforged.configure({ devMode: <value> }) called after a callback was registered (the first: <registration>): call it first in the entry point; a callback keeps the mode it was registered under`.
A changed `devMode` affects only later registrations: a callback keeps
the mode it was registered under.
