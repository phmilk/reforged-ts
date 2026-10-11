# Class: Sound

Defined in: [handles/sound.ts:21](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/sound.ts#L21)

A sound: a sound file with its playback settings, played everywhere or,
when created 3D, from a position on the map.

## Remarks

- The game loads a sound's file after `create`: a Sound started in the same
  instant it is created may stay silent. Create it ahead of time, and start
  it once `loading` is false.
- The members for positions, distances, cones and velocity apply to a
  Sound created with `is3D`.
- `duration`, `playing` and `getFileDuration` can differ between clients:
  never let them decide game state.
- The static members play the thematic music, which is not a Sound.

## Example

**Creating a sound ahead of time and playing it later**

```ts
// The new-quest chime one second into the game. The Sound is created at init,
// so the game has loaded its file by the time the Timer starts it;
// killWhenDone destroys it once it has played.
import { Init, Sound, Timer } from "reforged-ts";

Init.onTriggers(() => {
  const chime = Sound.create(
    "Sound\\Interface\\QuestNew.wav",
    false,
    false,
    false,
    10,
    10,
    "DefaultEAXON",
  );
  Timer.after(1, () => {
    chime.setVolume(127);
    chime.start();
    chime.killWhenDone();
  });
});
```

## Native

[sound](/typings/3.0.0/interfaces/sound) ([jassbot](https://lep.duckdns.org/jassbot/doc/sound))

## Extends

- [`Handle`](Handle.md)\<`sound`\>

## Properties

### handle

> `readonly` **handle**: `sound`

Defined in: [handles/handle.ts:132](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/handle.ts#L132)

The Handle this Wrapper owns, to pass to a Native the library does not
wrap.

#### Remarks

Do not keep it after `destroy()`: the game frees the object behind it.

#### Inherited from

[`Handle`](Handle.md).[`handle`](Handle.md#handle)

## Accessors

### dialogueSpeakerNameKey

#### Get Signature

> **get** **dialogueSpeakerNameKey**(): `string`

Defined in: [handles/sound.ts:188](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/sound.ts#L188)

Gets the key of the speaker's name the game shows when the sound plays
as a line of dialogue.

##### Native

[GetDialogueSpeakerNameKey](/typings/3.0.0/functions/GetDialogueSpeakerNameKey) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetDialogueSpeakerNameKey))

##### Returns

`string`

The key, or `""` when the sound has none.

#### Set Signature

> **set** **dialogueSpeakerNameKey**(`speakerName`): `void`

Defined in: [handles/sound.ts:197](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/sound.ts#L197)

The key of the speaker's name the game shows when the sound plays as a
line of dialogue.

##### Native

[SetDialogueSpeakerNameKey](/typings/3.0.0/functions/SetDialogueSpeakerNameKey) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetDialogueSpeakerNameKey))

##### Parameters

###### speakerName

`string`

##### Returns

`void`

***

### dialogueTextKey

#### Get Signature

> **get** **dialogueTextKey**(): `string`

Defined in: [handles/sound.ts:207](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/sound.ts#L207)

Gets the key of the text the game shows as a subtitle when the sound
plays as a line of dialogue.

##### Native

[GetDialogueTextKey](/typings/3.0.0/functions/GetDialogueTextKey) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetDialogueTextKey))

##### Returns

`string`

The key, or `""` when the sound has none.

#### Set Signature

> **set** **dialogueTextKey**(`dialogueText`): `void`

Defined in: [handles/sound.ts:216](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/sound.ts#L216)

The key of the text the game shows as a subtitle when the sound plays as
a line of dialogue.

##### Native

[SetDialogueTextKey](/typings/3.0.0/functions/SetDialogueTextKey) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetDialogueTextKey))

##### Parameters

###### dialogueText

`string`

##### Returns

`void`

***

### duration

#### Get Signature

> **get** **duration**(): `number`

Defined in: [handles/sound.ts:231](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/sound.ts#L231)

**`Async`**

Gets the length of the sound as the local client plays it.

##### Remarks

The value can differ between clients, for a voice file whose length
depends on the game's language: never let it decide game state.

##### Example

**A subtitle as long as the local voice line**

```ts
// A voice line whose subtitle stays on screen as long as the line plays.
// A voice file's length depends on the client's language, and whether a
// sound still plays is the local client's own: both decide what the player
// sees and hears, never game state, so no Timer is started from them.
import {
  Init,
  MapPlayer,
  on,
  PlayerEvents,
  Sound,
  tsGlobals,
} from "reforged-ts";

const LINE = "Sound\\Dialogue\\HumanCampaign\\Human01\\H01Uther01.flac";

/** Plays the line with its subtitle, unless it still plays on this client. */
export function playLine(voice: Sound): void {
  if (voice.playing) {
    return;
  }
  voice.start();
  // In milliseconds, as this client plays the line.
  const length =
    voice.duration > 0 ? voice.duration : Sound.getFileDuration(LINE);
  MapPlayer.fromLocal().displayTimedText(
    0,
    0,
    length / 1000,
    "Uther: For the Light!",
  );
}

Init.onTriggers(() => {
  const voice = Sound.create(LINE, false, false, false, 10, 10, "");
  // Every client registers the same chat event and plays the line.
  for (const player of tsGlobals.Players) {
    on(PlayerEvents.chat(player, "-uther", true), () => {
      playLine(voice);
    });
  }
});
```

##### Native

[GetSoundDuration](/typings/3.0.0/functions/GetSoundDuration) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetSoundDuration))

