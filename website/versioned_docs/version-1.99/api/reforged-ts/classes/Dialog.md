# Class: Dialog

Defined in: [handles/dialog.ts:72](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/dialog.ts#L72)

A menu of buttons shown in the middle of the screen, to the players it is
displayed to.

## Remarks

A player who sees a dialog can do nothing else until they click one of its
buttons, and the game shows no dialog during map initialization: display it
from a Timer once the game runs.

## Example

**Create a simple dialog.**

```ts
// A dialog with two buttons for the first player. The game shows no dialog
// during map initialization, so a Timer adds the buttons and shows it a
// second after the game starts.
import {
  Dialog,
  DialogButton,
  Init,
  Timer,
  Trigger,
  tsGlobals,
} from "reforged-ts";

Init.onTriggers(() => {
  const dialog = Dialog.create();
  let stay: DialogButton | undefined;

  Trigger.create()
    .registerDialogEvent(dialog)
    .addAction(() => {
      if (DialogButton.fromEvent() === stay) {
        print("Staying.");
      }
    });

  Timer.create().start(1.0, false, () => {
    stay = DialogButton.create(dialog, "Stay", 0);
    DialogButton.create(dialog, "Leave", 0, true);

    dialog.setMessage("Welcome to TypeScript!");
    dialog.display(tsGlobals.Players[0], true);
  });
});
```

## Native

[dialog](/typings/3.0.0/interfaces/dialog) ([jassbot](https://lep.duckdns.org/jassbot/doc/dialog))

## Extends

- [`Handle`](Handle.md)\<`dialog`\>

## Properties

### handle

> `readonly` **handle**: `dialog`

Defined in: [handles/handle.ts:132](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/handle.ts#L132)

The Handle this Wrapper owns, to pass to a Native the library does not
wrap.

#### Remarks

Do not keep it after `destroy()`: the game frees the object behind it.

#### Inherited from

[`Handle`](Handle.md).[`handle`](Handle.md#handle)

## Accessors

### id

#### Get Signature

> **get** **id**(): `number`

Defined in: [handles/handle.ts:148](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/handle.ts#L148)

Gets the game's numeric id of the Handle.

##### Remarks

Ids are not recycled immediately when the object is destroyed (a new
Handle created right after gets the next id), and they are allocated
deterministically from map start. An id is never data: key a collection
on the Handle (or use `HandleMap` and `HandleSet`), never on its id.

##### Native

[GetHandleId](/typings/3.0.0/functions/GetHandleId) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetHandleId))

##### Returns

`number`

The id, unique among the live Handles.

#### Inherited from

[`Handle`](Handle.md).[`id`](Handle.md#id)

## Methods

### addButton()

> **addButton**(`text`, `hotkey?`, `quit?`, `score?`): [`DialogButton`](DialogButton.md)

Defined in: [handles/dialog.ts:100](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/dialog.ts#L100)

Adds a button to the bottom of the dialog, as [DialogButton.create](DialogButton.md#create)
does.

#### Parameters

##### text

`string`

The label the player reads on the button.

##### hotkey?

`number` = `0`

The key that clicks the button: the character code of an
upper-case letter, such as `"F".charCodeAt(0)`; 0, the default, for none.

##### quit?

`boolean` = `false`

When true, clicking the button makes the player leave the
game; false by default.

##### score?

`boolean` = `false`

With `quit`, whether the leaving player sees the score
screen rather than the main menu; false by default.

#### Returns

[`DialogButton`](DialogButton.md)

The new button.

#### Throws

When the game returns no handle: `reforged-ts: failed to create DialogButton`, at the calling line.
In Dev mode, also when called before the globals Init stage or inside `MapPlayer.runLocal`.

#### Native

[DialogAddQuitButton](/typings/3.0.0/functions/DialogAddQuitButton) ([jassbot](https://lep.duckdns.org/jassbot/doc/DialogAddQuitButton))

#### Native

[DialogAddButton](/typings/3.0.0/functions/DialogAddButton) ([jassbot](https://lep.duckdns.org/jassbot/doc/DialogAddButton))

***

### clear()

> **clear**(): `void`

Defined in: [handles/dialog.ts:116](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/dialog.ts#L116)

Removes the dialog's message and every button, even while it is shown.

#### Returns

`void`

#### Remarks

Hide the dialog first: a player who still sees it cleared has no button
left to close it with.

#### Native

[DialogClear](/typings/3.0.0/functions/DialogClear) ([jassbot](https://lep.duckdns.org/jassbot/doc/DialogClear))

***

### destroy()

> **destroy**(): `void`

Defined in: [handles/dialog.ts:131](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/dialog.ts#L131)

Destroys the Dialog through its Native.

#### Returns

`void`

#### Remarks

In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
a second `destroy()` included, raises
`reforged-ts: used after destroy: <Class>#<id>`, and
`Reforged.debug.report()` counts it destroyed.

#### Example

**Tearing down a round's interface**

```ts
// A round's interface, built when the round starts and torn down when it
// ends: a timer window, a leaderboard, a multiboard, a vote dialog, a quest
// and a frame. Each is hidden, then destroyed, on every client, and the
// object that held them is dropped: in Dev mode any later use of a
// destroyed Wrapper raises `reforged-ts: used after destroy: <Class>#<id>`.
import {
  Dialog,
  DialogButton,
  Frame,
  Init,
  Leaderboard,
  MapPlayer,
  Multiboard,
  Quest,
  Timer,
  TimerDialog,
  tsGlobals,
} from "reforged-ts";

interface RoundUi {
  readonly timer: Timer;
  readonly countdown: TimerDialog;
  readonly kills: Leaderboard;
  readonly scores: Multiboard;
  readonly vote: Dialog;
  readonly objective: Quest;
  readonly banner: Frame | undefined;
}

let round: RoundUi | undefined;

/** Ends the round: hides each part of its interface, then destroys it. */
export function endRound(players: MapPlayer[]): void {
  if (round === undefined) {
    return;
  }
  const { timer, countdown, kills, scores, vote, objective, banner } = round;
  round = undefined;
  countdown.display = false;
  countdown.destroy();
  timer.destroy();
  kills.display(false);
  kills.destroy();
  scores.display(false);
  scores.destroy();
  for (const player of players) {
    vote.display(player, false);
  }
  vote.destroy();
  objective.enabled = false;
  objective.destroy();
  if (banner !== undefined) {
    banner.visible = false;
    banner.destroy();
  }
}

/** Starts a two-minute round, with its interface. */
export function startRound(players: MapPlayer[]): void {
  const timer = Timer.create().start(120, false, () => {
    endRound(players);
  });
  const countdown = TimerDialog.create(timer);
  countdown.setTitle("Round");
  countdown.display = true;

  const kills = Leaderboard.create();
  kills.label = "Kills";
  kills.display();

  const scores = Multiboard.create();
  scores.title = "Score";
  scores.columns = 1;
  scores.rows = 1;
  // A cell's handle is released once set; the cell keeps its text.
  const cell = scores.createItem(1, 1);
  cell.setValue("0");
  cell.destroy();

  const vote = Dialog.create();
  vote.setMessage("Surrender?");
  DialogButton.create(vote, "No", 0);

  const objective = Quest.create();
  objective.setTitle("Hold the line");
  objective.setDescription("Survive until the timer runs out.");

  const gameUi = Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0);
  const banner =
    gameUi === undefined
      ? undefined
      : Frame.createType("RoundBanner", gameUi, 0, "TEXT", "");
  banner?.setText("Round 1");

  round = { timer, countdown, kills, scores, vote, objective, banner };
}

Init.onGameStart(() => {
  startRound(tsGlobals.Players);
});
```

#### Native

[DialogDestroy](/typings/3.0.0/functions/DialogDestroy) ([jassbot](https://lep.duckdns.org/jassbot/doc/DialogDestroy))

***

### display()

> **display**(`whichPlayer`, `flag`): `void`

Defined in: [handles/dialog.ts:146](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/dialog.ts#L146)

Shows the dialog to one player, or hides it from them.

#### Parameters

##### whichPlayer

[`MapPlayer`](MapPlayer.md)

The player who sees or stops seeing the dialog.

##### flag

`boolean`

True to show the dialog, or show it again after adding
buttons; false to hide it.

#### Returns

`void`

#### Remarks

A dialog does not appear when shown during map initialisation:
show it after a wait, or from a Timer of zero seconds, to have it up
as early as the game allows.

#### Native

[DialogDisplay](/typings/3.0.0/functions/DialogDisplay) ([jassbot](https://lep.duckdns.org/jassbot/doc/DialogDisplay))

***

### setMessage()

> **setMessage**(`whichMessage`): `void`

Defined in: [handles/dialog.ts:155](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/dialog.ts#L155)

Sets the message shown above the buttons, even while the dialog is shown.

#### Parameters

##### whichMessage

`string`

The message; an empty string leaves no room for one.

#### Returns

`void`

#### Native

[DialogSetMessage](/typings/3.0.0/functions/DialogSetMessage) ([jassbot](https://lep.duckdns.org/jassbot/doc/DialogSetMessage))

***

### create()

> `static` **create**(): `Dialog`

Defined in: [handles/dialog.ts:80](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/dialog.ts#L80)

Creates an empty dialog, hidden from every player.

#### Returns

`Dialog`

The new dialog.

#### Throws

When the game returns no handle: `reforged-ts: failed to create Dialog`, at the calling line.
In Dev mode, also when called before the globals Init stage or inside `MapPlayer.runLocal`.

#### Native

[DialogCreate](/typings/3.0.0/functions/DialogCreate) ([jassbot](https://lep.duckdns.org/jassbot/doc/DialogCreate))

***

### fromEvent()

> `static` **fromEvent**(): `Dialog` \| `undefined`

Defined in: [handles/dialog.ts:165](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/dialog.ts#L165)

Gets the dialog a player clicked, in a dialog or dialog button event.

#### Returns

`Dialog` \| `undefined`

The clicked dialog, or `undefined` outside a dialog or dialog
button click event.

#### Native

[GetClickedDialog](/typings/3.0.0/functions/GetClickedDialog) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetClickedDialog))

***

### fromHandle()

> `static` **fromHandle**\<`C`\>(`this`, `handle`): `C` \| `undefined`

Defined in: [handles/handle.ts:195](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/handle.ts#L195)

Gets the Wrapper for `handle`, making it on first use. The same Handle
always gives the same object; when the object cached for it is of a less
specific class than the one asked for (a `Timer` cached,
`MyTimer.fromHandle` asked), a new object of the class asked for replaces
it. `Unit.fromHandle(h)` is typed `Unit | undefined`.

#### Type Parameters

##### C

`C` *extends* [`Handle`](Handle.md)\<`handle`\>

The Wrapper of the class it is called on.

#### Parameters

##### this

[`WrapperClass`](../type-aliases/WrapperClass.md)\<`C`\>

##### handle

`C`\[`"handle"`\] \| `undefined`

A Handle of the class's Native type.

#### Returns

`C` \| `undefined`

The Wrapper, or `undefined` when `handle` is undefined.

#### Remarks

It creates no Handle, so none of the creation Guards of Dev mode apply:
wrap a Handle that Native code outside the library returned.

#### Inherited from

[`Handle`](Handle.md).[`fromHandle`](Handle.md#fromhandle)
