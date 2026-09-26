/** @noSelfInFile */

// Sound on the Handle base: `create` throws naming the sound file,
// `fromHandle` returns undefined for nothing. `start` picks the plain or the
// extended start Native by whether `fadeIn` is given, and the thematic-music
// statics pass their arguments to the music Natives.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { Sound } from "../src/index";
import { handleRef } from "./support/handle-ref";
import { withNative } from "./support/native-override";
import { raisedIn } from "./support/raised-in";

const file = "Sound/Interface/Warning.flac";

describe("Sound.create", () => {
  it("wraps the handle CreateSound returns, and a lookup finds it", () => {
    const sound = Sound.create(file, false, true, true, 10, 10, "DefaultEAXON");
    expect(stubCalls()).toContainCall(
      `CreateSound("${file}", false, true, true, 10, 10, "DefaultEAXON")`,
    );
    expect(Sound.fromHandle(sound.handle)).toBe(sound);
  });

  it("throws naming the file when CreateSound returns nil", () => {
    const message = withNative(
      "CreateSound",
      () => undefined,
      () =>
        raisedIn(() => {
          Sound.create(file, false, false, false, 10, 10, "");
        }),
    );
    expect(message).toEqual(`reforged-ts: failed to create Sound (${file})`);
  });
});

describe("Sound.fromHandle", () => {
  it("is undefined for an undefined Handle", () => {
    expect(Sound.fromHandle(undefined)).toBeUndefined();
  });

  it("gives the same Sound for two lookups of one Handle", () => {
    const handle = CreateSound(file, false, false, false, 10, 10, "");
    const sound = Sound.fromHandle(handle);
    expect(sound?.handle).toBe(handle);
    expect(Sound.fromHandle(handle)).toBe(sound);
  });
});

describe("sound.start", () => {
  const startCalls = (sound: Sound) => {
    const ref = handleRef("sound", sound.handle);
    return stubCalls().filter(
      (line) =>
        line.startsWith(`StartSound(${ref}`) ||
        line.startsWith(`StartSoundEx(${ref}`),
    );
  };
  const started = (body: () => void) => {
    withNative(
      "StartSound",
      () => undefined,
      () => {
        withNative("StartSoundEx", () => undefined, body);
      },
    );
  };

  it("calls StartSound when fadeIn is not given", () => {
    const sound = Sound.create(file, false, false, false, 10, 10, "");
    started(() => {
      sound.start();
    });
    expect(startCalls(sound)).toEqual([
      `StartSound(${handleRef("sound", sound.handle)})`,
    ]);
  });

  it("calls StartSoundEx with fadeIn when it is given, false included", () => {
    const fading = Sound.create(file, false, false, false, 10, 10, "");
    const abrupt = Sound.create(file, false, false, false, 10, 10, "");
    started(() => {
      fading.start(true);
      abrupt.start(false);
    });
    expect(startCalls(fading)).toEqual([
      `StartSoundEx(${handleRef("sound", fading.handle)}, true)`,
    ]);
    expect(startCalls(abrupt)).toEqual([
      `StartSoundEx(${handleRef("sound", abrupt.handle)}, false)`,
    ]);
  });
});

describe("Sound thematic music", () => {
  it("playThematicMusic calls PlayThematicMusic when fromMs is not given", () => {
    const music = "Sound/Music/mp3Music/Tension.mp3";
    withNative(
      "PlayThematicMusic",
      () => undefined,
      () => {
        withNative(
          "PlayThematicMusicEx",
          () => undefined,
          () => {
            Sound.playThematicMusic(music);
          },
        );
      },
    );
    expect(stubCalls()).toContainCall(`PlayThematicMusic("${music}")`);
    expect(
      stubCalls().filter((line) =>
        line.startsWith(`PlayThematicMusicEx("${music}"`),
      ),
    ).toEqual([]);
  });

  it("playThematicMusic calls PlayThematicMusicEx from fromMs when it is given", () => {
    const music = "Sound/Music/mp3Music/Doom.mp3";
    withNative(
      "PlayThematicMusic",
      () => undefined,
      () => {
        withNative(
          "PlayThematicMusicEx",
          () => undefined,
          () => {
            Sound.playThematicMusic(music, 1500);
          },
        );
      },
    );
    expect(stubCalls()).toContainCall(`PlayThematicMusicEx("${music}", 1500)`);
    expect(
      stubCalls().filter((line) => line === `PlayThematicMusic("${music}")`),
    ).toEqual([]);
  });

  it("endThematicMusic calls EndThematicMusic", () => {
    withNative(
      "EndThematicMusic",
      () => undefined,
      () => {
        Sound.endThematicMusic();
      },
    );
    expect(stubCalls()).toContainCall("EndThematicMusic()");
  });

  it("setThematicMusicVolume passes the volume to SetThematicMusicVolume", () => {
    withNative(
      "SetThematicMusicVolume",
      () => undefined,
      () => {
        Sound.setThematicMusicVolume(64);
      },
    );
    expect(stubCalls()).toContainCall("SetThematicMusicVolume(64)");
  });

  it("pauseThematicMusicOnFocusLost passes the flag to BlzPauseThematicMusicOnFocusLost", () => {
    withNative(
      "BlzPauseThematicMusicOnFocusLost",
      () => undefined,
      () => {
        Sound.pauseThematicMusicOnFocusLost(true);
      },
    );
    expect(stubCalls()).toContainCall("BlzPauseThematicMusicOnFocusLost(true)");
  });
});