##### Returns

`number`

The length, in milliseconds.

#### Set Signature

> **set** **duration**(`duration`): `void`

Defined in: [handles/sound.ts:239](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/sound.ts#L239)

The length the game plays the sound for, in milliseconds.

##### Native

[SetSoundDuration](/typings/3.0.0/functions/SetSoundDuration) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetSoundDuration))

##### Parameters

###### duration

`number`

##### Returns

`void`

***

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

***

### loading

#### Get Signature

> **get** **loading**(): `boolean`

Defined in: [handles/sound.ts:248](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/sound.ts#L248)

Gets whether the game is still loading the sound's file.

##### Native

[GetSoundIsLoading](/typings/3.0.0/functions/GetSoundIsLoading) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetSoundIsLoading))

##### Returns

`boolean`

`true` while the file loads; the sound may not play until then.

***

### playing

#### Get Signature

> **get** **playing**(): `boolean`

Defined in: [handles/sound.ts:263](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/sound.ts#L263)

**`Async`**

Gets whether the sound is playing on the local client.

##### Remarks

The value can differ between clients: never let it decide game state.
Right after `start` it is still `false`.

##### Example

**A subtitle as long as the local voice line**

```ts
// A voice line whose subtitle stays on screen as long as the line plays.
// A voice file's length depends on the client's language, and whether a
// sound still plays is the local client's own: both decide what the player
// sees and hears, never game state, so no Timer is started from them.
import {
  Init,
  MapPlayer,
  on,
  PlayerEvents,
  Sound,
  tsGlobals,
} from "reforged-ts";

const LINE = "Sound\\Dialogue\\HumanCampaign\\Human01\\H01Uther01.flac";

/** Plays the line with its subtitle, unless it still plays on this client. */
export function playLine(voice: Sound): void {
  if (voice.playing) {
    return;
  }
  voice.start();
  // In milliseconds, as this client plays the line.
  const length =
    voice.duration > 0 ? voice.duration : Sound.getFileDuration(LINE);
  MapPlayer.fromLocal().displayTimedText(
    0,
    0,
    length / 1000,
    "Uther: For the Light!",
  );
}

Init.onTriggers(() => {
  const voice = Sound.create(LINE, false, false, false, 10, 10, "");
  // Every client registers the same chat event and plays the line.
  for (const player of tsGlobals.Players) {
    on(PlayerEvents.chat(player, "-uther", true), () => {
      playLine(voice);
    });
  }
});
```

##### Native

[GetSoundIsPlaying](/typings/3.0.0/functions/GetSoundIsPlaying) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetSoundIsPlaying))

##### Returns

`boolean`

`true` while the sound plays.

## Methods

### killWhenDone()

> **killWhenDone**(): `void`

