# Interface: InitStages

Defined in: [init/index.ts:28](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/init/index.ts#L28)

The type of [Init](../variables/Init.md): the four registrars and the two reads.

## Remarks

Every callback runs under pcall, after the library's own callbacks for the
stage, in registration order. A failure prints one line naming the stage
and the callback, such as
`reforged-ts: globals callback "spawn" failed: <message>`, and the next
callback still runs. A callback registered after its stage ran runs at
once.

## Properties

### current

> `readonly` **current**: [`InitStage`](../type-aliases/InitStage.md) \| `undefined`

Defined in: [init/index.ts:74](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/init/index.ts#L74)

The stage whose run is in progress, or undefined between stages and
once all ran. A callback registered after its stage ran runs at once,
and that immediate run does not change it.

## Methods

### hasRun()

> **hasRun**(`stage`): `boolean`

Defined in: [init/index.ts:68](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/init/index.ts#L68)

Tells whether `stage` ran.

#### Parameters

##### stage

[`InitStage`](../type-aliases/InitStage.md)

The stage to ask about.

#### Returns

`boolean`

True once its Blizzard function returned and its callbacks
began: already true inside one of the stage's own callbacks, where
`current` names the stage.

***

### onGameStart()

> **onGameStart**(`callback`, `label?`): `void`

Defined in: [init/index.ts:60](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/init/index.ts#L60)

Registers `callback` for the `gameStart` stage, after `MarkGameStarted`:
the game has started, and Timers tick.

#### Parameters

##### callback

() => `void`

The function the stage runs once, under pcall.

##### label?

`string`

Its name in a failure line; its ordinal in the stage,
`#n`, when left out.

#### Returns

`void`

***

### onGlobals()

> **onGlobals**(`callback`, `label?`): `void`

Defined in: [init/index.ts:36](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/init/index.ts#L36)

Registers `callback` for the `globals` stage, right after `InitGlobals`:
the first moment to create Handles, with `Players` filled.

#### Parameters

##### callback

() => `void`

The function the stage runs once, under pcall.

##### label?

`string`

Its name in a failure line; its ordinal in the stage,
`#n`, when left out.

#### Returns

`void`

***

### onInitTriggers()

> **onInitTriggers**(`callback`, `label?`): `void`

Defined in: [init/index.ts:52](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/init/index.ts#L52)

Registers `callback` for the `initTriggers` stage, after
`RunInitializationTriggers`: the end of `main`.

#### Parameters

##### callback

() => `void`

The function the stage runs once, under pcall.

##### label?

`string`

Its name in a failure line; its ordinal in the stage,
`#n`, when left out.

#### Returns

`void`

***

### onTriggers()

> **onTriggers**(`callback`, `label?`): `void`

Defined in: [init/index.ts:44](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/init/index.ts#L44)

Registers `callback` for the `triggers` stage, after
`InitCustomTriggers` created the editor's triggers.

#### Parameters

##### callback

() => `void`

The function the stage runs once, under pcall.

##### label?

`string`

Its name in a failure line; its ordinal in the stage,
`#n`, when left out.

#### Returns

`void`
