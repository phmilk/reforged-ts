/** @noSelfInFile */

// `Input` is a static namespace over the raw-input Natives of 3.0.0: each
// member calls its Native with the value given and answers what the Native
// answers. `MetaKey` holds the bit flags of `METAKEY_*`, combined with `|`.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { Input, MetaKey } from "../src/index";
import { withNative } from "./support/native-override";

describe("MetaKey", () => {
  it("holds the bit flags of METAKEY_NONE to METAKEY_WINKEYS", () => {
    expect([
      MetaKey.None,
      MetaKey.Shift,
      MetaKey.Ctrl,
      MetaKey.Alt,
      MetaKey.WinKeys,
    ]).toEqual([0, 1, 2, 4, 8]);
  });
});

describe("Input", () => {
  it("isKeyPressed asks BlzIsKeyPressed for the key", () => {
    const pressed = withNative(
      "BlzIsKeyPressed",
      () => true,
      () => Input.isKeyPressed(OSKEY_W),
    );
    expect(pressed).toBe(true);
    expect(stubCalls()).toContainCall("BlzIsKeyPressed(OSKEY_W)");
  });

  it("isMouseButtonPressed asks BlzIsMouseButtonPressed for the button", () => {
    const pressed = withNative(
      "BlzIsMouseButtonPressed",
      () => false,
      () => Input.isMouseButtonPressed(MOUSE_BUTTON_TYPE_LEFT),
    );
    expect(pressed).toBe(false);
    expect(stubCalls()).toContainCall(
      "BlzIsMouseButtonPressed(MOUSE_BUTTON_TYPE_LEFT)",
    );
  });

  it("isMetaKeyPressed passes the combined flags to BlzIsMetaKeyPressed", () => {
    const pressed = withNative(
      "BlzIsMetaKeyPressed",
      () => true,
      () => Input.isMetaKeyPressed(MetaKey.Shift | MetaKey.Ctrl),
    );
    expect(pressed).toBe(true);
    expect(stubCalls()).toContainCall("BlzIsMetaKeyPressed(3)");
  });

  it("mouseScreenX and mouseScreenY are what their Natives answer", () => {
    const x = withNative(
      "BlzGetMouseScreenPosX",
      () => 960,
      () => Input.mouseScreenX,
    );
    const y = withNative(
      "BlzGetMouseScreenPosY",
      () => 540,
      () => Input.mouseScreenY,
    );
    expect([x, y]).toEqual([960, 540]);
    expect(stubCalls()).toContainCall("BlzGetMouseScreenPosX()");
    expect(stubCalls()).toContainCall("BlzGetMouseScreenPosY()");
  });
});