Defined in: [handles/sound.ts:273](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/sound.ts#L273)

Makes the game destroy the sound once it has finished playing.

#### Returns

`void`

#### Example

**Sounds the game destroys itself**

```ts
// Sounds the game destroys itself. A one-off sound is started, then handed
// to killWhenDone: the game destroys it once it has played. A looping one
// is stopped with `stop(true, fadeOut)`, which destroys it as well. In both
// cases the Wrapper is not marked destroyed, so the library cannot catch a
// later use: drop every reference at once and never start the sound again.
import { Init, Sound, Timer } from "reforged-ts";

/** Plays `sound` once, then lets the game destroy it. */
export function playOnce(sound: Sound): void {
  sound.start();
  sound.killWhenDone();
}

let ambience: Sound | undefined;

/** Starts the looping rain ambience, unless it already plays. */
export function startRain(): void {
  if (ambience !== undefined) {
    return;
  }
  ambience = Sound.create(
    "Sound\\Ambient\\RainAmbience.flac",
    true,
    false,
    false,
    10,
    10,
    "",
  );
  ambience.start();
}

/** Fades the ambience out and destroys it; the reference goes first. */
export function stopRain(): void {
  const sound = ambience;
  ambience = undefined;
  sound?.stop(true, true);
}

Init.onTriggers(() => {
  // Created ahead, so the game has loaded the file when it plays.
  let chime: Sound | undefined = Sound.create(
    "Sound\\Interface\\QuestNew.wav",
    false,
    false,
    false,
    10,
    10,
    "",
  );
  Timer.after(1, () => {
    if (chime !== undefined) {
      playOnce(chime);
      chime = undefined;
    }
    startRain();
  });
  Timer.after(60, stopRain);
});
```

#### Native

[KillSoundWhenDone](/typings/3.0.0/functions/KillSoundWhenDone) ([jassbot](https://lep.duckdns.org/jassbot/doc/KillSoundWhenDone))

***

### registerStacked()

> **registerStacked**(`byPosition`, `rectWidth`, `rectHeight`): `void`

Defined in: [handles/sound.ts:286](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/sound.ts#L286)

Makes the sound an area sound, heard across a rectangle centred on its
position, as the editor's region sounds are.

#### Parameters

##### byPosition

`boolean`

Whether the area is placed at the sound's position;
Blizzard.j's region sounds pass `true`.

##### rectWidth

`number`

The width of the area, in world units.

##### rectHeight

`number`

The height of the area, in world units.

#### Returns

`void`

#### Native

[RegisterStackedSound](/typings/3.0.0/functions/RegisterStackedSound) ([jassbot](https://lep.duckdns.org/jassbot/doc/RegisterStackedSound))

***

### setChannel()

> **setChannel**(`channel`): `void`

Defined in: [handles/sound.ts:300](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/sound.ts#L300)

Sets the sound's channel, the category the game mixes it in, as the
sound editor's Channel setting numbers them.

#### Parameters

##### channel

`number`

The channel's number.

#### Returns

`void`

#### Native

[SetSoundChannel](/typings/3.0.0/functions/SetSoundChannel) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetSoundChannel))

***

### setConeAngles()

> **setConeAngles**(`inside`, `outside`, `outsideVolume`): `void`

Defined in: [handles/sound.ts:314](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/sound.ts#L314)

Sets the cone in which a 3D sound is heard at full volume, around the
direction of `setConeOrientation`.

#### Parameters

##### inside

`number`

The angle of the full-volume cone, in degrees.

##### outside

`number`

The angle of the outer cone, in degrees, where the volume
falls to `outsideVolume`.

##### outsideVolume

`number`

The volume outside the outer cone, from 0 to 127.

#### Returns

`void`

#### Remarks

It applies only to a Sound created with `is3D`.

#### Native

[SetSoundConeAngles](/typings/3.0.0/functions/SetSoundConeAngles) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetSoundConeAngles))

***

### setConeOrientation()

> **setConeOrientation**(`x`, `y`, `z`): `void`

Defined in: [handles/sound.ts:326](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/sound.ts#L326)

Points the cone of a 3D sound in a direction.

#### Parameters

##### x

`number`

The direction's x component.

##### y

`number`

The direction's y component.

##### z

`number`

The direction's z component.

#### Returns

`void`

#### Remarks

It applies only to a Sound created with `is3D`.

#### Native

[SetSoundConeOrientation](/typings/3.0.0/functions/SetSoundConeOrientation) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetSoundConeOrientation))

***

### setDistanceCutoff()

> **setDistanceCutoff**(`cutoff`): `void`

Defined in: [handles/sound.ts:335](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/sound.ts#L335)

Sets the distance from the camera beyond which a 3D sound is not heard.

#### Parameters

##### cutoff

`number`

The distance, in world units.

#### Returns

`void`

#### Native

[SetSoundDistanceCutoff](/typings/3.0.0/functions/SetSoundDistanceCutoff) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetSoundDistanceCutoff))

***

### setDistances()

> **setDistances**(`minDist`, `maxDist`): `void`

Defined in: [handles/sound.ts:349](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/sound.ts#L349)

Sets the distances over which a 3D sound fades with the camera's
distance.

#### Parameters

##### minDist

`number`

The distance within which the sound is at full volume,
in world units.

##### maxDist

`number`

The distance at which it reaches its lowest volume, in
world units.

#### Returns

`void`

#### Remarks

It applies only to a Sound created with `is3D`.

#### Native

[SetSoundDistances](/typings/3.0.0/functions/SetSoundDistances) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetSoundDistances))

***

### setFacialAnimationFilepath()

> **setFacialAnimationFilepath**(`animationSetFilepath`): `void`

Defined in: [handles/sound.ts:359](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/sound.ts#L359)

Sets the facial animation set that a Reforged portrait plays with the
sound.

#### Parameters

##### animationSetFilepath

`string`

The path of the facial animation set.

#### Returns

`void`

#### Native

[SetSoundFacialAnimationSetFilepath](/typings/3.0.0/functions/SetSoundFacialAnimationSetFilepath) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetSoundFacialAnimationSetFilepath))

