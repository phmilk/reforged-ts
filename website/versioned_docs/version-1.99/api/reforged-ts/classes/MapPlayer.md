# Class: MapPlayer

Defined in: [handles/player.ts:30](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L30)

A player slot. Players are not created: the game has one per slot, and
[MapPlayer.fromIndex](#fromindex) looks it up. A Map project may extend this
class with its own player model; the lookups inherited from the base then
give instances of the subclass.

## Remarks

- Named `MapPlayer` because the Native type name, `player`, collides with
  the Native function `Player`.
- [tsGlobals.Players](../reforged-ts/namespaces/tsGlobals/variables/Players.md) holds one `MapPlayer` per slot, `Players[i]` for
  slot `i`, but only from the `globals` Init stage on: the library fills
  it after `InitGlobals`, before any `Init.onGlobals` callback of the Map
  project. At module top level it is empty (w3ts 3.x filled it when the
  library loaded). [MapPlayer.fromIndex](#fromindex) works at any time.
- A lookup through a subclass replaces the `MapPlayer` that
  `tsGlobals.Players` holds for that slot: the array keeps the old object,
  which still works but is no longer `===` to later lookups.

## Example

**Greeting every user in the game**

```ts
// When the game starts, each user still in it gets a greeting naming their
// slot. tsGlobals.Players is filled from the globals stage on, so every later
// stage can read it.
import { Init, tsGlobals } from "reforged-ts";

Init.onGameStart(() => {
  for (const player of tsGlobals.Players) {
    if (
      player.slotState === PLAYER_SLOT_STATE_PLAYING &&
      player.controller === MAP_CONTROL_USER
    ) {
      player.displayTimedText(
        0,
        0,
        10,
        `Welcome, player ${String(player.id + 1)}.`,
      );
    }
  }
});
```

## Native

[player](/typings/3.0.0/interfaces/player) ([jassbot](https://lep.duckdns.org/jassbot/doc/player))

## Extends

- [`Handle`](Handle.md)\<`player`\>

## Properties

### handle

> `readonly` **handle**: `player`

Defined in: [handles/handle.ts:132](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/handle.ts#L132)

The Handle this Wrapper owns, to pass to a Native the library does not
wrap.

#### Remarks

Do not keep it after `destroy()`: the game frees the object behind it.

#### Inherited from

[`Handle`](Handle.md).[`handle`](Handle.md#handle)

## Accessors

### aiDifficulty

#### Get Signature

> **get** **aiDifficulty**(): `aidifficulty`

Defined in: [handles/player.ts:37](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L37)

Gets the difficulty of the player's computer AI.

##### Native

[GetAIDifficulty](/typings/3.0.0/functions/GetAIDifficulty) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetAIDifficulty))

##### Returns

`aidifficulty`

The difficulty, such as `AI_DIFFICULTY_NORMAL`, or `undefined`
when the game gives none.

***

### color

#### Get Signature

> **get** **color**(): `playercolor`

Defined in: [handles/player.ts:58](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L58)

Gets the colour the game shows the player in.

##### Native

[GetPlayerColor](/typings/3.0.0/functions/GetPlayerColor) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetPlayerColor))

##### Returns

`playercolor`

The colour, such as `PLAYER_COLOR_RED`.

#### Set Signature

> **set** **color**(`color`): `void`

Defined in: [handles/player.ts:49](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L49)

Sets the colour the game shows the player in, such as
`PLAYER_COLOR_BLUE`: their name, and the units created from now on.

##### Remarks

The units the player owns already keep their colour: set theirs one by
one.

##### Native

[SetPlayerColor](/typings/3.0.0/functions/SetPlayerColor) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetPlayerColor))

##### Parameters

###### color

`playercolor`

##### Returns

`void`

***

### controller

#### Get Signature

> **get** **controller**(): `mapcontrol`

Defined in: [handles/player.ts:68](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L68)

Gets who controls the player's slot.

##### Native

[GetPlayerController](/typings/3.0.0/functions/GetPlayerController) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetPlayerController))

##### Returns

`mapcontrol`

The controller, such as `MAP_CONTROL_USER` for a person or
`MAP_CONTROL_COMPUTER` for the computer.

#### Set Signature

> **set** **controller**(`controlType`): `void`

Defined in: [handles/player.ts:79](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L79)

Sets who controls the player's slot, such as `MAP_CONTROL_COMPUTER`.

##### Remarks

It is meant for the map's `config` function, which the game runs while
it sets up the lobby.

##### Native

[SetPlayerController](/typings/3.0.0/functions/SetPlayerController) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetPlayerController))

##### Parameters

###### controlType

`mapcontrol`

##### Returns

`void`

***

### handicap

#### Get Signature

> **get** **handicap**(): `number`

Defined in: [handles/player.ts:89](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L89)

Gets the player's handicap: the share of their units' maximum life they
get.

##### Native

[GetPlayerHandicap](/typings/3.0.0/functions/GetPlayerHandicap) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetPlayerHandicap))

##### Returns

`number`

The share, 1 when there is no handicap.

#### Set Signature

> **set** **handicap**(`handicap`): `void`

Defined in: [handles/player.ts:98](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L98)

Sets the player's handicap: the share of their units' maximum life they
get; 1 is no handicap.

##### Native

[SetPlayerHandicap](/typings/3.0.0/functions/SetPlayerHandicap) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetPlayerHandicap))

##### Parameters

###### handicap

`number`

##### Returns

`void`

***

### handicapDamage

#### Get Signature

> **get** **handicapDamage**(): `number`

Defined in: [handles/player.ts:108](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L108)

Gets the player's damage handicap: the share of their units' damage they
deal.

##### Native

[GetPlayerHandicapDamage](/typings/3.0.0/functions/GetPlayerHandicapDamage) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetPlayerHandicapDamage))

##### Returns

`number`

The share, 1 when there is no handicap.

#### Set Signature

> **set** **handicapDamage**(`handicap`): `void`

Defined in: [handles/player.ts:117](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L117)

Sets the player's damage handicap: the share of their units' damage they
deal; 1 is no handicap.

##### Native

[SetPlayerHandicapDamage](/typings/3.0.0/functions/SetPlayerHandicapDamage) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetPlayerHandicapDamage))

##### Parameters

###### handicap

`number`

##### Returns

`void`

***

### handicapReviveTime

#### Get Signature

> **get** **handicapReviveTime**(): `number`

Defined in: [handles/player.ts:127](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L127)

Gets the player's revive time handicap: the factor applied to the time
their heroes take to revive.

##### Native

[GetPlayerHandicapReviveTime](/typings/3.0.0/functions/GetPlayerHandicapReviveTime) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetPlayerHandicapReviveTime))

##### Returns

`number`

The factor, 1 when there is no handicap.

#### Set Signature

> **set** **handicapReviveTime**(`handicap`): `void`

Defined in: [handles/player.ts:136](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L136)

Sets the player's revive time handicap: the factor applied to the time
their heroes take to revive; 1 is no handicap.

##### Native

[SetPlayerHandicapReviveTime](/typings/3.0.0/functions/SetPlayerHandicapReviveTime) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetPlayerHandicapReviveTime))

##### Parameters

###### handicap

`number`

##### Returns

`void`

***

### handicapXp

#### Get Signature

> **get** **handicapXp**(): `number`

Defined in: [handles/player.ts:146](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L146)

Gets the player's experience handicap: the share of the experience their
heroes gain.

##### Native

[GetPlayerHandicapXP](/typings/3.0.0/functions/GetPlayerHandicapXP) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetPlayerHandicapXP))

##### Returns

`number`

The share, 1 when there is no handicap.

#### Set Signature

> **set** **handicapXp**(`handicap`): `void`

Defined in: [handles/player.ts:155](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L155)

Sets the player's experience handicap: the share of the experience their
heroes gain; 1 is no handicap.

##### Native

[SetPlayerHandicapXP](/typings/3.0.0/functions/SetPlayerHandicapXP) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetPlayerHandicapXP))

##### Parameters

###### handicap

`number`

##### Returns

`void`

***

### id

#### Get Signature

> **get** **id**(): `number`

Defined in: [handles/player.ts:168](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L168)

Gets the player's slot number, the index [MapPlayer.fromIndex](#fromindex) and
the Native `Player` take.

##### Remarks

Unlike the `id` of every other Wrapper, it is not the handle id.

##### Native

[GetPlayerId](/typings/3.0.0/functions/GetPlayerId) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetPlayerId))

##### Returns

`number`

The slot number, from 0: 0 for the first slot (red), 1 for the
second (blue).

#### Overrides

[`Handle`](Handle.md).[`id`](Handle.md#id)

***

### name

#### Get Signature

> **get** **name**(): `string`

Defined in: [handles/player.ts:177](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L177)

Gets the name the game shows for the player.

##### Native

[GetPlayerName](/typings/3.0.0/functions/GetPlayerName) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetPlayerName))

##### Returns

`string`

The name, or an empty string when the game gives none.

#### Set Signature

> **set** **name**(`value`): `void`

Defined in: [handles/player.ts:185](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L185)

Sets the name the game shows for the player, on every client.

##### Native

[SetPlayerName](/typings/3.0.0/functions/SetPlayerName) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetPlayerName))

##### Parameters

###### value

`string`

##### Returns

`void`

***

### race

#### Get Signature

> **get** **race**(): `race`

Defined in: [handles/player.ts:195](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L195)

Gets the race the player plays in this game.

##### Native

[GetPlayerRace](/typings/3.0.0/functions/GetPlayerRace) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetPlayerRace))

##### Returns

`race`

The race, such as `RACE_HUMAN`; for a player who picked random
in the lobby, the race the game drew.

***

### slotState

#### Get Signature

> **get** **slotState**(): `playerslotstate`

Defined in: [handles/player.ts:206](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L206)

Gets whether the player's slot is in the game.

##### Native

[GetPlayerSlotState](/typings/3.0.0/functions/GetPlayerSlotState) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetPlayerSlotState))

##### Returns

`playerslotstate`

`PLAYER_SLOT_STATE_PLAYING` for a player in the game,
`PLAYER_SLOT_STATE_LEFT` for one who left, `PLAYER_SLOT_STATE_EMPTY` for
an empty slot.

***

### startLocation

#### Get Signature

> **get** **startLocation**(): `number`

Defined in: [handles/player.ts:217](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L217)

Gets the index of the player's start location, among the start
locations the map places.

##### Native

[GetPlayerStartLocation](/typings/3.0.0/functions/GetPlayerStartLocation) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetPlayerStartLocation))

##### Returns

`number`

The index: by default the player's slot number when the map
gives the slot a start location, and -1 when it gives none.

#### Set Signature

> **set** **startLocation**(`startLocIndex`): `void`

Defined in: [handles/player.ts:228](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L228)

Sets which of the map's start locations the player starts at, by index.

##### Remarks

It is meant for the map's `config` function, which the game runs while
it sets up the lobby.

##### Native

[SetPlayerStartLocation](/typings/3.0.0/functions/SetPlayerStartLocation) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetPlayerStartLocation))

##### Parameters

###### startLocIndex

`number`

##### Returns

`void`

***

### startLocationX

#### Get Signature

> **get** **startLocationX**(): `number`

Defined in: [handles/player.ts:238](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L238)

Gets the x-coordinate of the player's start location.

##### Native

[GetPlayerStartLocation](/typings/3.0.0/functions/GetPlayerStartLocation) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetPlayerStartLocation))

##### Native

[GetStartLocationX](/typings/3.0.0/functions/GetStartLocationX) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetStartLocationX))

##### Returns

`number`

The x-coordinate, in world units.

***

### startLocationY

#### Get Signature

> **get** **startLocationY**(): `number`

Defined in: [handles/player.ts:248](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L248)

Gets the y-coordinate of the player's start location.

##### Native

[GetPlayerStartLocation](/typings/3.0.0/functions/GetPlayerStartLocation) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetPlayerStartLocation))

##### Native

[GetStartLocationY](/typings/3.0.0/functions/GetStartLocationY) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetStartLocationY))

##### Returns

`number`

The y-coordinate, in world units.

***

### team

#### Get Signature

> **get** **team**(): `number`

Defined in: [handles/player.ts:277](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L277)

Gets the number of the team the player is on.

##### Native

[GetPlayerTeam](/typings/3.0.0/functions/GetPlayerTeam) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetPlayerTeam))

##### Returns

`number`

The team number, from 0.

#### Set Signature

> **set** **team**(`whichTeam`): `void`

Defined in: [handles/player.ts:285](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L285)

Sets the number of the team the player is on, from 0.

##### Native

[SetPlayerTeam](/typings/3.0.0/functions/SetPlayerTeam) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetPlayerTeam))

##### Parameters

###### whichTeam

`number`

##### Returns

`void`

***

### tournamentScore

#### Get Signature

> **get** **tournamentScore**(): `number`

Defined in: [handles/player.ts:295](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L295)

Gets the player's tournament score, which the melee rules compare to pick
the winner when a tournament game's time limit runs out.

##### Native

[GetTournamentScore](/typings/3.0.0/functions/GetTournamentScore) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetTournamentScore))

##### Returns

`number`

The score, a whole number.

***

### townHallCount

#### Get Signature

> **get** **townHallCount**(): `number`

Defined in: [handles/player.ts:306](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L306)

Gets the player's town halls, counted by tier: a tier 1 hall counts 1, a
tier 2 hall 2, a tier 3 hall 3.

##### Native

[BlzGetPlayerTownHallCount](/typings/3.0.0/functions/BlzGetPlayerTownHallCount) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetPlayerTownHallCount))

##### Returns

`number`

The sum of the tiers of the player's town halls, 0 when they
have none.

## Methods

### addTechResearched()

> **addTechResearched**(`techId`, `levels`): `void`

Defined in: [handles/player.ts:318](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L318)

Raises the research level of one of the player's techs by `levels`.

#### Parameters

##### techId

`Rawcode`\<`"unit"` \| `"upgrade"`\>

The tech's rawcode: an upgrade's, such as Iron Plating's,
`FourCC("Rhar")`, or a unit type's, such as the Footman's,
`FourCC("hfoo")`.

