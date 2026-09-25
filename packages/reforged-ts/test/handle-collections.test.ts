/** @noSelfInFile */

// HandleMap and HandleSet: collections keyed by a Wrapper's Handle. An entry
// disappears when its key is destroyed (the base's release step tells every
// collection holding the Handle), is found through the upgraded `Unit` of a
// Handle first seen as a `Widget`, and iterates in insertion order. Every
// case runs in release and in Dev mode.

import { describe, expect, it } from "reforged-test/lua";
import { HandleMap, HandleSet, MapPlayer, Unit, Widget } from "../src/index";
import { Reforged } from "../src/reforged/index";
import { holderCount } from "../src/system/handlekeys";
import { defined } from "./support/defined";
import { withNative } from "./support/native-override";

// Dev mode raises for a Wrapper created before the globals Init stage.
__stub_init_globals();

const owner = defined(MapPlayer.fromIndex(0), "MapPlayer.fromIndex(0)");
const footman = FourCC("hfoo");

function footmanAt(x: number): Unit {
  return Unit.create(owner, footman, x, 0);
}

/** A Widget from `Widget.fromEvent()` for a fresh unit, not yet a `Unit`. */
function widgetOfFreshUnit(): Widget {
  const handle = defined(
    CreateUnit(owner.handle, footman, 0, 0, 0),
    "CreateUnit",
  );
  return defined(
    withNative(
      "GetTriggerWidget",
      () => handle,
      () => Widget.fromEvent(),
    ),
    "Widget.fromEvent",
  );
}