***

### setFacialAnimationGroupLabel()

> **setFacialAnimationGroupLabel**(`groupLabel`): `void`

Defined in: [handles/sound.ts:369](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/sound.ts#L369)

Sets the group, in the facial animation set, of the animation played with
the sound.

#### Parameters

##### groupLabel

`string`

The group's label.

#### Returns

`void`

#### Native

[SetSoundFacialAnimationGroupLabel](/typings/3.0.0/functions/SetSoundFacialAnimationGroupLabel) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetSoundFacialAnimationGroupLabel))

***

### setFacialAnimationLabel()

> **setFacialAnimationLabel**(`animationLabel`): `void`

Defined in: [handles/sound.ts:378](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/sound.ts#L378)

Sets the facial animation, in its group, played with the sound.

#### Parameters

##### animationLabel

`string`

The animation's label.

#### Returns

`void`

#### Native

[SetSoundFacialAnimationLabel](/typings/3.0.0/functions/SetSoundFacialAnimationLabel) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetSoundFacialAnimationLabel))

***

### setParamsFromLabel()

> **setParamsFromLabel**(`soundLabel`): `void`

Defined in: [handles/sound.ts:389](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/sound.ts#L389)

Gives the sound the settings of an entry of the game's sound SLK files.

#### Parameters

##### soundLabel

`string`

The entry's label. The sound takes its settings, such
as the volume, pitch and pitch variance, priority, channel, minimum and
maximum distances, distance cutoff and EAX preset.

#### Returns

`void`

#### Native

[SetSoundParamsFromLabel](/typings/3.0.0/functions/SetSoundParamsFromLabel) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetSoundParamsFromLabel))

***

### setPitch()

> **setPitch**(`pitch`): `void`

Defined in: [handles/sound.ts:405](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/sound.ts#L405)

Sets the sound's pitch, which also changes how long it plays.

#### Parameters

##### pitch

`number`

The pitch ratio, where 1, the default, is the file's own
pitch.

#### Returns

`void`

#### Remarks

Above 1 the sound gets higher and shorter; below 1, deeper and longer.

#### Native

[SetSoundPitch](/typings/3.0.0/functions/SetSoundPitch) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetSoundPitch))