##### levels

`number`

How many levels to add to its current level.

#### Returns

`void`

#### Native

[AddPlayerTechResearched](/typings/3.0.0/functions/AddPlayerTechResearched) ([jassbot](https://lep.duckdns.org/jassbot/doc/AddPlayerTechResearched))

***

### cacheHeroData()

> **cacheHeroData**(): `void`

Defined in: [handles/player.ts:348](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L348)

Stores the levels of the player's heroes for the score screen. A melee
game calls it before it hands a defeated player's units to Neutral
Passive.

#### Returns

`void`

#### Native

[CachePlayerHeroData](/typings/3.0.0/functions/CachePlayerHeroData) ([jassbot](https://lep.duckdns.org/jassbot/doc/CachePlayerHeroData))

***

### commandAI()

> **commandAI**(`command`, `data`): `void`

Defined in: [handles/player.ts:359](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L359)

Sends a command to the player's AI script, which reads it with
`GetLastCommand` and `GetLastData`.

#### Parameters

##### command

`number`

The command number, as the AI script defines it.

##### data

`number`

The number sent with the command.

#### Returns

`void`

#### Native

[CommandAI](/typings/3.0.0/functions/CommandAI) ([jassbot](https://lep.duckdns.org/jassbot/doc/CommandAI))

***

### compareAlliance()

> **compareAlliance**(`otherPlayer`, `whichAllianceSetting`): `boolean`

Defined in: [handles/player.ts:371](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L371)

Checks whether the player grants `otherPlayer` one alliance setting.

#### Parameters

##### otherPlayer

`MapPlayer`

The player who would receive the setting.

##### whichAllianceSetting

`alliancetype`

The setting, such as
`ALLIANCE_SHARED_VISION`.

#### Returns

`boolean`

`true` when the player grants it.

#### Native

[GetPlayerAlliance](/typings/3.0.0/functions/GetPlayerAlliance) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetPlayerAlliance))

***

### coordsFogged()

> **coordsFogged**(`x`, `y`): `boolean`

Defined in: [handles/player.ts:390](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L390)

Checks whether a point is under the fog of war for the player: explored,
but not in sight now.

#### Parameters

##### x

`number`

The x-coordinate, in world units.

##### y

`number`

The y-coordinate, in world units.

#### Returns

`boolean`

`true` when the point is fogged.

#### Native

[IsFoggedToPlayer](/typings/3.0.0/functions/IsFoggedToPlayer) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsFoggedToPlayer))

***

### coordsMasked()

> **coordsMasked**(`x`, `y`): `boolean`

Defined in: [handles/player.ts:402](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L402)

Checks whether a point is under the black mask for the player: never
explored.

#### Parameters

##### x

`number`

The x-coordinate, in world units.

##### y

`number`

The y-coordinate, in world units.

#### Returns

`boolean`

`true` when the point is masked.

#### Native

[IsMaskedToPlayer](/typings/3.0.0/functions/IsMaskedToPlayer) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsMaskedToPlayer))

***

### coordsVisible()

> **coordsVisible**(`x`, `y`): `boolean`

Defined in: [handles/player.ts:413](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L413)

Checks whether a point is in sight of the player now.

#### Parameters

##### x

`number`

The x-coordinate, in world units.

##### y

`number`

The y-coordinate, in world units.

#### Returns

`boolean`

`true` when the player sees the point.

#### Native

[IsVisibleToPlayer](/typings/3.0.0/functions/IsVisibleToPlayer) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsVisibleToPlayer))

***

### cripple()

> **cripple**(`toWhichPlayers`, `flag`): `void`

Defined in: [handles/player.ts:427](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L427)

Shows the player's remaining buildings to a force, lifting the black
mask over them as though their area were explored.

#### Parameters

##### toWhichPlayers

[`Force`](Force.md)

The players who get to see the buildings.

##### flag

`boolean`

`true` to reveal the buildings. `false` stops revealing
them, but does not put the black mask back over them.

#### Returns

`void`

#### Remarks

It reveals the buildings whether or not the player still has a
town hall.

#### Native

[CripplePlayer](/typings/3.0.0/functions/CripplePlayer) ([jassbot](https://lep.duckdns.org/jassbot/doc/CripplePlayer))

***

### decTechResearched()

> **decTechResearched**(`techId`, `levels`): `void`

Defined in: [handles/player.ts:335](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L335)

Lowers the research level of one of the player's techs by `levels`.

#### Parameters

##### techId

`Rawcode`\<`"unit"` \| `"upgrade"`\>

The tech's rawcode: an upgrade's, such as Iron Plating's,
`FourCC("Rhar")`, or a unit type's, such as the Footman's,
`FourCC("hfoo")`.

##### levels

`number`

How many levels to remove from its current level. A
negative count adds none: raise a level with
[MapPlayer.addTechResearched](#addtechresearched).

#### Returns

`void`

#### Native

[BlzDecPlayerTechResearched](/typings/3.0.0/functions/BlzDecPlayerTechResearched) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzDecPlayerTechResearched))

***

### displayChatMessage()

> **displayChatMessage**(`recipient`, `message`): `void`

Defined in: [handles/player.ts:443](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L443)

Shows `message` in the chat as a message this player sent. This player
is the sender, not the viewer: the message shows on every client that
runs the call, so [MapPlayer.runLocal](#runlocal) shows it to one player.

#### Parameters

##### recipient

`number`

The chat channel the message is labelled with: 0 for
all, 1 for allies, 2 for observers, 3 or more for private. It does not
change who sees the message.

##### message

`string`

The text, which may hold colour codes.

#### Returns

`void`

#### Remarks

The chat log (F12) does not keep the message.

#### Native

[BlzDisplayChatMessage](/typings/3.0.0/functions/BlzDisplayChatMessage) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzDisplayChatMessage))

***

### displayText()

> **displayText**(`x`, `y`, `message`): `void`

Defined in: [handles/player.ts:457](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L457)

Shows `message` on the player's screen for a time that grows with its
length. The game formats the string: a lone `%` garbles it.

#### Parameters

##### x

`number`

The horizontal position of the text box, from 0 to 1; 0 is
the default. It moves the lines already shown too.

##### y

`number`

The vertical position of the text box, from 0 to 1; 0 is the
default.

##### message

`string`

The text, which may hold colour codes.

#### Returns

`void`

#### Native

