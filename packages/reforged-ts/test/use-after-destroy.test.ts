/** @noSelfInFile */

// Use after destroy: in Dev mode the release step turns the destroyed
// Wrapper into a tombstone. Its fields, the Handle included, are gone, and
// any later access (a property, a method, the Handle, a second `destroy()`)
// raises `reforged-ts: used after destroy: <Class>#<id>` at the line of the
// access; `tostring` renders `<Class>#<id> (destroyed)`. With Dev mode off
// the Wrapper is left as it was.

import { describe, expect, it } from "reforged-test/lua";
import { MapPlayer, Timer, Unit } from "../src/index";
import { Reforged } from "../src/reforged/index";
import { defined } from "./support/defined";
import { raisedIn } from "./support/raised-in";

// Dev mode raises for a Wrapper created before the globals Init stage.
__stub_init_globals();

const owner = defined(MapPlayer.fromIndex(0), "MapPlayer.fromIndex(0)");

/** A destroyed unit, and the message its tombstone raises. */
function destroyedUnit(): { unit: Unit; message: string } {
  const unit = Unit.create(owner, FourCC("hfoo"), 0, 0);
  const message = `reforged-ts: used after destroy: Unit#${String(unit.id)}`;
  unit.destroy();
  return { unit, message };
}

describe("use after destroy in Dev mode", () => {
  it("raises on reading a property, at the reading line", () => {
    Reforged.configure({ devMode: true });
    const { unit, message } = destroyedUnit();

    expect(
      raisedIn(() => {
        tostring(unit.armor);
      }),
    ).toEqual(message);
  });

  it("raises on calling a method", () => {
    Reforged.configure({ devMode: true });
    const { unit, message } = destroyedUnit();

    expect(
      raisedIn(() => {
        unit.kill();
      }),
    ).toEqual(message);
  });

  it("raises on reading the Handle", () => {
    Reforged.configure({ devMode: true });
    const { unit, message } = destroyedUnit();

    expect(
      raisedIn(() => {
        tostring(unit.handle);
      }),
    ).toEqual(message);
  });

  it("raises on a second destroy()", () => {
    Reforged.configure({ devMode: true });
    const { unit, message } = destroyedUnit();

    expect(
      raisedIn(() => {
        unit.destroy();
      }),
    ).toEqual(message);
  });

  it("raises on writing a field and on calling the Wrapper", () => {
    Reforged.configure({ devMode: true });
    const { unit, message } = destroyedUnit();

    expect(
      raisedIn(() => {
        (unit as unknown as { extra: number }).extra = 1;
      }),
    ).toEqual(message);
    expect(
      raisedIn(() => {
        (unit as unknown as () => void)();
      }),
    ).toEqual(message);
  });

  it("keeps no field of its own, the Handle included", () => {
    Reforged.configure({ devMode: true });
    const { unit } = destroyedUnit();

    expect(
      rawget(unit as unknown as Record<string, unknown>, "handle"),
    ).toBeUndefined();
    expect(
      next(unit as unknown as LuaTable<string, unknown>)[0],
    ).toBeUndefined();
  });

  it("renders the destroyed marker through tostring", () => {
    Reforged.configure({ devMode: true });
    const timer = Timer.create();
    const id = timer.id;
    timer.destroy();

    expect(tostring(timer)).toEqual(`Timer#${String(id)} (destroyed)`);
  });
});

describe("use after destroy in release", () => {
  it("leaves the Wrapper readable: property, method, Handle and a second destroy()", () => {
    Reforged.configure({ devMode: false });
    const unit = Unit.create(owner, FourCC("hfoo"), 0, 0);
    const handle = unit.handle;
    unit.destroy();

    expect(unit.handle).toBe(handle);
    expect(unit.typeId).toEqual(FourCC("hfoo"));
    expect(unit.getOwner()).toBe(owner);
    expect(
      raisedIn(() => {
        unit.destroy();
      }),
    ).toEqual("(no error)");
    expect(string.find(tostring(unit), "destroyed")[0]).toBeUndefined();
  });
});
