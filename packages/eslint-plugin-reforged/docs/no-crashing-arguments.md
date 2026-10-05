# no-crashing-arguments

Reports a call with literal arguments that crashed the game in a Crashing case of the Nullability sweep: `BlzCreateFrameByType` or `Frame.createType` with the frame type `SIMPLEMESSAGEFRAME` or `CONTROL` and `inherits` `""`. An error in the recommended config; the message names the Crashing case, its Build and the replacement, an FDF template to inherit that defines the type's fields.

## Why

Pitfall C5 of the catalogue (#15), invalid or wrong-kind frames: "`BACKDROP`, `TEXTAREA`, `SIMPLEMESSAGEFRAME`, `DIALOG` and `CONTROL` frames can crash the game when created without their required FDF fields" ([jassdoc](https://github.com/lep/jassdoc), `BlzCreateSimpleFrame`). The Nullability sweep ran each of those types through `BlzCreateFrameByType` with `inherits: ""` on 3.0.0.24268 (`docs/research/nullability-sweep.md`): `SIMPLEMESSAGEFRAME` and `CONTROL` crashed the game for every player, with no error; `BACKDROP`, `TEXTAREA` and `DIALOG` returned a frame. A frame type with a template was not measured, so the rule reports only `inherits: ""`.

The Crashing cases are `data/crashing-arguments.json` in the package: one entry per Crashing case, with the callee, the library members backed by it that it also covers, the literal arguments by parameter name, the Build, the consequence and the replacement. A call is reported when every listed parameter's argument is a literal among the listed values, so a value computed at run time is not; in Dev mode, `Frame.createType` throws for it before it calls the Native.

## Incorrect

```ts
import { Frame, Init } from "reforged-ts";

Init.onGameStart(() => {
  const gameUi = Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0)!;
  const box = Frame.createType("Box", gameUi, 0, "CONTROL", ""); // crashes the game
  box.visible = true;
});
```

## Correct

```ts
import { Frame, Init } from "reforged-ts";

Init.onGameStart(() => {
  const gameUi = Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0)!;
  // "MyControl" is a CONTROL definition of a loaded FDF file.
  const box = Frame.createType("Box", gameUi, 0, "CONTROL", "MyControl");
  box.visible = true;
});
```

## Options

None.

## Suggestions and fixes

None: the replacement names an FDF template of the Map project, which the rule cannot know.

## When not to use it

When a later Build no longer crashes on the case, until the data file follows. Silence that one line and say why:

```ts
// eslint-disable-next-line reforged/no-crashing-arguments -- the Build this map targets no longer crashes here
const box = Frame.createType("Box", gameUi, 0, "CONTROL", "");
```