[DisplayTextToPlayer](/typings/3.0.0/functions/DisplayTextToPlayer) ([jassbot](https://lep.duckdns.org/jassbot/doc/DisplayTextToPlayer))

***

### displayTimedText()

> **displayTimedText**(`x`, `y`, `duration`, `message`): `void`

Defined in: [handles/player.ts:472](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L472)

Shows `message` on the player's screen for `duration` seconds. The game
formats the string: a lone `%` garbles it.

#### Parameters

##### x

`number`

The horizontal position of the text box, from 0 to 1; 0 is
the default.

##### y

`number`

The vertical position of the text box, from 0 to 1; 0 is the
default.

##### duration

`number`

How long the text shows, in seconds.

##### message

`string`

The text, which may hold colour codes.

#### Returns

`void`

#### Native

[DisplayTimedTextToPlayer](/typings/3.0.0/functions/DisplayTimedTextToPlayer) ([jassbot](https://lep.duckdns.org/jassbot/doc/DisplayTimedTextToPlayer))

***

### displayTimedTextFrom()

> **displayTimedTextFrom**(`x`, `y`, `duration`, `message`): `void`

Defined in: [handles/player.ts:497](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L497)

Shows `message` on every player's screen for `duration` seconds, with
the first `%s` in it replaced by this player's name, as the game's own
"has left the game" line does.

#### Parameters

##### x

`number`

The horizontal position of the text box, from 0 to 1; 0 is
the default.

##### y

`number`

The vertical position of the text box, from 0 to 1; 0 is the
default.

##### duration

`number`

How long the text shows, in seconds.

##### message

`string`

The text, with at most one `%s` for the player's name.

#### Returns

`void`

#### Remarks

The game formats the string: only the first `%s` is replaced, and a
second `%s`, any other `%` code or a lone `%` shows garbage; jassdoc
reports that a second `%s` can crash the game in Lua.

#### Native

[DisplayTimedTextFromPlayer](/typings/3.0.0/functions/DisplayTimedTextFromPlayer) ([jassbot](https://lep.duckdns.org/jassbot/doc/DisplayTimedTextFromPlayer))

***

### forceStartLocation()

> **forceStartLocation**(`startLocIndex`): `void`

Defined in: [handles/player.ts:516](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L516)

Fixes the player's start location and marks it taken, so the random
placement of the other players skips it.

#### Parameters

##### startLocIndex

`number`

The index of the start location, among those the
map places.

#### Returns

`void`

#### Remarks

It is meant for the map's `config` function, which the game runs while
it sets up the lobby.

#### Native

[ForcePlayerStartLocation](/typings/3.0.0/functions/ForcePlayerStartLocation) ([jassbot](https://lep.duckdns.org/jassbot/doc/ForcePlayerStartLocation))

***

### getScore()

> **getScore**(`whichPlayerScore`): `number`

Defined in: [handles/player.ts:527](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L527)

Gets one of the player's scores, as the score screen shows them.

#### Parameters

##### whichPlayerScore

`playerscore`

The score, such as
`PLAYER_SCORE_UNITS_KILLED`.

#### Returns

`number`

The score's value.

#### Native

[GetPlayerScore](/typings/3.0.0/functions/GetPlayerScore) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetPlayerScore))

***

### getStartLocationPoint()

> **getStartLocationPoint**(): [`Point`](Point.md)

Defined in: [handles/player.ts:268](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L268)

Gets the player's start location as a new point, which the caller destroys.

#### Returns

[`Point`](Point.md)

A new point at the player's start location.

#### Remarks

[MapPlayer.startLocationX](#startlocationx) and [MapPlayer.startLocationY](#startlocationy)
read the coordinates without creating anything. In w3ts 3.x this was the
`startLocationPoint` accessor, which returned the raw `location` Handle
the caller removed with `RemoveLocation`, or `undefined` when the game
returned none; it now returns a Point, and throws when the game returns
none.

#### Throws

When the game returns no handle: `reforged-ts: failed to create Point`,
at the calling line. In Dev mode, also before the globals Init stage and
inside `MapPlayer.runLocal`.

#### Native

[GetPlayerStartLocation](/typings/3.0.0/functions/GetPlayerStartLocation) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetPlayerStartLocation))

#### Native

[GetStartLocationLoc](/typings/3.0.0/functions/GetStartLocationLoc) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetStartLocationLoc))

***

### getState()

> **getState**(`whichPlayerState`): `number`

Defined in: [handles/player.ts:538](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L538)

Gets one of the player's state values, such as their gold.

#### Parameters

##### whichPlayerState

`playerstate`

The value, such as
`PLAYER_STATE_RESOURCE_GOLD`.

#### Returns

`number`

The value, a whole number.

#### Native

[GetPlayerState](/typings/3.0.0/functions/GetPlayerState) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetPlayerState))

***

### getStructureCount()

> **getStructureCount**(`includeIncomplete`): `number`

Defined in: [handles/player.ts:549](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L549)

Counts the player's buildings.

#### Parameters

##### includeIncomplete

`boolean`

Whether buildings still under construction
count.

#### Returns

`number`

The number of buildings.

#### Native

[GetPlayerStructureCount](/typings/3.0.0/functions/GetPlayerStructureCount) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetPlayerStructureCount))

***

### getTaxRate()

> **getTaxRate**(`otherPlayer`, `whichResource`): `number`

Defined in: [handles/player.ts:565](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L565)

Gets the share of one resource the player gathers that goes to
`otherPlayer`.

#### Parameters

##### otherPlayer

`MapPlayer`

The player who receives it.

##### whichResource

`playerstate`

`PLAYER_STATE_RESOURCE_GOLD` or
`PLAYER_STATE_RESOURCE_LUMBER`.

#### Returns

`number`

The rate, in percent.

#### Remarks

In w3ts 3.x `otherPlayer` was the raw `player` Handle; it is now the
`MapPlayer`, as [MapPlayer.setTaxRate](#settaxrate) takes it.

#### Native

[GetPlayerTaxRate](/typings/3.0.0/functions/GetPlayerTaxRate) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetPlayerTaxRate))

***

### getTechCount()

> **getTechCount**(`techId`, `specificonly`): `number`

Defined in: [handles/player.ts:583](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L583)

Gets the player's level of a tech: an upgrade's research level, or how
many units of a type the player controls.

#### Parameters

##### techId

`Rawcode`\<`"unit"` \| `"upgrade"`\>

The tech's rawcode: an upgrade's, such as Iron Plating's,
`FourCC("Rhar")`, a unit type's, such as the Footman's, `FourCC("hfoo")`,
or an equivalent's, such as any hero's, `FourCC("HERO")`, or a tier 1
town hall's, `FourCC("TWN1")`.

##### specificonly

`boolean`

`true` to count exact matches only; `false` to also
count what the tech tree treats as the same, such as a higher tier town
hall for a lower one.

#### Returns

`number`

The upgrade's level, 0 when not researched, or the number of
units.

#### Native

[GetPlayerTechCount](/typings/3.0.0/functions/GetPlayerTechCount) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetPlayerTechCount))

***

### getTechMaxAllowed()

> **getTechMaxAllowed**(`techId`): `number`

Defined in: [handles/player.ts:598](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L598)

Gets the player's limit on a tech: the most units of a type they may
have, or the highest level of an upgrade they may research.

#### Parameters

##### techId

`Rawcode`\<`"unit"` \| `"upgrade"`\>

The unit type's or upgrade's rawcode, such as the
Footman's, `FourCC("hfoo")`.

#### Returns

`number`

The limit; a very large number when none was set.

#### Native

[GetPlayerTechMaxAllowed](/typings/3.0.0/functions/GetPlayerTechMaxAllowed) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetPlayerTechMaxAllowed))

***

### getTechResearched()

> **getTechResearched**(`techId`, `specificonly`): `boolean`

Defined in: [handles/player.ts:613](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L613)

Checks whether the player has researched an upgrade, or has a unit of a
type.

