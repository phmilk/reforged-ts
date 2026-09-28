# ~~Enumeration: W3TS\_HOOK~~

Defined in: [hooks/index.ts:23](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/hooks/index.ts#L23)

The entry points of [addScriptHook](../functions/addScriptHook.md), by their w3ts names.

## Deprecated

Register for an Init stage instead:
[Init.onGlobals](../interfaces/InitStages.md#onglobals) for `MAIN_BEFORE` and
[Init.onInitTriggers](../interfaces/InitStages.md#oninittriggers) for `MAIN_AFTER`.
`CONFIG_BEFORE` and `CONFIG_AFTER` have no stage in 1.x: code that needs
the lobby's timing stays on [addScriptHook](../functions/addScriptHook.md). Removed in 2.0.0.

## Enumeration Members

### ~~CONFIG\_AFTER~~

> **CONFIG\_AFTER**: `"config::after"`

Defined in: [hooks/index.ts:49](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/hooks/index.ts#L49)

After the map script's `config`, in the lobby.

#### Deprecated

With no replacement: no Init stage runs at the lobby's
timing. It still works in 1.x and is removed in 2.0.0, with the rest of
`W3TS_HOOK`.

***

### ~~CONFIG\_BEFORE~~

> **CONFIG\_BEFORE**: `"config::before"`

Defined in: [hooks/index.ts:42](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/hooks/index.ts#L42)

Before the map script's `config`, in the lobby.

#### Deprecated

With no replacement: no Init stage runs at the lobby's
timing. It still works in 1.x and is removed in 2.0.0, with the rest of
`W3TS_HOOK`.

***

### ~~MAIN\_AFTER~~

> **MAIN\_AFTER**: `"main::after"`

Defined in: [hooks/index.ts:35](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/hooks/index.ts#L35)

After the map script's `main`.

#### Deprecated

Use [Init.onInitTriggers](../interfaces/InitStages.md#oninittriggers),
the same moment: the end of `main`. Removed in 2.0.0.

***

### ~~MAIN\_BEFORE~~

> **MAIN\_BEFORE**: `"main::before"`

Defined in: [hooks/index.ts:29](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/hooks/index.ts#L29)

Before the map script's `main`.

#### Deprecated

Use [Init.onGlobals](../interfaces/InitStages.md#onglobals), which
runs later by design, after `InitGlobals`. Removed in 2.0.0.
