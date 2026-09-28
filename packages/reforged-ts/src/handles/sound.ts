/** @noSelfInFile */

import { Handle } from "./handle";

/**
 * A sound: a sound file with its playback settings, played everywhere or,
 * when created 3D, from a position on the map.
 * @remarks
 * - The game loads a sound's file after `create`: a Sound started in the same
 *   instant it is created may stay silent. Create it ahead of time, and start
 *   it once `loading` is false.
 * - The members for positions, distances, cones and velocity apply to a
 *   Sound created with `is3D`.
 * - `duration`, `playing` and `getFileDuration` can differ between clients:
 *   never let them decide game state.
 * - The static members play the thematic music, which is not a Sound.
 * @example Creating a sound ahead of time and playing it later
 * {@includeCode ../../examples/harness/sound-create.ts}
 * @native sound
 */
export class Sound extends Handle<sound> {
  /**
   * Creates a sound handle for a sound file.
   * @remarks
   * The game caps playback:
   * - a sound handle plays once;
   * - one file path plays at most four times;
   * - at most 16 sounds play in all;
   * - two handles of one file path need at least 0.1 seconds between their
   *   starts, or the second does not play. Starting one of them earlier and
   *   then calling `SetSoundPosition` gets around it.
   * @param fileName - The file's path.
   * @param looping - Whether the sound starts over each time it reaches its
   * end.
   * @param is3D - Whether the sound plays from a place on the map, loudest
   * when the camera is near that place.
   * @param stopWhenOutOfRange - Whether a 3D sound stops once the camera is
   * out of its range, instead of playing on unheard.
   * @param fadeInRate - How fast the sound fades in: the higher, the faster.
   * jassdoc gives 127 as the highest rate, yet Blizzard.j passes 10000 and
   * 12700.
   * @param fadeOutRate - How fast the sound fades out: the higher, the
   * faster. jassdoc gives 127 as the highest rate, yet Blizzard.j passes
   * 10000 and 12700.
   * @param eaxSetting - The EAX (environmental audio extensions) preset, the
   * sound editor's "Effect" field, such as `"DefaultEAXON"`.
   * @returns The new sound.
   * @throws When the game returns no handle:
   * `reforged-ts: failed to create Sound (<fileName>)`, at the calling line.
   * In Dev mode, also when called before the globals Init stage or inside
   * `MapPlayer.runLocal`.
   * @native CreateSound
   */
  public static create(
    fileName: string,
    looping: boolean,
    is3D: boolean,
    stopWhenOutOfRange: boolean,
    fadeInRate: number,
    fadeOutRate: number,
    eaxSetting: string,
  ): Sound {
    return this.expect(
      CreateSound(
        fileName,
        looping,
        is3D,
        stopWhenOutOfRange,
        fadeInRate,
        fadeOutRate,
        eaxSetting,
      ),
      fileName,
    );
  }

  /**
   * Creates a sound handle playing `fileName` with the settings of the SLK
   * entry `slkEntryName`, through `CreateSoundFilenameWithLabel`.
   * @param fileName - The sound file's path.
   * @param looping - Whether the sound restarts each time it ends.
   * @param is3D - Whether the sound plays from a position on the map.
   * @param stopWhenOutOfRange - Whether a 3D sound stops once the camera is
   * out of its range.
   * @param fadeInRate - How fast the sound fades in: the higher, the faster.
   * @param fadeOutRate - How fast the sound fades out: the higher, the faster.
   * @param slkEntryName - The label of an entry of the game's sound SLK
   * files, whose volume, pitch, channel and distances the sound takes.
   * @returns The new sound.
   * @throws When the game returns no handle:
   * `reforged-ts: failed to create Sound (<fileName>)`, at the calling line.
   * In Dev mode, also when called before the globals Init stage or inside
   * `MapPlayer.runLocal`.
   * @native CreateSoundFilenameWithLabel
   */
  public static createFilenameWithLabel(
    fileName: string,
    looping: boolean,
    is3D: boolean,
    stopWhenOutOfRange: boolean,
    fadeInRate: number,
    fadeOutRate: number,
    slkEntryName: string,
  ): Sound {
    return this.expect(
      CreateSoundFilenameWithLabel(
        fileName,
        looping,
        is3D,
        stopWhenOutOfRange,
        fadeInRate,
        fadeOutRate,
        slkEntryName,
      ),
      fileName,
    );
  }

