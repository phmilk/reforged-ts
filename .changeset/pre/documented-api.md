---
"reforged-ts": minor
---

Every public symbol of the library carries a doc comment, in the `.d.ts` files the editor reads: what it does, its parameters with their units and ranges, what it returns (a lookup says when it is `undefined`), the error each creation raises with its message, the Natives behind it with `@native`, and `@async` on each value read from the local client. Every Wrapper and System comes with an example, and the editor's hover shows the example's code. The API reference on the docs site is built from the same comments.

Caveats use the standard `@remarks` tag instead of `@note`. The behaviour changes from w3ts 3.x (the `readDouble` alignment, the corrected error messages of `Point`, `Region`, `TimerDialog` and `WeatherEffect`, `Players` filled at the `globals` stage, the silent `MapPlayer.fromLocal`) are in the `@remarks` of the members they affect.

New type exports, so code written apart from the call it serves can name its types:

- The Event payloads: `ChatPayload`, `DialogClick`, `FramePayload`, `KeyPayload`, `MousePayload`, `PlayerPayload`, `RegionCrossing`, `SyncPayload` and `TrackablePayload`, for a handler written apart from its `on()` call.
- The types the events namespaces are declared with: `EventDescriptors`, `EventRow`, `FixedRow` and `UnitEventDescriptors`.
- `WrapperClass`, which `Handle.fromHandle`'s signature names, and `EntryPoint`, the type of `addScriptHook`'s first parameter.

`item.icon` is no longer marked `@async`: `BlzGetItemIconPath` gives the same path on every client.

`addScriptHook` and `W3TS_HOOK` stay deprecated and are removed in 2.0.0. Their deprecation notes now name the Init stage to move to: `Init.onGlobals` for `main::before`, `Init.onInitTriggers` for `main::after`. The two `config` entry points have no replacement: they work until 2.0.0.