#### Bug

The Native behaves oddly. Hive Workshop explains why, at
http://www.hiveworkshop.com/threads/setsoundpitch-weirdness.215743/#post-2145419,
and offers a replacement without the problem, at
http://www.hiveworkshop.com/threads/snippet-rapidsound.258991/#post-2611724.

***

### setPlayPosition()

> **setPlayPosition**(`millisecs`): `void`

Defined in: [handles/sound.ts:416](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/sound.ts#L416)

Moves the playback of the sound to a point in its file.

#### Parameters

##### millisecs

`number`

The time from the file's start, in milliseconds.

#### Returns

`void`

#### Remarks

Call it right after the sound starts playing.

#### Native

[SetSoundPlayPosition](/typings/3.0.0/functions/SetSoundPlayPosition) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetSoundPlayPosition))

***

### setPosition()

> **setPosition**(`x`, `y`, `z`): `void`

Defined in: [handles/sound.ts:428](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/sound.ts#L428)

Places a 3D sound on the map.

#### Parameters

##### x

`number`

The x-coordinate, in world units.

##### y

`number`

The y-coordinate, in world units.

##### z

`number`

The z-coordinate, in world units.

#### Returns

`void`

#### Remarks

It applies only to a Sound created with `is3D`.

#### Native

[SetSoundPosition](/typings/3.0.0/functions/SetSoundPosition) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetSoundPosition))

***

### setVelocity()

> **setVelocity**(`x`, `y`, `z`): `void`

Defined in: [handles/sound.ts:441](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/sound.ts#L441)

Sets the velocity of a 3D sound's source, which shifts its pitch as a
moving source's does.

#### Parameters

##### x

`number`

The velocity's x component.

##### y

`number`

The velocity's y component.

##### z

`number`

The velocity's z component.

#### Returns

`void`

#### Remarks

It applies only to a Sound created with `is3D`.

#### Native

[SetSoundVelocity](/typings/3.0.0/functions/SetSoundVelocity) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetSoundVelocity))

***

### setVolume()

> **setVolume**(`volume`): `void`

Defined in: [handles/sound.ts:450](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/sound.ts#L450)

Sets how loud the sound plays, from silent to the file's full volume.

#### Parameters

##### volume

`number`

The volume, from 0 (silent) to 127 (full).

#### Returns

`void`

#### Native

[SetSoundVolume](/typings/3.0.0/functions/SetSoundVolume) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetSoundVolume))

***

### start()

> **start**(`fadeIn?`): `void`

