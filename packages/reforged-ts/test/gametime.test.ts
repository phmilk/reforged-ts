/** @noSelfInFile */

// The game-time System in the bundle load position: `getElapsedTime` is zero
// until the `gameStart` stage starts its periodic Timer, then the Timer's
// whole periods plus its elapsed fraction. The tests drive the compiled
// library through the entry points as the game does (`config`, `main`, then
// `MarkGameStarted`), fire the periodic Timer through the stub, and answer
// `TimerGetElapsed` with a fraction. The file's tests share one Lua state and
// one run of the editor's script, in order.

// Keep this import ahead of the library's: the library wraps the entry
// points when it loads, and this file defines them.
import "./support/bundle-position";
import { describe, expect, it } from "reforged-test/lua";
import { getElapsedTime } from "../src/index";
import { withNative } from "./support/native-override";
import { timersStarted } from "./support/timers-started";

declare const config: () => void;
declare const main: () => void;
declare const MarkGameStarted: () => void;

/** The game-time Timer, once the `gameStart` stage started it. */
let gameTimer: timer | undefined;

/** `getElapsedTime()` with the game-time Timer `elapsed` seconds into its period. */
function elapsedWith(elapsed: number): number {
  return withNative("TimerGetElapsed", () => elapsed, getElapsedTime);
}

describe("getElapsedTime", () => {
  it("is zero before the gameStart stage", () => {
    expect(getElapsedTime()).toEqual(0);
    config();
    expect(getElapsedTime()).toEqual(0);
    main();
    expect(elapsedWith(5)).toEqual(0);
  });

  it("starts a periodic Timer of 30 seconds at the gameStart stage, and adds its elapsed fraction", () => {
    const periodic = timersStarted(() => {
      MarkGameStarted();
    }).filter((started) => started.periodic);
    expect(periodic.map((started) => started.timeout)).toEqual([30]);
    gameTimer = periodic[0].timer;
    expect(elapsedWith(0)).toEqual(0);
    expect(elapsedWith(12.5)).toEqual(12.5);
  });

  it("grows by 30 seconds each time the periodic Timer fires", () => {
    if (gameTimer === undefined) {
      error("the gameStart stage started no periodic Timer");
    }
    __stub_fire_timer(gameTimer);
    expect(elapsedWith(0)).toEqual(30);
    __stub_fire_timer(gameTimer);
    expect(elapsedWith(7.25)).toEqual(67.25);
  });
});