#### Parameters

##### techId

`Rawcode`\<`"unit"` \| `"upgrade"`\>

The tech's rawcode, such as Iron Plating's,
`FourCC("Rhar")`.

##### specificonly

`boolean`

`true` to count exact matches only; `false` to also
count what the tech tree treats as the same, as
[MapPlayer.getTechCount](#gettechcount) does.

#### Returns

`boolean`

`true` when the player has it.

#### Native

[GetPlayerTechResearched](/typings/3.0.0/functions/GetPlayerTechResearched) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetPlayerTechResearched))

***

### getUnitCount()

> **getUnitCount**(`includeIncomplete`): `number`

Defined in: [handles/player.ts:627](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L627)

Counts the player's units.

#### Parameters

##### includeIncomplete

`boolean`

Whether units still in training or under
construction count.

#### Returns

`number`

The number of units.

#### Native

[GetPlayerUnitCount](/typings/3.0.0/functions/GetPlayerUnitCount) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetPlayerUnitCount))

***

### getUnitCountByType()

> **getUnitCountByType**(`unitName`, `includeIncomplete`, `includeUpgrades`): `number`

Defined in: [handles/player.ts:641](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L641)

Counts the player's units of one type.

#### Parameters

##### unitName

`string`

The unit type's internal name, such as `"footman"`
for the Footman, `FourCC("hfoo")`, not its rawcode or its localized name.

##### includeIncomplete

`boolean`

Whether units still in training or under
construction count.

##### includeUpgrades

`boolean`

Whether the units this type upgrades into count.

#### Returns

`number`

The number of units.

#### Native

[GetPlayerTypedUnitCount](/typings/3.0.0/functions/GetPlayerTypedUnitCount) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetPlayerTypedUnitCount))

***

### inForce()

> **inForce**(`whichForce`): `boolean`

Defined in: [handles/player.ts:660](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L660)

Checks whether the player is in a force.

#### Parameters

##### whichForce

[`Force`](Force.md)

The force to look in.

#### Returns

`boolean`

`true` when the player is in it.

#### Native

[IsPlayerInForce](/typings/3.0.0/functions/IsPlayerInForce) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsPlayerInForce))

***

### isLocal()

> **isLocal**(): `boolean`

Defined in: [handles/player.ts:676](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L676)

**`Async`**

Checks whether this is the local player: the player of the client
running the code.

#### Returns

`boolean`

`true` on this player's client, `false` on every other.

#### Remarks

