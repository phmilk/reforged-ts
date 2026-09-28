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
   * Creates a sound handle.
   * @remarks
   * - You can only play the same sound handle once.
   * - You can only play the same sound filepath four times.
   * - You can only play 16 sounds in general.
   * - Sounds of the same filepath (on different sound handles) must have a delay
   *   of at least 0.1 seconds inbetween them to be played.
   *   You can overcome this by starting one earlier and then using `SetSoundPosition`.
   * @param fileName - The path to the file.
   * @param looping - Looping sounds will restart once the sound duration has finished.
   * @param is3D - 3D Sounds can be played on particular areas of the map. They are at their loudest when the camera is close to the sound's coordinates.
   * @param stopWhenOutOfRange - Whether a 3D sound stops once the camera is
   * out of its range, instead of playing on unheard.
   * @param fadeInRate - How quickly the sound fades in. The higher the number, the faster the sound fades in. Maximum number is 127.
   * @param fadeOutRate - How quickly the sound fades out. The higher the number, the faster the sound fades out. Maximum number is 127.
   * @param eaxSetting - EAX is an acronym for environmental audio extensions. In the sound editor, this corresponds to the "Effect" setting.
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
   * @param fileName - The path to the file.
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
   * @remarks This call is only valid if the sound was created with 3d enabled
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
   * @remarks This call is only valid if the sound was created with 3d enabled
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
   * @remarks This call is only valid if the sound was created with 3d enabled
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
   * Applies default settings to the sound.
   * @param soundLabel - The label out of one of the SLK-files, whose settings should be used, e.g. values like volume, pitch, pitch variance, priority, channel, min distance, max distance, distance cutoff or eax.
   * @native SetSoundParamsFromLabel
   */
  public setParamsFromLabel(soundLabel: string) {
    SetSoundParamsFromLabel(this.handle, soundLabel);
  }

  /**
   * Tones the pitch of the sound, default value is 1.
   * Increasing it you get the chipmunk version and the sound becomes shorter, when decremented the sound becomes low-pitched and longer.
   * @param pitch - The pitch ratio, where 1 is the file's own pitch.
   * @native SetSoundPitch
   * @bug This native has very weird behaviour.
   * See [this](http://www.hiveworkshop.com/threads/setsoundpitch-weirdness.215743/#post-2145419) for an explenation
   * and [this](http://www.hiveworkshop.com/threads/snippet-rapidsound.258991/#post-2611724) for a non-bugged implementation.
   */
  public setPitch(pitch: number) {
    SetSoundPitch(this.handle, pitch);
  }

  /**
   * Moves the playback of the sound to a point in its file.
   * @remarks
   * Must be called immediately after starting the sound
   * @param millisecs - The time from the file's start, in milliseconds.
   * @native SetSoundPlayPosition
   */
  public setPlayPosition(millisecs: number) {
    SetSoundPlayPosition(this.handle, millisecs);
  }

  /**
   * Places a 3D sound on the map.
   * @remarks This call is only valid if the sound was created with 3d enabled
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
   * @remarks This call is only valid if the sound was created with 3d enabled
   * @param x - The velocity's x component.
   * @param y - The velocity's y component.
   * @param z - The velocity's z component.
   * @native SetSoundVelocity
   */
  public setVelocity(x: number, y: number, z: number) {
    SetSoundVelocity(this.handle, x, y, z);
  }

  /**
   * Sets the loudness of the sound.
   * @param volume - Volume, between 0 and 127
   * @native SetSoundVolume
   */
  public setVolume(volume: number) {
    SetSoundVolume(this.handle, volume);
  }

  /**
   * Starts the sound, through `StartSound`, or `StartSoundEx` when `fadeIn` is
   * given.
   * @remarks
   * - You can only play the same sound handle once.
   * - You can only play 16 sounds in general.
   * - Sounds of the same filepath (on different sound handles) must have a delay of at least 0.1 seconds inbetween them to be played.
   *   You can overcome this by starting one earlier and then using `setPosition`.
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
   * @param killWhenDone - The sound gets destroyed if true.
   * @param fadeOut - Turns down the volume with `fadeOutRate` as stated in constructor.
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
   * @param fileName - The path to the file.
   * @returns The length, in milliseconds.
   * @native GetSoundFileDuration
   * @async
   */
  public static getFileDuration(fileName: string) {
    return GetSoundFileDuration(fileName);
  }

  /**
   * Stops the thematic music, through `EndThematicMusic`.
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
   * @param file - The path to the music file.
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
   * Sets the volume of the thematic music, through `SetThematicMusicVolume`.
   * @param volume - The volume, from 0 to 127.
   * @native SetThematicMusicVolume
   */
  public static setThematicMusicVolume(volume: number) {
    SetThematicMusicVolume(volume);
  }
}
