/** @noSelfInFile */

// The `Reforged` entry point: the dev-mode flag is off until `configure`
// sets it, a call that changes nothing is silent, and a call that changes
// the flag after the Map project registered a callback through the library
// warns and still records the value. The file's tests share one Lua state,
// in order: the flag they set stays set.

import { describe, expect, it } from "reforged-test/lua";
import { Init } from "../src/init/index";
import { Reforged } from "../src/reforged/index";
import { withPrint } from "./support/print-capture";

describe("Reforged.configure", () => {
  it("is off by default", () => {
    expect(Reforged.devMode).toBeFalsy();
  });

  it("records the flag, silently, before anything was registered", () => {
    const lines = withPrint(() => {
      Reforged.configure({ devMode: true });
    });
    expect(Reforged.devMode).toBeTruthy();
    expect(lines).toEqual([]);
  });

  it("prints nothing on a repeated call with the same value", () => {
    const lines = withPrint(() => {
      Reforged.configure({ devMode: true });
    });
    expect(Reforged.devMode).toBeTruthy();
    expect(lines).toEqual([]);
  });

  it("accepts an object with other fields, as the Template generates it", () => {
    const environment = { devMode: true, mapName: "probe", buildMode: "dev" };
    const lines = withPrint(() => {
      Reforged.configure(environment);
    });
    expect(Reforged.devMode).toBeTruthy();
    expect(lines).toEqual([]);
  });

  it("warns when the flag changes after a stage callback was registered, and still changes it", () => {
    Init.onGlobals(() => undefined, "a project callback");
    const lines = withPrint(() => {
      Reforged.configure({ devMode: false });
    });
    expect(Reforged.devMode).toBeFalsy();
    expect(lines).toEqual([
      'reforged-ts: Reforged.configure({ devMode: false }) called after a callback was registered (the first: Init.onGlobals "a project callback"): only later registrations see the new value',
    ]);
  });

  it("prints nothing on a repeated identical call, also when callbacks are registered", () => {
    const lines = withPrint(() => {
      Reforged.configure({ devMode: false });
      Reforged.configure({});
    });
    expect(Reforged.devMode).toBeFalsy();
    expect(lines).toEqual([]);
  });
});