  /**
   * Creates a sound handle from the SLK entry `soundLabel`, which names the
   * file and its settings, through `CreateSoundFromLabel`.
   * @param soundLabel - The label of an entry of the game's sound SLK files.
   * @param looping - Whether the sound restarts each time it ends.
   * @param is3D - Whether the sound plays from a position on the map.
   * @param stopWhenOutOfRange - Whether a 3D sound stops once the camera is
   * out of its range.
   * @param fadeInRate - How fast the sound fades in: the higher, the faster.
   * @param fadeOutRate - How fast the sound fades out: the higher, the faster.
   * @returns The new sound.
   * @throws When the game returns no handle:
   * `reforged-ts: failed to create Sound (<soundLabel>)`, at the calling
   * line. In Dev mode, also when called before the globals Init stage or
   * inside `MapPlayer.runLocal`.
   * @native CreateSoundFromLabel
   */
  public static createFromLabel(
    soundLabel: string,
    looping: boolean,
    is3D: boolean,
    stopWhenOutOfRange: boolean,
    fadeInRate: number,
    fadeOutRate: number,
  ): Sound {
    return this.expect(
      CreateSoundFromLabel(
        soundLabel,
        looping,
        is3D,
        stopWhenOutOfRange,
        fadeInRate,
        fadeOutRate,
      ),
      soundLabel,
    );
  }

  /**
   * Creates a MIDI sound handle from the SLK entry `soundLabel`, through
   * `CreateMIDISound`.
   * @param soundLabel - The label of an entry of the game's MIDI sound SLK
   * files.
   * @param fadeInRate - How fast the sound fades in: the higher, the faster.
   * @param fadeOutRate - How fast the sound fades out: the higher, the faster.
   * @returns The new sound.
   * @throws When the game returns no handle:
   * `reforged-ts: failed to create Sound (<soundLabel>)`, at the calling
   * line. In Dev mode, also when called before the globals Init stage or
   * inside `MapPlayer.runLocal`.
   * @native CreateMIDISound
   */
  public static createMIDI(
    soundLabel: string,
    fadeInRate: number,
    fadeOutRate: number,
  ): Sound {
    return this.expect(
      CreateMIDISound(soundLabel, fadeInRate, fadeOutRate),
      soundLabel,
    );
  }

  /**
   * Gets the key of the speaker's name the game shows when the sound plays
   * as a line of dialogue.
   * @returns The key, or `""` when the sound has none.
   * @native GetDialogueSpeakerNameKey
   */
  public get dialogueSpeakerNameKey() {
    return GetDialogueSpeakerNameKey(this.handle) ?? "";
  }

  /**
   * The key of the speaker's name the game shows when the sound plays as a
   * line of dialogue.
   * @native SetDialogueSpeakerNameKey
   */
  public set dialogueSpeakerNameKey(speakerName: string) {
    SetDialogueSpeakerNameKey(this.handle, speakerName);
  }

  /**
   * Gets the key of the text the game shows as a subtitle when the sound
   * plays as a line of dialogue.
   * @returns The key, or `""` when the sound has none.
   * @native GetDialogueTextKey
   */
  public get dialogueTextKey() {
    return GetDialogueTextKey(this.handle) ?? "";
  }

  /**
   * The key of the text the game shows as a subtitle when the sound plays as
   * a line of dialogue.
   * @native SetDialogueTextKey
   */
  public set dialogueTextKey(dialogueText: string) {
    SetDialogueTextKey(this.handle, dialogueText);
  }

  /**
   * Gets the length of the sound as the local client plays it.
   * @remarks
   * The value can differ between clients, for a voice file whose length
   * depends on the game's language: never let it decide game state.
   * @returns The length, in milliseconds.
   * @native GetSoundDuration
   * @async
   */
  public get duration() {
    return GetSoundDuration(this.handle);
  }

  /**
   * The length the game plays the sound for, in milliseconds.
   * @native SetSoundDuration
   */
  public set duration(duration: number) {
    SetSoundDuration(this.handle, duration);
  }

  /**
   * Gets whether the game is still loading the sound's file.
   * @returns `true` while the file loads; the sound may not play until then.
   * @native GetSoundIsLoading
   */
  public get loading() {
    return GetSoundIsLoading(this.handle);
  }

  /**
   * Gets whether the sound is playing on the local client.
   * @remarks
   * The value can differ between clients: never let it decide game state.
   * Right after `start` it is still `false`.
   * @returns `true` while the sound plays.
   * @native GetSoundIsPlaying
   * @async
   */
  public get playing() {
    return GetSoundIsPlaying(this.handle);
  }

  /**
   * Makes the game destroy the sound once it has finished playing.
   * @native KillSoundWhenDone
   */
  public killWhenDone() {
    KillSoundWhenDone(this.handle);
  }

  /**
   * Makes the sound an area sound, heard across a rectangle centred on its
   * position, as the editor's region sounds are.
   * @param byPosition - Whether the area is placed at the sound's position;
   * Blizzard.j's region sounds pass `true`.
   * @param rectWidth - The width of the area, in world units.
   * @param rectHeight - The height of the area, in world units.
   * @native RegisterStackedSound
   */
  public registerStacked(
    byPosition: boolean,
    rectWidth: number,
    rectHeight: number,
  ) {
    RegisterStackedSound(this.handle, byPosition, rectWidth, rectHeight);
  }

