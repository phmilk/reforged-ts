/** @noSelfInFile */

// The `Reforged` entry point: the dev-mode flag is off until `configure`
// sets it. A call after the Map project registered a callback through the
// library warns when Dev mode is or becomes on, and still records the value;
// with Dev mode off before and after, it is silent. So is the first call of
// a second load of the library that keeps the mode: a root executing twice.
// The file's tests share one Lua state, in order: the flag they set stays
// set.

import { describe, expect, it } from "reforged-test/lua";
import { Init } from "../src/init/index";
import { Reforged } from "../src/reforged/index";
import { withPrint } from "./support/print-capture";
import { reloadModules } from "./support/reload";

/** The warning a late `configure({ devMode })` prints. */
function lateWarning(devMode: boolean): string {
  return `reforged-ts: Reforged.configure({ devMode: ${String(devMode)} }) called after a callback was registered (the first: Init.onGlobals "a project callback"): call it first in the entry point; a callback keeps the mode it was registered under`;
}

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
    expect(lines).toEqual([lateWarning(false)]);
  });

  it("prints nothing on a repeated identical call, also when callbacks are registered", () => {
    const lines = withPrint(() => {
      Reforged.configure({ devMode: false });
      Reforged.configure({});
    });
    expect(Reforged.devMode).toBeFalsy();
    expect(lines).toEqual([]);
  });

  it("warns on every call in Dev mode after a registration, also one that changes nothing", () => {
    const lines = withPrint(() => {
      Reforged.configure({ devMode: true });
      Reforged.configure({ devMode: true, damageDepthLimit: 4 });
    });
    expect(Reforged.devMode).toBeTruthy();
    expect(lines).toEqual([lateWarning(true), lateWarning(true)]);
  });

  it("is silent on the first call of a second load that keeps the mode, and warns after it", () => {
    const second = reloadModules(
      "src.reforged.",
      "src.reforged.index",
    ) as typeof import("../src/reforged/index");
    const lines = withPrint(() => {
      second.Reforged.configure({ devMode: true });
    });
    expect(lines).toEqual([]);
    const later = withPrint(() => {
      second.Reforged.configure({ devMode: true });
    });
    expect(later).toEqual([lateWarning(true)]);
  });
});
