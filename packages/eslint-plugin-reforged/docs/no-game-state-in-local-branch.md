# no-game-state-in-local-branch

Reports a call that may change game state inside a branch that runs for the local player only: a Native or a Wrapper member that the plugin's allowlist does not list as visual, a creation, `Filter`/`Condition`, `ForGroup`/`ForForce`, and a random-number call. An error in the recommended config; keep the game-state change outside the branch, for every player, and only the visuals inside it.

## Why

Pitfalls D1 and D2 of the catalogue (#15). `GetLocalPlayer` returns a different player on each client, so code conditioned on it runs on one client only. jassdoc: "anything that's only visual (like unit color) will not desync", but "manipulating handles or creating units locally, changing their health, attack, invisibility etc. - anything that changes the game will desync", with `if (GetLocalPlayer() == whichPlayer) then call KillUnit(someUnit)` marked "INSTANTLY DESYNCS!" ([jassdoc](https://github.com/lep/jassdoc), `GetLocalPlayer`). "You cannot create or destroy any type that extends agent locally without causing desync" (["GetLocalPlayer" causes DeSync??](https://www.hiveworkshop.com/threads/getlocalplayer-causes-desync.285913/)). "Calling ForGroup/ForForce inside Local Player code" and "Calling subfunctions in BlzFrameSetText() arguments in GetLocalPlayer condition" desync ([Known causes of desync](https://www.hiveworkshop.com/threads/known-causes-of-desync.317486/)). The random number generator is "a global, shared resource. Do not change its state in local blocks asynchronously" ([jassdoc](https://github.com/lep/jassdoc), `GetRandomInt`), and "GetRandomX inside GetLocalPlayer block" desyncs ([Known causes of desync](https://www.hiveworkshop.com/threads/known-causes-of-desync.317486/)). The other players are dropped to the score screen, sometimes minutes later.

A **local-player expression** is a call to `GetLocalPlayer()`, `MapPlayer.fromLocal()` or `player.isLocal()`; an equality or inequality between a player and one of those; or a `const` bound to one of those in the same function or at module level (one hop).

A **local branch** is:

- the consequent of an `if`, a conditional expression (`a ? b : c`), or the right operand of `&&`/`||`, whose test contains a local-player expression;
- the `else` branch too, when the test is negated (`!player.isLocal()`, `GetLocalPlayer() !== p`);
- the function passed to `MapPlayer.runLocal(player, fn)`;
- every function defined inside a local branch, because it runs there.

Inside it the rule reports:

- a call to a Native, or to a member of a `reforged-ts` Wrapper (an accessor assignment such as `unit.life = 0` counts as a call to its setter), that `data/local-safe.json` does not list. The file lists the calls that only change what the local player sees or hears (`visual`: frame setters, vertex colours, the camera, sounds and music, and their Wrapper members), the calls that display a string (`text`: the display Natives, `print`, the frame text setters), and the Natives whose result depends on their arguments alone (`pure`: the converters `I2S`, `R2S`, `R2SW`, `S2I`, `S2R`, `I2R`, `R2I`; the math Natives `SquareRoot`, `Pow`, `Sin`, `Cos`, ...; the string Natives `SubString`, `StringLength`, `StringCase`, ...). A Native that reads game state (`GetUnitX`, `GetPlayerState`) is reported too, and so are the frame lookups `BlzGetFrameByName` and `BlzGetOriginFrame`: a first lookup may allocate a frame handle, on one client only (see "When not to use it");
- a creation: a creation Native (`CreateTimer`, `AddSpecialEffect`, ...) or a Wrapper static named `create*` (`Unit.create`, `Effect.createAttachment`, ...);
- `Filter`, `Condition`, `ForGroup`, `ForForce`, `Group#for` and `Force#for`;
- `GetRandomInt`, `GetRandomReal`, `SetRandomSeed`, `Math.random` (compiled to Lua's `math.random`) and lua-types' `math.random` and `math.randomseed`.

Pure computation (arithmetic, string and array methods) and calls to the project's own functions are not reported. The rule does not follow a call into a project function, so a function that changes game state and is called from a local branch is not reported.

## Incorrect

```ts
import { MapPlayer, Unit } from "reforged-ts";

declare const player: MapPlayer;
declare const unit: Unit;

if (player.isLocal()) {
  unit.kill(); // game state on one client
  const timer = CreateTimer(); // a Handle on one client
  const roll = GetRandomInt(1, 6); // the shared random stream diverges
}

MapPlayer.runLocal(player, () => {
  unit.life = 0; // an accessor setter is a call
});
```

## Correct

```ts
import { Frame, MapPlayer, Unit } from "reforged-ts";

declare const player: MapPlayer;
declare const unit: Unit;
declare const frame: Frame;

// Change game state for every player, outside the branch...
unit.kill();
const timer = CreateTimer();
const roll = GetRandomInt(1, 6);
const text = `Rolled ${roll}`;
const rollLabel = BlzGetFrameByName("RollLabel", 0)!; // look the frame up for every player

// ...and only what the local player sees inside it.
if (player.isLocal()) {
  frame.text = text;
  frame.setVisible(true);
  unit.setVertexColor(255, 255, 255, 128);
  BlzFrameSetText(rollLabel, I2S(roll)!); // I2S is pure
}
```

## Options

```ts
{ allow?: string[] } // default: { allow: [] }
```

`allow` adds names the rule treats as visual, in the forms of `data/local-safe.json`: a Native (`"SetUnitScale"`), an instance member (`"Unit#setScale"`) or a static member (`"Camera.pan"`). For example:

```js
{
  rules: {
    "reforged/no-game-state-in-local-branch": [
      "error",
      { allow: ["GetUnitX", "Unit#setScale"] },
    ],
  },
}
```

A name that only changes what the local player sees belongs in `data/local-safe.json` itself; open a pull request with its reason.

## Suggestions and fixes

None: moving a call out of the branch makes it run for every player, which changes what the code does. The author decides where the game-state change belongs.

## When not to use it

A plain value getter such as `GetUnitX` or `GetPlayerState` is reported by design, and is not a `pure` entry: what it reads is game state, not its arguments, and the rule cannot tell a read from a handle allocation (some getters allocate one). Read the value outside the branch, for every player, and pass it in. The same holds for a frame: look it up with `BlzGetFrameByName` or `BlzGetOriginFrame` outside the branch, then set it inside.

When the call is known to be safe for one client, for instance a read Native whose value is only displayed. Prefer the `allow` option for a name used in many places; for one line, silence it and say why:

```ts
if (GetLocalPlayer() === p) {
  // eslint-disable-next-line reforged/no-game-state-in-local-branch -- a read, only displayed to the local player
  BlzFrameSetText(label, I2S(GetPlayerState(p, PLAYER_STATE_RESOURCE_GOLD)));
}
```