The result differs between clients: let it decide visuals only, never
game state. [MapPlayer.runLocal](#runlocal) runs code for one player.

#### Example

**A text tag its owner alone sees**

```ts
// Telling the local player apart. `isLocal` and `fromLocal` answer
// differently on each client, so they choose what that client shows and
// never what the game does: the text tag below exists on every client and
// is visible on one. MapPlayer.runLocal wraps the common case, a block of
// visuals for one player.
import { Init, MapPlayer, TextTag } from "reforged-ts";

Init.onGameStart(() => {
  const owner = MapPlayer.fromIndex(0);
  if (owner === undefined) {
    return;
  }
  const label = TextTag.create();
  label.setText("Your base", 12, true);
  label.setPos(0, 0, 64);
  label.setVisible(owner.isLocal());

  const local = MapPlayer.fromLocal();
  print(local === owner ? "Defend your base" : `Attack ${owner.name}'s base`);
});
```

#### Native

[GetLocalPlayer](/typings/3.0.0/functions/GetLocalPlayer) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetLocalPlayer))

***

### isObserver()

> **isObserver**(): `boolean`

Defined in: [handles/player.ts:686](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L686)

Checks whether the player watches the game as an observer instead of
playing it.

#### Returns

`boolean`

`true` for an observer.

#### Native

[IsPlayerObserver](/typings/3.0.0/functions/IsPlayerObserver) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsPlayerObserver))

***

### isPlayerAlly()

> **isPlayerAlly**(`otherPlayer`): `boolean`

Defined in: [handles/player.ts:696](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L696)

Checks whether the player is allied to `otherPlayer`.

#### Parameters

##### otherPlayer

`MapPlayer`

The other player.

#### Returns

`boolean`

`true` when they are allies.

#### Native

[IsPlayerAlly](/typings/3.0.0/functions/IsPlayerAlly) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsPlayerAlly))

***

### isPlayerEnemy()

> **isPlayerEnemy**(`otherPlayer`): `boolean`

Defined in: [handles/player.ts:706](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L706)

Checks whether the player is an enemy of `otherPlayer`.

#### Parameters

##### otherPlayer

`MapPlayer`

The other player.

#### Returns

`boolean`

`true` when they are enemies.

#### Native

[IsPlayerEnemy](/typings/3.0.0/functions/IsPlayerEnemy) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsPlayerEnemy))

***

### isRacePrefSet()

> **isRacePrefSet**(`pref`): `boolean`

Defined in: [handles/player.ts:716](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L716)

Checks whether the player's race preference is `pref`.

#### Parameters

##### pref

`racepreference`

The preference, such as `RACE_PREF_HUMAN`.

#### Returns

`boolean`

`true` when it is set.

#### Native

[IsPlayerRacePrefSet](/typings/3.0.0/functions/IsPlayerRacePrefSet) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsPlayerRacePrefSet))

***

### isSelectable()

> **isSelectable**(): `boolean`

Defined in: [handles/player.ts:726](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L726)

Checks whether the player may choose their race, as
[MapPlayer.setRaceSelectable](#setraceselectable) sets it.

#### Returns

`boolean`

`true` when they may.

#### Native

[GetPlayerSelectable](/typings/3.0.0/functions/GetPlayerSelectable) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetPlayerSelectable))

***

### pauseCompAI()

> **pauseCompAI**(`pause`): `void`

Defined in: [handles/player.ts:735](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L735)

Pauses or resumes the player's computer AI script.

#### Parameters

##### pause

`boolean`

`true` to pause it, `false` to resume it.

#### Returns

`void`

#### Native

[PauseCompAI](/typings/3.0.0/functions/PauseCompAI) ([jassbot](https://lep.duckdns.org/jassbot/doc/PauseCompAI))

***

### pointFogged()

> **pointFogged**(`whichPoint`): `boolean`

Defined in: [handles/player.ts:746](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L746)

Checks whether a point is under the fog of war for the player: explored,
but not in sight now.

#### Parameters

##### whichPoint

[`Point`](Point.md)

The point.

#### Returns

`boolean`

`true` when the point is fogged.

#### Native

[IsLocationFoggedToPlayer](/typings/3.0.0/functions/IsLocationFoggedToPlayer) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsLocationFoggedToPlayer))

***

### pointMasked()

> **pointMasked**(`whichPoint`): `boolean`

Defined in: [handles/player.ts:757](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L757)

Checks whether a point is under the black mask for the player: never
explored.

#### Parameters

##### whichPoint

[`Point`](Point.md)

The point.

#### Returns

`boolean`

`true` when the point is masked.

#### Native

[IsLocationMaskedToPlayer](/typings/3.0.0/functions/IsLocationMaskedToPlayer) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsLocationMaskedToPlayer))

***

### pointVisible()

> **pointVisible**(`whichPoint`): `boolean`

Defined in: [handles/player.ts:767](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L767)

Checks whether a point is in sight of the player now.

#### Parameters

##### whichPoint

[`Point`](Point.md)

The point.

#### Returns

`boolean`

`true` when the player sees the point.

#### Native

[IsLocationVisibleToPlayer](/typings/3.0.0/functions/IsLocationVisibleToPlayer) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsLocationVisibleToPlayer))

***

### remove()

> **remove**(`gameResult`): `void`

Defined in: [handles/player.ts:777](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L777)

Removes the player from the game with a result, as a victory or a
defeat does.

#### Parameters

##### gameResult

`playergameresult`

The result, such as `PLAYER_GAME_RESULT_DEFEAT`.

#### Returns

`void`

#### Native

[RemovePlayer](/typings/3.0.0/functions/RemovePlayer) ([jassbot](https://lep.duckdns.org/jassbot/doc/RemovePlayer))

***

### removeAllGuardPositions()

> **removeAllGuardPositions**(): `void`

Defined in: [handles/player.ts:786](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L786)

Clears the guard positions of the player's units, the places they return
to after a chase.

#### Returns

`void`

#### Native

[RemoveAllGuardPositions](/typings/3.0.0/functions/RemoveAllGuardPositions) ([jassbot](https://lep.duckdns.org/jassbot/doc/RemoveAllGuardPositions))

***

### setAbilityAvailable()

> **setAbilityAvailable**(`abilId`, `avail`): `void`

Defined in: [handles/player.ts:796](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L796)

Enables or disables an ability for every unit of the player.

#### Parameters

##### abilId

`Rawcode`\<`"ability"`\>

The ability's rawcode, such as Blizzard's, `FourCC("AHbz")`.

##### avail

`boolean`

`true` to enable it, `false` to disable it.

#### Returns

`void`

#### Native

[SetPlayerAbilityAvailable](/typings/3.0.0/functions/SetPlayerAbilityAvailable) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetPlayerAbilityAvailable))

***

### setAlliance()

> **setAlliance**(`otherPlayer`, `whichAllianceSetting`, `value`): `void`

Defined in: [handles/player.ts:810](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L810)

Grants `otherPlayer` one alliance setting from this player, or takes it
back. The players need not be allies.

#### Parameters

##### otherPlayer

`MapPlayer`

The player who receives the setting.

##### whichAllianceSetting

`alliancetype`

The setting, such as
`ALLIANCE_SHARED_VISION` to share this player's vision with
`otherPlayer`.

##### value

`boolean`

`true` to grant it, `false` to take it back.

#### Returns

`void`

#### Native

[SetPlayerAlliance](/typings/3.0.0/functions/SetPlayerAlliance) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetPlayerAlliance))

***

### setBlight()

> **setBlight**(`x`, `y`, `radius`, `addBlight`): `void`

Defined in: [handles/player.ts:831](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L831)

Adds or removes blight in a circle.

#### Parameters

##### x

`number`

The centre's x-coordinate, in world units.

##### y

`number`

The centre's y-coordinate, in world units.

##### radius

`number`

The radius, in world units.

##### addBlight

`boolean`

`true` to add blight, `false` to remove it.

#### Returns

`void`

#### Native

[SetBlight](/typings/3.0.0/functions/SetBlight) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetBlight))

***

### setBlightAtPoint()

> **setBlightAtPoint**(`where`, `radius`, `addBlight`): `void`

Defined in: [handles/player.ts:842](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L842)

Adds or removes blight in a circle around `where`.

#### Parameters

##### where

[`Point`](Point.md)

The centre.

##### radius

`number`

The radius, in world units.

##### addBlight

`boolean`

`true` to add blight, `false` to remove it.

#### Returns

`void`

#### Native

[SetBlightLoc](/typings/3.0.0/functions/SetBlightLoc) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetBlightLoc))

***

### setBlightPoint()

> **setBlightPoint**(`x`, `y`, `addBlight`): `void`

Defined in: [handles/player.ts:853](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L853)

Adds or removes blight at one point.

#### Parameters

##### x

`number`

The x-coordinate, in world units.

##### y

`number`

The y-coordinate, in world units.

##### addBlight

`boolean`

`true` to add blight, `false` to remove it.

#### Returns

`void`

#### Native

[SetBlightPoint](/typings/3.0.0/functions/SetBlightPoint) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetBlightPoint))

***

### setBlightRect()

> **setBlightRect**(`where`, `addBlight`): `void`

Defined in: [handles/player.ts:863](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L863)

Adds or removes blight over `where`.

#### Parameters

##### where

[`Rectangle`](Rectangle.md)

The area.

##### addBlight

`boolean`

`true` to add blight, `false` to remove it.

#### Returns

`void`

#### Native

[SetBlightRect](/typings/3.0.0/functions/SetBlightRect) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetBlightRect))

***

### setFogStateRadius()

> **setFogStateRadius**(`whichState`, `centerX`, `centerY`, `radius`, `useSharedVision`): `void`

Defined in: [handles/player.ts:878](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L878)

Sets the fog state over a circle for the player.

#### Parameters

##### whichState

`fogstate`

The state, such as `FOG_OF_WAR_VISIBLE`,
`FOG_OF_WAR_FOGGED` or `FOG_OF_WAR_MASKED`.

##### centerX

`number`

The centre's x-coordinate, in world units.

##### centerY

`number`

The centre's y-coordinate, in world units.

##### radius

`number`

The radius, in world units.

##### useSharedVision

`boolean`

Whether the players this player shares vision
with get the state too.

#### Returns

`void`

#### Native

[SetFogStateRadius](/typings/3.0.0/functions/SetFogStateRadius) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetFogStateRadius))

***

### setFogStateRadiusAtPoint()

> **setFogStateRadiusAtPoint**(`whichState`, `center`, `radius`, `useSharedVision`): `void`

Defined in: [handles/player.ts:905](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L905)

Sets the fog state over a circle around `center` for the player.

#### Parameters

##### whichState

`fogstate`

The state, such as `FOG_OF_WAR_VISIBLE`,
`FOG_OF_WAR_FOGGED` or `FOG_OF_WAR_MASKED`.

##### center

[`Point`](Point.md)

The centre.

##### radius

`number`

The radius, in world units.

##### useSharedVision

`boolean`

Whether the players this player shares vision
with get the state too.

#### Returns

`void`

#### Native

[SetFogStateRadiusLoc](/typings/3.0.0/functions/SetFogStateRadiusLoc) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetFogStateRadiusLoc))

***

### setFogStateRect()

> **setFogStateRect**(`whichState`, `where`, `useSharedVision`): `void`

Defined in: [handles/player.ts:929](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L929)

Sets the fog state over `where` for the player.

#### Parameters

##### whichState

`fogstate`

The state, such as `FOG_OF_WAR_VISIBLE`,
`FOG_OF_WAR_FOGGED` or `FOG_OF_WAR_MASKED`.

##### where

[`Rectangle`](Rectangle.md)

The area.

##### useSharedVision

`boolean`

Whether the players this player shares vision
with get the state too.

#### Returns

`void`

#### Native

[SetFogStateRect](/typings/3.0.0/functions/SetFogStateRect) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetFogStateRect))

***

### setOnScoreScreen()

> **setOnScoreScreen**(`flag`): `void`

Defined in: [handles/player.ts:942](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L942)

Shows or hides the player on the score screen at the end of the game.

#### Parameters

##### flag

`boolean`

`true` to show the player, `false` to hide them.

#### Returns

`void`

#### Native

[SetPlayerOnScoreScreen](/typings/3.0.0/functions/SetPlayerOnScoreScreen) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetPlayerOnScoreScreen))

***

### setRacePreference()

> **setRacePreference**(`whichRacePreference`): `void`

Defined in: [handles/player.ts:954](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L954)

Sets the player's race preference, the race they pick in the lobby.

#### Parameters

##### whichRacePreference

`racepreference`

The preference, such as `RACE_PREF_ORC`.

#### Returns

`void`

#### Remarks

It is meant for the map's `config` function, which the game runs while
it sets up the lobby.

#### Native

[SetPlayerRacePreference](/typings/3.0.0/functions/SetPlayerRacePreference) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetPlayerRacePreference))

***

### setRaceSelectable()

> **setRaceSelectable**(`value`): `void`

Defined in: [handles/player.ts:967](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L967)

Sets whether the player may choose a race; [MapPlayer.isSelectable](#isselectable)
reads it.

#### Parameters

##### value

`boolean`

`true` to let the player choose.

#### Returns

`void`

#### Remarks

It is meant for the map's `config` function, which the game runs while
it sets up the lobby.

#### Native

[SetPlayerRaceSelectable](/typings/3.0.0/functions/SetPlayerRaceSelectable) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetPlayerRaceSelectable))

***

### setRaceSkin()

> **setRaceSkin**(`pref`): `void`

Defined in: [handles/player.ts:976](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L976)

Sets the player's race skin, such as `RACE_PREF_FORSAKEN`.

#### Parameters

##### pref

`racepreference`

The race preference whose skin the player's units take.

#### Returns

`void`

#### Native

[SetPlayerRaceSkin](/typings/3.0.0/functions/SetPlayerRaceSkin) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetPlayerRaceSkin))

***

### setState()

> **setState**(`whichPlayerState`, `value`): `void`

Defined in: [handles/player.ts:987](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L987)

Sets one of the player's state values, such as their gold.

#### Parameters

##### whichPlayerState

`playerstate`

The value, such as
`PLAYER_STATE_RESOURCE_GOLD`.

##### value

`number`

The new value, a whole number.

#### Returns

`void`

#### Native

[SetPlayerState](/typings/3.0.0/functions/SetPlayerState) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetPlayerState))

***

### setTaxRate()

> **setTaxRate**(`otherPlayer`, `whichResource`, `rate`): `void`

Defined in: [handles/player.ts:1000](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L1000)

Sets the share of one resource the player gathers that goes to
`otherPlayer`.

#### Parameters

##### otherPlayer

`MapPlayer`

The player who receives it.

##### whichResource

`playerstate`

`PLAYER_STATE_RESOURCE_GOLD` or
`PLAYER_STATE_RESOURCE_LUMBER`.

##### rate

`number`

The rate, in percent, from 0 to 100.

#### Returns

`void`

#### Native

[SetPlayerTaxRate](/typings/3.0.0/functions/SetPlayerTaxRate) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetPlayerTaxRate))

***

### setTechMaxAllowed()

> **setTechMaxAllowed**(`techId`, `maximum`): `void`

Defined in: [handles/player.ts:1016](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L1016)

Limits a tech for the player: the most units of a type they may have,
or the highest level of an upgrade they may research.

#### Parameters

##### techId

`Rawcode`\<`"unit"` \| `"upgrade"`\>

The unit type's or upgrade's rawcode, such as the
Footman's, `FourCC("hfoo")`.

##### maximum

`number`

The limit: 0 forbids the tech, -1 lifts the limit.

#### Returns

`void`

#### Native

[SetPlayerTechMaxAllowed](/typings/3.0.0/functions/SetPlayerTechMaxAllowed) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetPlayerTechMaxAllowed))

***

### setTechResearched()

> **setTechResearched**(`techId`, `setToLevel`): `void`

Defined in: [handles/player.ts:1032](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L1032)

Sets the research level of one of the player's techs.

#### Parameters

##### techId

`Rawcode`\<`"unit"` \| `"upgrade"`\>

The tech's rawcode: an upgrade's, such as Iron Plating's,
`FourCC("Rhar")`, or a unit type's, such as the Footman's,
`FourCC("hfoo")`.

##### setToLevel

`number`

The research level the tech gets, whatever its
current level.

#### Returns

`void`

#### Native

[SetPlayerTechResearched](/typings/3.0.0/functions/SetPlayerTechResearched) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetPlayerTechResearched))

***

### setUnitsOwner()

> **setUnitsOwner**(`newOwner`): `void`

Defined in: [handles/player.ts:1045](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L1045)

Gives every unit of the player to another player.

#### Parameters

##### newOwner

`number`

The slot number of the player who receives them, as
[MapPlayer.id](#id) gives it.

#### Returns

`void`

#### Native

[SetPlayerUnitsOwner](/typings/3.0.0/functions/SetPlayerUnitsOwner) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetPlayerUnitsOwner))

***

### startCampaignAI()

> **startCampaignAI**(`script`): `void`

Defined in: [handles/player.ts:1055](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L1055)

Starts the campaign AI script `script` for the player.

#### Parameters

##### script

`string`

The AI script's path in the game files, such as
`Scripts\human.ai`.

#### Returns

`void`

#### Native

[StartCampaignAI](/typings/3.0.0/functions/StartCampaignAI) ([jassbot](https://lep.duckdns.org/jassbot/doc/StartCampaignAI))

***

### startMeleeAI()

> **startMeleeAI**(`script`): `void`

Defined in: [handles/player.ts:1065](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L1065)

Starts the melee AI script `script` for the player.

#### Parameters

##### script

`string`

The AI script's path in the game files, such as
`Scripts\human.ai`.

#### Returns

`void`

#### Native

[StartMeleeAI](/typings/3.0.0/functions/StartMeleeAI) ([jassbot](https://lep.duckdns.org/jassbot/doc/StartMeleeAI))

***

### fromDetecting()

> `static` **fromDetecting**(): `MapPlayer` \| `undefined`

Defined in: [handles/player.ts:1074](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L1074)

Gets the player who detected a unit, in a detection event.

#### Returns

`MapPlayer` \| `undefined`

The player, or `undefined` outside a detection event.

#### Native

[GetEventDetectingPlayer](/typings/3.0.0/functions/GetEventDetectingPlayer) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetEventDetectingPlayer))

***

### fromEnum()

> `static` **fromEnum**(): `MapPlayer` \| `undefined`

Defined in: [handles/player.ts:1084](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L1084)

Gets the player of the current step of a force enumeration, such as a
[Force.for](Force.md#for) callback.

#### Returns

`MapPlayer` \| `undefined`

The player, or `undefined` outside an enumeration callback.

#### Native

[GetEnumPlayer](/typings/3.0.0/functions/GetEnumPlayer) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetEnumPlayer))

***

### fromEvent()

> `static` **fromEvent**(): `MapPlayer` \| `undefined`

Defined in: [handles/player.ts:1094](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L1094)

Gets the player the running event is about, in a player event or a
player-unit event.

#### Returns

`MapPlayer` \| `undefined`

The player, or `undefined` outside an event that has one.

#### Native

[GetTriggerPlayer](/typings/3.0.0/functions/GetTriggerPlayer) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetTriggerPlayer))

***

### fromFilter()

> `static` **fromFilter**(): `MapPlayer` \| `undefined`

Defined in: [handles/player.ts:1104](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L1104)

Gets the player a force enumeration's filter is testing, such as in the
filter of [Force.enumPlayers](Force.md#enumplayers).

#### Returns

`MapPlayer` \| `undefined`

The player, or `undefined` outside a filter.

#### Native

[GetFilterPlayer](/typings/3.0.0/functions/GetFilterPlayer) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetFilterPlayer))

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

***

### fromIndex()

> `static` **fromIndex**(`index`): `MapPlayer` \| `undefined`

Defined in: [handles/player.ts:1115](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L1115)

Gets the player in slot `index`.

#### Parameters

##### index

`number`

The slot number, from 0 (red) to `bj_MAX_PLAYER_SLOTS`
minus 1; the neutral players hold the last slots.

#### Returns

`MapPlayer` \| `undefined`

The player, or `undefined` for an index outside the slots.

#### Native

[Player](/typings/3.0.0/functions/Player) ([jassbot](https://lep.duckdns.org/jassbot/doc/Player))

***

### fromLocal()

> `static` **fromLocal**(): `MapPlayer`

Defined in: [handles/player.ts:1138](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L1138)

**`Async`**

Gets the local player: the player of the client running the code.

#### Returns

`MapPlayer`

The local player, never `undefined`.

#### Remarks

- The result differs between clients: let it decide visuals only, never
  game state. [MapPlayer.runLocal](#runlocal) runs code for one player.
- `GetLocalPlayer` never returns nothing, which the Typings cannot
  express for the Wrapper, so this goes through the non-null lookup
  helper: typed non-null, and should the game ever break that invariant
  it throws instead of returning undefined.
- It prints nothing. In w3ts 3.x it printed ten lines on screen when the
  Native returned nothing; it throws now.

#### Example

**A text tag its owner alone sees**

```ts
// Telling the local player apart. `isLocal` and `fromLocal` answer
// differently on each client, so they choose what that client shows and
// never what the game does: the text tag below exists on every client and
// is visible on one. MapPlayer.runLocal wraps the common case, a block of
// visuals for one player.
import { Init, MapPlayer, TextTag } from "reforged-ts";

