# ~~Function: addScriptHook()~~

> **addScriptHook**(`entryPoint`, `hook`): `boolean`

Defined in: [hooks/index.ts:74](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/hooks/index.ts#L74)

Registers `hook` to run before or after the map script's `main` or
`config`.

## Parameters

### entryPoint

[`EntryPoint`](../type-aliases/EntryPoint.md)

When the hook runs: `"main::before"`, `"main::after"`,
`"config::before"` or `"config::after"`, or the [W3TS\_HOOK](../enumerations/W3TS_HOOK.md) value.

### hook

() => `void`

The function the entry point runs, under pcall.

## Returns

`boolean`

True when `entryPoint` is one of the four and the hook was
registered; false otherwise, and nothing is registered.

## Remarks

The hook runs under pcall, where w3ts let a failing hook end `main` or
`config` silently: a failure prints one line,
`reforged-ts: main::before callback #2 failed: <message>` (the entry
point, the hook's ordinal in its queue and the message), and the other
hooks of the entry point and the entry point itself still run. The hooks
keep their w3ts timing: a hook registered after its entry point ran waits
for the next run.

## Deprecated

Register for an Init stage instead:
[Init.onGlobals](../interfaces/InitStages.md#onglobals) for `main::before` and
[Init.onInitTriggers](../interfaces/InitStages.md#oninittriggers) for `main::after`.
The two `config` entry points have no stage in 1.x: code that needs the
lobby's timing stays on this alias. Removed in 2.0.0.