Defined in: [handles/sound.ts:469](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/sound.ts#L469)

Starts the sound, through `StartSound`, or `StartSoundEx` when `fadeIn` is
given.

#### Parameters

##### fadeIn?

`boolean`

Whether the sound fades in at the `fadeInRate` given to
`create`, through `StartSoundEx`; left out, the sound starts through
`StartSound`.

#### Returns

`void`

#### Remarks

- A sound handle plays once.
- At most 16 sounds play in all.
- Two handles of one file path need at least 0.1 seconds between their
  starts, or the second does not play. Starting one of them earlier and
  then calling `setPosition` gets around it.

#### Native

[StartSound](/typings/3.0.0/functions/StartSound) ([jassbot](https://lep.duckdns.org/jassbot/doc/StartSound))

#### Native

[StartSoundEx](/typings/3.0.0/functions/StartSoundEx) ([jassbot](https://lep.duckdns.org/jassbot/doc/StartSoundEx))

***

### stop()

> **stop**(`killWhenDone`, `fadeOut`): `void`

Defined in: [handles/sound.ts:486](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/sound.ts#L486)

Stops the sound.

#### Parameters

##### killWhenDone

`boolean`

`true` to destroy the sound as well.

##### fadeOut

`boolean`

`true` to lower the volume at the `fadeOutRate` given
to `create`.

#### Returns

`void`

#### Example

**Sounds the game destroys itself**

```ts
// Sounds the game destroys itself. A one-off sound is started, then handed
// to killWhenDone: the game destroys it once it has played. A looping one
// is stopped with `stop(true, fadeOut)`, which destroys it as well. In both
// cases the Wrapper is not marked destroyed, so the library cannot catch a
// later use: drop every reference at once and never start the sound again.
import { Init, Sound, Timer } from "reforged-ts";

/** Plays `sound` once, then lets the game destroy it. */
export function playOnce(sound: Sound): void {
  sound.start();
  sound.killWhenDone();
}

let ambience: Sound | undefined;

/** Starts the looping rain ambience, unless it already plays. */
export function startRain(): void {
  if (ambience !== undefined) {
    return;
  }
  ambience = Sound.create(
    "Sound\\Ambient\\RainAmbience.flac",
    true,
    false,
    false,
    10,
    10,
    "",
  );
  ambience.start();
}

/** Fades the ambience out and destroys it; the reference goes first. */
export function stopRain(): void {
  const sound = ambience;
  ambience = undefined;
  sound?.stop(true, true);
}

Init.onTriggers(() => {
  // Created ahead, so the game has loaded the file when it plays.
  let chime: Sound | undefined = Sound.create(
    "Sound\\Interface\\QuestNew.wav",
    false,
    false,
    false,
    10,
    10,
    "",
  );
  Timer.after(1, () => {
    if (chime !== undefined) {
      playOnce(chime);
      chime = undefined;
    }
    startRain();
  });
  Timer.after(60, stopRain);
});
```

#### Native

[StopSound](/typings/3.0.0/functions/StopSound) ([jassbot](https://lep.duckdns.org/jassbot/doc/StopSound))

***

### unregisterStacked()

> **unregisterStacked**(`byPosition`, `rectWidth`, `rectHeight`): `void`

Defined in: [handles/sound.ts:498](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/sound.ts#L498)

Undoes `registerStacked`: the sound is no longer an area sound.

#### Parameters

##### byPosition

`boolean`

The value given to `registerStacked`.

##### rectWidth

`number`

The width given to `registerStacked`, in world units.

##### rectHeight

`number`

The height given to `registerStacked`, in world
units.

#### Returns

`void`

#### Native

[UnregisterStackedSound](/typings/3.0.0/functions/UnregisterStackedSound) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnregisterStackedSound))

***

### create()

> `static` **create**(`fileName`, `looping`, `is3D`, `stopWhenOutOfRange`, `fadeInRate`, `fadeOutRate`, `eaxSetting`): `Sound`

Defined in: [handles/sound.ts:54](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/sound.ts#L54)

Creates a sound handle for a sound file.

#### Parameters

##### fileName

`string`

The file's path.

##### looping

`boolean`

Whether the sound starts over each time it reaches its
end.

##### is3D

`boolean`

Whether the sound plays from a place on the map, loudest
when the camera is near that place.

##### stopWhenOutOfRange

`boolean`

Whether a 3D sound stops once the camera is
out of its range, instead of playing on unheard.

##### fadeInRate

`number`

How fast the sound fades in: the higher, the faster.
jassdoc gives 127 as the highest rate, yet Blizzard.j passes 10000 and
12700.

##### fadeOutRate

`number`

How fast the sound fades out: the higher, the
faster. jassdoc gives 127 as the highest rate, yet Blizzard.j passes
10000 and 12700.

##### eaxSetting

`string`

The EAX (environmental audio extensions) preset, the
sound editor's "Effect" field, such as `"DefaultEAXON"`.

#### Returns

`Sound`

The new sound.

#### Remarks

The game caps playback:
- a sound handle plays once;
- one file path plays at most four times;
- at most 16 sounds play in all;
- two handles of one file path need at least 0.1 seconds between their
  starts, or the second does not play. Starting one of them earlier and
  then calling `SetSoundPosition` gets around it.

#### Throws

When the game returns no handle:
`reforged-ts: failed to create Sound (<fileName>)`, at the calling line.
In Dev mode, also when called before the globals Init stage or inside
`MapPlayer.runLocal`.

#### Native

[CreateSound](/typings/3.0.0/functions/CreateSound) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateSound))

***

### createFilenameWithLabel()

> `static` **createFilenameWithLabel**(`fileName`, `looping`, `is3D`, `stopWhenOutOfRange`, `fadeInRate`, `fadeOutRate`, `slkEntryName`): `Sound`

Defined in: [handles/sound.ts:96](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/sound.ts#L96)

Creates a sound handle playing `fileName` with the settings of the SLK
entry `slkEntryName`, through `CreateSoundFilenameWithLabel`.

#### Parameters

##### fileName

`string`

The sound file's path.

##### looping

`boolean`

Whether the sound restarts each time it ends.

##### is3D

`boolean`

Whether the sound plays from a position on the map.

##### stopWhenOutOfRange

`boolean`

Whether a 3D sound stops once the camera is
out of its range.

##### fadeInRate

`number`

How fast the sound fades in: the higher, the faster.

##### fadeOutRate

`number`

How fast the sound fades out: the higher, the faster.

##### slkEntryName

`string`

The label of an entry of the game's sound SLK
files, whose volume, pitch, channel and distances the sound takes.

#### Returns

`Sound`

The new sound.

#### Throws

When the game returns no handle:
`reforged-ts: failed to create Sound (<fileName>)`, at the calling line.
In Dev mode, also when called before the globals Init stage or inside
`MapPlayer.runLocal`.

#### Native

[CreateSoundFilenameWithLabel](/typings/3.0.0/functions/CreateSoundFilenameWithLabel) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateSoundFilenameWithLabel))

***

### createFromLabel()

> `static` **createFromLabel**(`soundLabel`, `looping`, `is3D`, `stopWhenOutOfRange`, `fadeInRate`, `fadeOutRate`): `Sound`

Defined in: [handles/sound.ts:136](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/sound.ts#L136)

Creates a sound handle from the SLK entry `soundLabel`, which names the
file and its settings, through `CreateSoundFromLabel`.

#### Parameters

##### soundLabel

`string`

The label of an entry of the game's sound SLK files.

##### looping

`boolean`

Whether the sound restarts each time it ends.

##### is3D

`boolean`

Whether the sound plays from a position on the map.

##### stopWhenOutOfRange

`boolean`

Whether a 3D sound stops once the camera is
out of its range.

##### fadeInRate

`number`

How fast the sound fades in: the higher, the faster.

##### fadeOutRate

`number`

How fast the sound fades out: the higher, the faster.

#### Returns

`Sound`

The new sound.

#### Throws

When the game returns no handle:
`reforged-ts: failed to create Sound (<soundLabel>)`, at the calling
line. In Dev mode, also when called before the globals Init stage or
inside `MapPlayer.runLocal`.

#### Native

[CreateSoundFromLabel](/typings/3.0.0/functions/CreateSoundFromLabel) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateSoundFromLabel))

***

### createMIDI()

> `static` **createMIDI**(`soundLabel`, `fadeInRate`, `fadeOutRate`): `Sound`

Defined in: [handles/sound.ts:171](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/sound.ts#L171)

Creates a MIDI sound handle from the SLK entry `soundLabel`, through
`CreateMIDISound`.

#### Parameters

##### soundLabel

`string`

The label of an entry of the game's MIDI sound SLK
files.

##### fadeInRate

`number`

How fast the sound fades in: the higher, the faster.

##### fadeOutRate

`number`

How fast the sound fades out: the higher, the faster.

#### Returns

`Sound`

The new sound.

#### Throws

When the game returns no handle:
`reforged-ts: failed to create Sound (<soundLabel>)`, at the calling
line. In Dev mode, also when called before the globals Init stage or
inside `MapPlayer.runLocal`.

#### Native

[CreateMIDISound](/typings/3.0.0/functions/CreateMIDISound) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateMIDISound))

***

### endThematicMusic()

> `static` **endThematicMusic**(): `void`

Defined in: [handles/sound.ts:526](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/sound.ts#L526)

Stops the thematic music, so the map's music it interrupted plays again.

#### Returns

`void`

#### Native

[EndThematicMusic](/typings/3.0.0/functions/EndThematicMusic) ([jassbot](https://lep.duckdns.org/jassbot/doc/EndThematicMusic))

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

### getFileDuration()

> `static` **getFileDuration**(`fileName`): `number`

Defined in: [handles/sound.ts:518](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/sound.ts#L518)

**`Async`**

Gets the length of a sound file as the local client has it.

#### Parameters

##### fileName

`string`

The sound file's path.

#### Returns

`number`

The length, in milliseconds.

#### Remarks

The value can differ between clients, for a voice file whose length
depends on the game's language: never let it decide game state.

#### Example

**A subtitle as long as the local voice line**

```ts
// A voice line whose subtitle stays on screen as long as the line plays.
// A voice file's length depends on the client's language, and whether a
// sound still plays is the local client's own: both decide what the player
// sees and hears, never game state, so no Timer is started from them.
import {
  Init,
  MapPlayer,
  on,
  PlayerEvents,
  Sound,
  tsGlobals,
} from "reforged-ts";

const LINE = "Sound\\Dialogue\\HumanCampaign\\Human01\\H01Uther01.flac";

/** Plays the line with its subtitle, unless it still plays on this client. */
export function playLine(voice: Sound): void {
  if (voice.playing) {
    return;
  }
  voice.start();
  // In milliseconds, as this client plays the line.
  const length =
    voice.duration > 0 ? voice.duration : Sound.getFileDuration(LINE);
  MapPlayer.fromLocal().displayTimedText(
    0,
    0,
    length / 1000,
    "Uther: For the Light!",
  );
}

Init.onTriggers(() => {
  const voice = Sound.create(LINE, false, false, false, 10, 10, "");
  // Every client registers the same chat event and plays the line.
  for (const player of tsGlobals.Players) {
    on(PlayerEvents.chat(player, "-uther", true), () => {
      playLine(voice);
    });
  }
});
```

#### Native

[GetSoundFileDuration](/typings/3.0.0/functions/GetSoundFileDuration) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetSoundFileDuration))

***

### pauseThematicMusicOnFocusLost()

> `static` **pauseThematicMusicOnFocusLost**(`pause`): `void`

Defined in: [handles/sound.ts:536](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/sound.ts#L536)

Sets whether the thematic music pauses while the game window has lost
focus, through `BlzPauseThematicMusicOnFocusLost` (3.0.0).

#### Parameters

##### pause

`boolean`

`true` to pause it while the window is out of focus.

#### Returns

`void`

#### Native

[BlzPauseThematicMusicOnFocusLost](/typings/3.0.0/functions/BlzPauseThematicMusicOnFocusLost) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzPauseThematicMusicOnFocusLost))

***

### playThematicMusic()

> `static` **playThematicMusic**(`file`, `fromMs?`): `void`

Defined in: [handles/sound.ts:553](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/sound.ts#L553)

Plays a music file as the thematic music, through `PlayThematicMusic`, or
through `PlayThematicMusicEx` from `fromMs` milliseconds into the file
when it is given.

#### Parameters

##### file

`string`

The music file's path.

##### fromMs?

`number`

Where in the file to start, in milliseconds; its start
when left out.

#### Returns

`void`

#### Remarks

The thematic music plays once and interrupts the map's music; it
replaces the thematic music already playing.

#### Native

[PlayThematicMusic](/typings/3.0.0/functions/PlayThematicMusic) ([jassbot](https://lep.duckdns.org/jassbot/doc/PlayThematicMusic))

#### Native

[PlayThematicMusicEx](/typings/3.0.0/functions/PlayThematicMusicEx) ([jassbot](https://lep.duckdns.org/jassbot/doc/PlayThematicMusicEx))

***

### setThematicMusicVolume()

> `static` **setThematicMusicVolume**(`volume`): `void`

Defined in: [handles/sound.ts:566](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/sound.ts#L566)

Sets how loud the thematic music plays, from silent to full volume.

#### Parameters

##### volume

`number`

The volume, from 0 (silent) to 127 (full).

#### Returns

`void`

#### Native

[SetThematicMusicVolume](/typings/3.0.0/functions/SetThematicMusicVolume) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetThematicMusicVolume))