  /**
   * Sets the sound's channel, the category the game mixes it in, as the
   * sound editor's Channel setting numbers them.
   * @param channel - The channel's number.
   * @native SetSoundChannel
   */
  public setChannel(channel: number) {
    SetSoundChannel(this.handle, channel);
  }

  /**
   * Sets the cone in which a 3D sound is heard at full volume, around the
   * direction of `setConeOrientation`.
   * @remarks It applies only to a Sound created with `is3D`.
   * @param inside - The angle of the full-volume cone, in degrees.
   * @param outside - The angle of the outer cone, in degrees, where the volume
   * falls to `outsideVolume`.
   * @param outsideVolume - The volume outside the outer cone, from 0 to 127.
   * @native SetSoundConeAngles
   */
  public setConeAngles(inside: number, outside: number, outsideVolume: number) {
    SetSoundConeAngles(this.handle, inside, outside, outsideVolume);
  }

  /**
   * Points the cone of a 3D sound in a direction.
   * @remarks It applies only to a Sound created with `is3D`.
   * @param x - The direction's x component.
   * @param y - The direction's y component.
   * @param z - The direction's z component.
   * @native SetSoundConeOrientation
   */
  public setConeOrientation(x: number, y: number, z: number) {
    SetSoundConeOrientation(this.handle, x, y, z);
  }

  /**
   * Sets the distance from the camera beyond which a 3D sound is not heard.
   * @param cutoff - The distance, in world units.
   * @native SetSoundDistanceCutoff
   */
  public setDistanceCutoff(cutoff: number) {
    SetSoundDistanceCutoff(this.handle, cutoff);
  }

  /**
   * Sets the distances over which a 3D sound fades with the camera's
   * distance.
   * @remarks It applies only to a Sound created with `is3D`.
   * @param minDist - The distance within which the sound is at full volume,
   * in world units.
   * @param maxDist - The distance at which it reaches its lowest volume, in
   * world units.
   * @native SetSoundDistances
   */
  public setDistances(minDist: number, maxDist: number) {
    SetSoundDistances(this.handle, minDist, maxDist);
  }

  /**
   * Sets the facial animation set that a Reforged portrait plays with the
   * sound.
   * @param animationSetFilepath - The path of the facial animation set.
   * @native SetSoundFacialAnimationSetFilepath
   */
  public setFacialAnimationFilepath(animationSetFilepath: string) {
    SetSoundFacialAnimationSetFilepath(this.handle, animationSetFilepath);
  }

  /**
   * Sets the group, in the facial animation set, of the animation played with
   * the sound.
   * @param groupLabel - The group's label.
   * @native SetSoundFacialAnimationGroupLabel
   */
  public setFacialAnimationGroupLabel(groupLabel: string) {
    SetSoundFacialAnimationGroupLabel(this.handle, groupLabel);
  }

  /**
   * Sets the facial animation, in its group, played with the sound.
   * @param animationLabel - The animation's label.
   * @native SetSoundFacialAnimationLabel
   */
  public setFacialAnimationLabel(animationLabel: string) {
    SetSoundFacialAnimationLabel(this.handle, animationLabel);
  }

  /**
   * Gives the sound the settings of an entry of the game's sound SLK files.
   * @param soundLabel - The entry's label. The sound takes its settings, such
   * as the volume, pitch and pitch variance, priority, channel, minimum and
   * maximum distances, distance cutoff and EAX preset.
   * @native SetSoundParamsFromLabel
   */
  public setParamsFromLabel(soundLabel: string) {
    SetSoundParamsFromLabel(this.handle, soundLabel);
  }

  /**
   * Sets the sound's pitch, which also changes how long it plays.
   * @remarks
   * Above 1 the sound gets higher and shorter; below 1, deeper and longer.
   * @param pitch - The pitch ratio, where 1, the default, is the file's own
   * pitch.
   * @native SetSoundPitch
   * @bug The Native behaves oddly. Hive Workshop explains why, at
   * http://www.hiveworkshop.com/threads/setsoundpitch-weirdness.215743/#post-2145419,
   * and offers a replacement without the problem, at
   * http://www.hiveworkshop.com/threads/snippet-rapidsound.258991/#post-2611724.
   */
  public setPitch(pitch: number) {
    SetSoundPitch(this.handle, pitch);
  }

  /**
   * Moves the playback of the sound to a point in its file.
   * @remarks
   * Call it right after the sound starts playing.
   * @param millisecs - The time from the file's start, in milliseconds.
   * @native SetSoundPlayPosition
   */
  public setPlayPosition(millisecs: number) {
    SetSoundPlayPosition(this.handle, millisecs);
  }