Init.onGameStart(() => {
  const owner = MapPlayer.fromIndex(0);
  if (owner === undefined) {
    return;
  }
  const label = TextTag.create();
  label.setText("Your base", 12, true);
  label.setPos(0, 0, 64);
  label.setVisible(owner.isLocal());

  const local = MapPlayer.fromLocal();
  print(local === owner ? "Defend your base" : `Attack ${owner.name}'s base`);
});
```

#### Throws

Should the game ever return no player:
`reforged-ts: failed to create MapPlayer`, at the calling line.

#### Native

[GetLocalPlayer](/typings/3.0.0/functions/GetLocalPlayer) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetLocalPlayer))

***

### fromPreviousOwner()

> `static` **fromPreviousOwner**(): `MapPlayer` \| `undefined`

Defined in: [handles/player.ts:1148](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L1148)

Gets the owner a unit had before an ownership change, in that event.

#### Returns

`MapPlayer` \| `undefined`

The previous owner, or `undefined` outside an ownership change
event.

#### Native

[GetChangingUnitPrevOwner](/typings/3.0.0/functions/GetChangingUnitPrevOwner) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetChangingUnitPrevOwner))

***

### fromTournamentFinishNow()

> `static` **fromTournamentFinishNow**(): `MapPlayer` \| `undefined`

Defined in: [handles/player.ts:1157](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L1157)

Gets the player who ended a tournament game early, in that event.

#### Returns

`MapPlayer` \| `undefined`

The player, or `undefined` outside that event.

#### Native

[GetTournamentFinishNowPlayer](/typings/3.0.0/functions/GetTournamentFinishNowPlayer) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetTournamentFinishNowPlayer))

***

### fromWinning()

> `static` **fromWinning**(): `MapPlayer` \| `undefined`

Defined in: [handles/player.ts:1166](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L1166)

Gets the winning player, in a victory event.

#### Returns

`MapPlayer` \| `undefined`

The player, or `undefined` outside a victory event.

#### Native

[GetWinningPlayer](/typings/3.0.0/functions/GetWinningPlayer) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetWinningPlayer))

***

### runLocal()

> `static` **runLocal**(`player`, `fn`): `void`

Defined in: [handles/player.ts:1197](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/player.ts#L1197)

**`Async`**

Runs `fn` on the client whose local player is `player`, and does nothing
on every other client: the one way to run code for one player, in place
of a `GetLocalPlayer()` comparison.

#### Parameters

##### player

`MapPlayer`

The player whose client runs `fn`.

##### fn

() => `void`

What to run there: visuals only.

#### Returns

`void`

#### Remarks

Only visuals belong inside `fn`: what it shows (text, frames,
sounds, camera, colours) may differ between clients, but anything that
changes game state runs on one client only and desyncs the game. With
Dev mode off this is the bare local-player comparison. In Dev mode `fn`
runs under pcall, so an error inside is reported on screen and printed
like a failing callback's
(`reforged-ts: MapPlayer#<id> MapPlayer.runLocal failed: <error>`), once
per function and message, and does not escape; and inside it creating or
destroying a Wrapper, `Group.for`, `Force.for` and the first
`Frame.fromName` of a frame raise
`reforged-ts: <action> inside MapPlayer.runLocal changes game state for one client, which desyncs the game: only visuals belong inside runLocal`.
A creation or destruction raises after its Native ran, so the Guard does
not undo it: it names the offending line while you test in Dev mode, so
the bug is found before a release build reaches a lobby.
Create what `fn` needs before calling `runLocal`, on every client.

#### Example

```ts
// A frame shown to one player only. The frame is created and looked up on
// every client; only the visual change runs inside runLocal.
import { Frame, Init, MapPlayer } from "reforged-ts";

let panel: Frame | undefined;

Init.onGameStart(() => {
  const gameUi = Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0);
  if (gameUi !== undefined) {
    panel = Frame.create("ScorePanel", gameUi, 0, 0);
    panel.visible = false;
  }
});

/** Shows the score panel to `player` alone. */
export function showPanel(player: MapPlayer): void {
  const frame = panel;
  if (frame === undefined) {
    return;
  }
  MapPlayer.runLocal(player, () => {
    frame.visible = true;
  });
}
```

#### Native

[GetLocalPlayer](/typings/3.0.0/functions/GetLocalPlayer) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetLocalPlayer))
