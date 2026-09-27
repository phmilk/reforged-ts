---
title: Frames and UI
sidebar_position: 7
description: Building custom UI with the Frame Wrapper, from FDF definitions to layout, showing a frame to one player, reading what a player did through frame events, and the other UI Wrappers.
---

# Frames and UI

The game's interface is a tree of frames, each a `framehandle`, laid out from FDF (Frame Definition File) templates. [`Frame`](../api/reforged-ts/classes/Frame.md) wraps one and covers the frame Natives: create a frame from a template, place it, change its text, texture and value, and hear its events.

## Getting a frame

| Member                                                             | Kind     | Gives                                                                                             |
| ------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------- |
| `Frame.fromOrigin(originFrameType, index)`                         | Lookup   | One of the game's own frames (`ORIGIN_FRAME_GAME_UI`, a command button, the minimap)              |
| `Frame.fromName(name, createContext)`                              | Lookup   | A frame by the name and context it was created under                                              |
| `Frame.create(name, owner, priority, createContext)`               | Creation | A frame from the FDF template `name`, as a child of `owner`                                       |
| `Frame.createSimple(name, owner, createContext)`                   | Creation | A simple frame (`SIMPLEFRAME` templates)                                                          |
| `Frame.createType(name, owner, createContext, typeName, inherits)` | Creation | A frame of a base type (`"BACKDROP"`, `"GLUEBUTTON"`, `"TEXT"`), optionally inheriting a template |

The rule of [Handles and Wrappers](handles-and-wrappers.md#creation-throws-lookup-returns-undefined) holds, with one detail of the game: when it finds no frame (a name it does not know, a template missing from the loaded FDF files), it returns a frame whose handle id is `0` instead of nothing. The Wrapper treats that frame as nothing, so a lookup returns `undefined` and a creation throws `reforged-ts: failed to create Frame (ScorePanel)`.

A template must be loaded before a frame is created from it: list the map's FDF files in a TOC file imported with the map, and load it with `Frame.loadTOC`:

```ts
import { Frame, Init } from "reforged-ts";

export let scorePanel: Frame | undefined;

Init.onGameStart(() => {
  Frame.loadTOC("war3mapImported\\ui.toc");
  const gameUi = Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0);
  if (gameUi === undefined) {
    return;
  }
  const panel = Frame.create("ScorePanel", gameUi, 0, 0);
  panel.setAbsPoint(FRAMEPOINT_TOPRIGHT, 0.78, 0.55);
  panel.setSize(0.2, 0.1);
  panel.text = "Score: 0";
  scorePanel = panel;
});
```

A Map project builds its UI at the `gameStart` [Init stage](init-stages.md) or later, once the game's own interface is up.

## Layout

A frame is placed by its points: `setAbsPoint(point, x, y)` pins one of its points (`FRAMEPOINT_CENTER`, `FRAMEPOINT_TOPLEFT`, ...) to a screen position, `setPoint(point, relative, relativePoint, x, y)` pins it to a point of another frame, and `setAllPoints(relative)` gives it another frame's position and size. `setSize(width, height)` sizes it. Positions are in screen units: `0` to `0.8` from left to right and `0` to `0.6` from bottom to top over the 4:3 area in the middle of the screen, whatever the resolution.

`visible`, `enabled`, `alpha`, `text`, `value` and the `set*` members change what the frame shows. `setTexture` and `setModel` take asset paths.

## One player's UI

A frame exists on every client, and what it shows may differ between them: that is how a Map project shows one player a panel the others do not see. Create and look up frames on every client, then change the visuals inside [`MapPlayer.runLocal`](players.md#the-local-player):

```ts
import { Frame, MapPlayer } from "reforged-ts";

/** Shows `panel` to `player` alone. */
export function showTo(player: MapPlayer, panel: Frame): void {
  MapPlayer.runLocal(player, () => {
    panel.visible = true;
  });
}
```

Creating a frame inside `runLocal` allocates a Handle id on one client, and so does the first `Frame.fromName` of a frame the library has not wrapped yet: in Dev mode both raise there ([Local-only code](desync-safety-and-guards.md#local-only-code-d1-game-state-changed-for-one-client)). Look the frame up once, outside, and keep it.

## Reading what a player did

The frame getters (`text`, `value`, `visible`, `alpha`, `enabled`, `width`, `height`, `children`) read this client's interface: the Natives behind them are marked `@async` in the [Typings](typings.md), since one player's edit box or slider has its own value on each client. Never let them change game state.

What a player did reaches every client through a frame event. [`FrameEvents.of(frame, frameEventType)`](../api/reforged-ts/variables/FrameEvents.md) subscribes to one event of one frame, and the game delivers it to every client, so the handler may change game state. Its payload holds the `frame`, the `event` type, the `value` (a slider's) and the `text` (an edit box's, `undefined` for an event with none); the player who acted is `MapPlayer.fromEvent()`:

```ts
import { Frame, Init, MapPlayer, on, FrameEvents } from "reforged-ts";

Init.onGameStart(() => {
  const gameUi = Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0);
  if (gameUi === undefined) {
    return;
  }
  const button = Frame.createType(
    "ReadyButton",
    gameUi,
    0,
    "GLUETEXTBUTTON",
    "ScriptDialogButton",
  );
  button.setAbsPoint(FRAMEPOINT_CENTER, 0.4, 0.3);
  button.setSize(0.12, 0.04);
  button.text = "Ready";

  on(FrameEvents.of(button, FRAMEEVENT_CONTROL_CLICK), () => {
    const player = MapPlayer.fromEvent();
    if (player !== undefined) {
      print(`${player.name} is ready.`);
    }
  });
});
```

For a value no event carries, send it with the [sync System](systems.md#sync).

## Other UI Wrappers

Before custom frames, the game had fixed UI objects, and each has its Wrapper: [`Dialog`](../api/reforged-ts/classes/Dialog.md) and [`DialogButton`](../api/reforged-ts/classes/DialogButton.md) for a modal menu of buttons (with [`DialogEvents`](../api/reforged-ts/variables/DialogEvents.md)), [`Multiboard`](../api/reforged-ts/classes/Multiboard.md) and [`Leaderboard`](../api/reforged-ts/classes/Leaderboard.md) for score tables, [`TextTag`](../api/reforged-ts/classes/TextTag.md) for floating text, [`TimerDialog`](../api/reforged-ts/classes/TimerDialog.md) for a countdown, and [`Quest`](../api/reforged-ts/classes/Quest.md) for the quest log.

The 3.0.0 frame additions (pixel to frame unit conversions, text area auto-scroll) are part of the [3.0.0 systems](3-0-0-systems.md).

## Lint rules

- [`no-game-state-in-local-branch`](lint-rules/no-game-state-in-local-branch.md): game state changed where only visuals belong.
- [`no-async-value-as-state`](lint-rules/no-async-value-as-state.md): a client-local value flowing into game state.
- [`no-percent-in-display-strings`](lint-rules/no-percent-in-display-strings.md): a lone `%` in `text`, `setText` or `addText`, which the game formats.
- [`no-dotted-asset-paths`](lint-rules/no-dotted-asset-paths.md): a texture or model path with a dot before its extension, which the game does not read.