  /**
   * Places a 3D sound on the map.
   * @remarks It applies only to a Sound created with `is3D`.
   * @param x - The x-coordinate, in world units.
   * @param y - The y-coordinate, in world units.
   * @param z - The z-coordinate, in world units.
   * @native SetSoundPosition
   */
  public setPosition(x: number, y: number, z: number) {
    SetSoundPosition(this.handle, x, y, z);
  }

  /**
   * Sets the velocity of a 3D sound's source, which shifts its pitch as a
   * moving source's does.
   * @remarks It applies only to a Sound created with `is3D`.
   * @param x - The velocity's x component.
   * @param y - The velocity's y component.
   * @param z - The velocity's z component.
   * @native SetSoundVelocity
   */
  public setVelocity(x: number, y: number, z: number) {
    SetSoundVelocity(this.handle, x, y, z);
  }

  /**
   * Sets how loud the sound plays, from silent to the file's full volume.
   * @param volume - The volume, from 0 (silent) to 127 (full).
   * @native SetSoundVolume
   */
  public setVolume(volume: number) {
    SetSoundVolume(this.handle, volume);
  }

  /**
   * Starts the sound, through `StartSound`, or `StartSoundEx` when `fadeIn` is
   * given.
   * @remarks
   * - A sound handle plays once.
   * - At most 16 sounds play in all.
   * - Two handles of one file path need at least 0.1 seconds between their
   *   starts, or the second does not play. Starting one of them earlier and
   *   then calling `setPosition` gets around it.
   * @param fadeIn - Whether the sound fades in at the `fadeInRate` given to
   * `create`, through `StartSoundEx`; left out, the sound starts through
   * `StartSound`.
   * @native StartSound
   * @native StartSoundEx
   */
  public start(fadeIn?: boolean) {
    if (fadeIn === undefined) {
      StartSound(this.handle);
    } else {
      StartSoundEx(this.handle, fadeIn);
    }
  }

  /**
   * Stops the sound.
   * @param killWhenDone - `true` to destroy the sound as well.
   * @param fadeOut - `true` to lower the volume at the `fadeOutRate` given
   * to `create`.
   * @native StopSound
   */
  public stop(killWhenDone: boolean, fadeOut: boolean) {
    StopSound(this.handle, killWhenDone, fadeOut);
  }

  /**
   * Undoes `registerStacked`: the sound is no longer an area sound.
   * @param byPosition - The value given to `registerStacked`.
   * @param rectWidth - The width given to `registerStacked`, in world units.
   * @param rectHeight - The height given to `registerStacked`, in world
   * units.
   * @native UnregisterStackedSound
   */
  public unregisterStacked(
    byPosition: boolean,
    rectWidth: number,
    rectHeight: number,
  ) {
    UnregisterStackedSound(this.handle, byPosition, rectWidth, rectHeight);
  }

  /**
   * Gets the length of a sound file as the local client has it.
   * @remarks
   * The value can differ between clients, for a voice file whose length
   * depends on the game's language: never let it decide game state.
   * @param fileName - The sound file's path.
   * @returns The length, in milliseconds.
   * @native GetSoundFileDuration
   * @async
   */
  public static getFileDuration(fileName: string) {
    return GetSoundFileDuration(fileName);
  }

  /**
   * Stops the thematic music, so the map's music it interrupted plays again.
   * @native EndThematicMusic
   */
  public static endThematicMusic() {
    EndThematicMusic();
  }

  /**
   * Sets whether the thematic music pauses while the game window has lost
   * focus, through `BlzPauseThematicMusicOnFocusLost` (3.0.0).
   * @param pause - `true` to pause it while the window is out of focus.
   * @native BlzPauseThematicMusicOnFocusLost
   */
  public static pauseThematicMusicOnFocusLost(pause: boolean) {
    BlzPauseThematicMusicOnFocusLost(pause);
  }

  /**
   * Plays a music file as the thematic music, through `PlayThematicMusic`, or
   * through `PlayThematicMusicEx` from `fromMs` milliseconds into the file
   * when it is given.
   * @remarks
   * The thematic music plays once and interrupts the map's music; it
   * replaces the thematic music already playing.
   * @param file - The music file's path.
   * @param fromMs - Where in the file to start, in milliseconds; its start
   * when left out.
   * @native PlayThematicMusic
   * @native PlayThematicMusicEx
   */
  public static playThematicMusic(file: string, fromMs?: number) {
    if (fromMs === undefined) {
      PlayThematicMusic(file);
    } else {
      PlayThematicMusicEx(file, fromMs);
    }
  }

  /**
   * Sets how loud the thematic music plays, from silent to full volume.
   * @param volume - The volume, from 0 (silent) to 127 (full).
   * @native SetThematicMusicVolume
   */
  public static setThematicMusicVolume(volume: number) {
    SetThematicMusicVolume(volume);
  }
}
