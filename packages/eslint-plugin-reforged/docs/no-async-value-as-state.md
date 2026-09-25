# no-async-value-as-state

Reports a value that differs between clients (an `@async` Native or library member, or Lua's `os.clock`, `os.time`, `os.date`, `os.difftime`) that flows into game state: a call argument, a module-level variable or a table key. A warning in the recommended config; share the value through the sync System (`SyncRequest`) first, or use it only in a text or visual call.

## Why

Pitfalls D3 and D6 of the catalogue (#15). Some Natives return a value computed on the local client: the camera position, the terrain height, the locale, a frame's text, `GetLocalPlayer` itself. jassdoc tags 56 of them `@async` ([jassdoc](https://github.com/lep/jassdoc)). Lua's `os` library is "asynchronous by design ... The only enabled ones are os.clock, os.date, os.time and os.difftime" ([A comprehensive guide to mapping in Lua](https://www.hiveworkshop.com/threads/a-comprehensive-guide-to-mapping-in-lua.341880/), "Libraries"). Such values "desync, if and only if you use them to change game state" (same guide, "Asynchronous Functions"): each client then computes a different game, and the players are disconnected.

A source is:

- a call whose resolved declaration carries the `@async` doc tag: a Native of `reforged-types` (the tag its generated headers carry), or a `reforged-ts` member such as `MapPlayer.fromLocal()`;
- a read of a `reforged-ts` accessor whose getter carries the tag (`point.z`);
- a call to `os.clock`, `os.time`, `os.date` or `os.difftime` of the Lua library.

Sources are matched through the type checker: a project function named `GetLocalPlayer`, or a project member documented with JSDoc's own `@async`, is not one. The plugin pre-matches Natives by the list `reforged-types` publishes, `async-natives.json`, read from the Map project's own installation. If the Map project has no `reforged-types`, the plugin prints one warning at load and the rule reports nothing; a list that is present but malformed stops the lint at load, naming the field.

The value is state when it reaches, directly or through one `const`:

- an argument of a call or `new` that is not in the plugin's allowlist, `data/local-safe.json`. The allowlist holds the text sinks (`print`, `DisplayTextToPlayer`, `BlzFrameSetText`, `Frame#text`, ...) and the visual calls (frame setters, vertex colours, the camera, sounds). An assignment to a library accessor counts as a call to its setter. Its `pure` Natives (the converters `I2S`, `R2S`, `R2I`, ..., the math and string Natives) are neither sinks nor exempt: the value flows on through their result, so `DisplayTextToPlayer(p, 0, 0, R2S(GetCameraTargetPositionX()))` passes and `SetUnitX(u, R2I(GetCameraTargetPositionX()))` is reported;
- the value of a module-level or exported variable, assigned or initialised;
- a table key: `table[value]` read or written, or `{ [value]: ... }`.

The sync System is the way out: an argument of `new SyncRequest(...)` or of `request.start(...)` is shared with every client, and is not state.

The rule follows the value through arithmetic, comparisons, template literals, `String()`, `tostring()`, the functions of `Math` and the `pure` Natives of the allowlist. It stops at a local `let`, a `return`, the test of an `if` or of a conditional, and at the receiver of a member access. Every other call counts as state, including a lookup Native such as `GetPlayerId(GetLocalPlayer())`: compare `GetLocalPlayer()` with a player instead.

## Incorrect

```ts
import { Frame } from "reforged-ts";

let lastClick = 0;

function onClick(u: unit, ranks: number[], scores: LuaMap<number, number>) {
  SetUnitX(u, GetCameraTargetPositionX()); // the local camera moves a unit
  SetUnitY(u, R2I(GetCameraTargetPositionY())); // a pure Native passes the value on
  lastClick = os.clock(); // a module-level variable
  scores.set(os.time(), 1); // a call that is neither text nor visual
  const zoom = GetCameraField(CAMERA_FIELD_TARGET_DISTANCE);
  ranks[zoom] = 1; // a table key, through one const
  Frame.fromName("Slider", 0)!.value = BlzGetLocalUnitZ(u); // Frame#value fires a synced frame event
  SetPlayerState(GetLocalPlayer(), PLAYER_STATE_RESOURCE_GOLD, 100);
}
```

## Correct

```ts
import { Frame, MapPlayer, SyncRequest } from "reforged-ts";

function onClick(owner: MapPlayer) {
  print(`camera at ${GetCameraTargetPositionX()}`); // a text sink
  DisplayTextToPlayer(owner.handle, 0, 0, R2S(GetCameraTargetPositionX())!); // through a pure Native to a text sink
  SetCameraPosition(GetCameraTargetPositionX() + 100, 0); // a visual call
  if (owner.isLocal()) {
    Frame.fromName("Tooltip", 0)!.setVisible(true); // visual, in a local branch
  }
  // Shared first: every client receives the value `owner` measured.
  new SyncRequest(owner, String(os.clock())).then((response) => {
    SetPlayerState(
      owner.handle,
      PLAYER_STATE_RESOURCE_GOLD,
      S2I(response.data),
    );
  });
}
```

## Options

None.

## Suggestions and fixes

None: sharing a value needs the sync System's asynchronous round trip, which changes when the code runs.

## When not to use it

When a value is deliberately local, a log timestamp or a profiling measure that never reaches the game, say why:

```ts
// eslint-disable-next-line reforged/no-async-value-as-state -- a profiling timestamp, printed only
export const loadStarted = os.clock();
```