for (const devMode of [false, true]) {
  const mode = devMode ? "in Dev mode" : "in release";

  describe(`HandleMap ${mode}`, () => {
    it("drops the entry of a unit on unit.destroy()", () => {
      Reforged.configure({ devMode });
      const map = new HandleMap<Unit, string>();
      const doomed = footmanAt(0);
      const kept = footmanAt(1);
      map.set(doomed, "doomed").set(kept, "kept");

      doomed.destroy();

      expect(map.has(doomed)).toEqual(false);
      expect(map.get(doomed)).toBeUndefined();
      expect(map.size).toEqual(1);
      expect([...map.keys()]).toEqual([kept]);
      expect(map.get(kept)).toEqual("kept");
      expect(holderCount(doomed.handle)).toEqual(0);
    });

    it("drops the unit from every map holding it", () => {
      Reforged.configure({ devMode });
      const first = new HandleMap<Unit, number>();
      const second = new HandleMap<Unit, number>();
      const unit = footmanAt(0);
      first.set(unit, 1);
      second.set(unit, 2);
      expect(holderCount(unit.handle)).toEqual(2);

      unit.destroy();

      expect(first.size).toEqual(0);
      expect(second.size).toEqual(0);
    });

    it("finds an entry set through a Widget through the upgraded Unit", () => {
      Reforged.configure({ devMode });
      const map = new HandleMap<Widget, string>();
      const widget = widgetOfFreshUnit();
      map.set(widget, "hit");

      const unit = defined(
        Unit.fromHandle(widget.handle as unit),
        "Unit.fromHandle",
      );
      expect(unit === widget).toEqual(false);

      expect(map.get(unit)).toEqual("hit");
      expect(map.has(unit)).toEqual(true);
      const keys = [...map.keys()];
      expect(keys.length).toEqual(1);
      expect(keys[0]).toBe(unit);

      unit.destroy();
      expect(map.size).toEqual(0);
    });

    it("iterates in insertion order, a re-set key keeping its place", () => {
      Reforged.configure({ devMode });
      const map = new HandleMap<Unit, number>();
      const units = [footmanAt(0), footmanAt(1), footmanAt(2), footmanAt(3)];
      map
        .set(units[3], 3)
        .set(units[0], 0)
        .set(units[2], 2)
        .set(units[1], 1)
        .set(units[0], 10);

      expect([...map.values()]).toEqual([3, 10, 2, 1]);
      expect([...map.keys()]).toEqual([units[3], units[0], units[2], units[1]]);
      const seen: number[] = [];
      map.forEach((value) => {
        seen.push(value);
      });
      expect(seen).toEqual([3, 10, 2, 1]);
      const pairs: [Unit, number][] = [];
      for (const entry of map) {
        pairs.push(entry);
      }
      expect(pairs).toEqual([
        [units[3], 3],
        [units[0], 10],
        [units[2], 2],
        [units[1], 1],
      ]);
    });

    it("goes on past an entry destroyed during the loop", () => {
      Reforged.configure({ devMode });
      const map = new HandleMap<Unit, number>();
      const units = [footmanAt(0), footmanAt(1), footmanAt(2)];
      units.forEach((unit, index) => map.set(unit, index));

      const seen: number[] = [];
      map.forEach((value) => {
        seen.push(value);
        if (value === 0) {
          units[1].destroy();
        }
      });

      expect(seen).toEqual([0, 2]);
    });

    it("leaves nothing to notify after delete, before destroy()", () => {
      Reforged.configure({ devMode });
      const map = new HandleMap<Unit, number>();
      const unit = footmanAt(0);
      map.set(unit, 1);
      expect(holderCount(unit.handle)).toEqual(1);

      expect(map.delete(unit)).toEqual(true);
      expect(holderCount(unit.handle)).toEqual(0);
      expect(map.delete(unit)).toEqual(false);

      unit.destroy();
      expect(map.size).toEqual(0);
    });

    it("leaves nothing to notify after clear", () => {
      Reforged.configure({ devMode });
      const map = new HandleMap<Unit, number>();
      const units = [footmanAt(0), footmanAt(1)];
      units.forEach((unit, index) => map.set(unit, index));

      map.clear();

      expect(map.size).toEqual(0);
      expect(holderCount(units[0].handle)).toEqual(0);
      expect(holderCount(units[1].handle)).toEqual(0);
    });
  });

  describe(`HandleSet ${mode}`, () => {
    it("drops a unit on unit.destroy()", () => {
      Reforged.configure({ devMode });
      const set = new HandleSet<Unit>();
      const doomed = footmanAt(0);
      const kept = footmanAt(1);
      set.add(doomed).add(kept);

      doomed.destroy();

      expect(set.has(doomed)).toEqual(false);
      expect([...set]).toEqual([kept]);
      expect(holderCount(doomed.handle)).toEqual(0);
    });

    it("has a Widget added before the upgrade, as the Unit", () => {
      Reforged.configure({ devMode });
      const set = new HandleSet<Widget>();
      const widget = widgetOfFreshUnit();
      set.add(widget);

      const unit = defined(
        Unit.fromHandle(widget.handle as unit),
        "Unit.fromHandle",
      );

      expect(set.has(unit)).toEqual(true);
      const members = [...set.values()];
      expect(members.length).toEqual(1);
      expect(members[0]).toBe(unit);
    });

    it("iterates in insertion order, a re-added member keeping its place", () => {
      Reforged.configure({ devMode });
      const set = new HandleSet<Unit>();
      const units = [footmanAt(0), footmanAt(1), footmanAt(2)];
      set.add(units[2]).add(units[0]).add(units[1]).add(units[2]);

      expect([...set]).toEqual([units[2], units[0], units[1]]);
      const seen: Unit[] = [];
      set.forEach((member) => {
        seen.push(member);
      });
      expect(seen).toEqual([units[2], units[0], units[1]]);
      expect([...set.entries()]).toEqual([
        [units[2], units[2]],
        [units[0], units[0]],
        [units[1], units[1]],
      ]);
    });

    it("leaves nothing to notify after delete, before destroy()", () => {
      Reforged.configure({ devMode });
      const set = new HandleSet<Unit>();
      const unit = footmanAt(0);
      set.add(unit);

      expect(set.delete(unit)).toEqual(true);
      expect(holderCount(unit.handle)).toEqual(0);

      unit.destroy();
      expect(set.size).toEqual(0);
    });

    it("leaves nothing to notify after clear", () => {
      Reforged.configure({ devMode });
      const set = new HandleSet<Unit>();
      const unit = footmanAt(0);
      set.add(unit);

      set.clear();

      expect(set.size).toEqual(0);
      expect(holderCount(unit.handle)).toEqual(0);
    });
  });
}
