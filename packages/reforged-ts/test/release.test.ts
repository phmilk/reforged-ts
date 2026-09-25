/** @noSelfInFile */

// The release step of the Handle base: every `destroy()` calls its Native,
// then the base's shared release step, which removes the registry entry for
// the Handle. So a destroyed Handle never resolves to the dead Wrapper: a
// lookup with the same Handle afterwards makes a new one, in release and in
// Dev mode. One representative Wrapper per family.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import {
  Effect,
  Frame,
  Group,
  type Handle,
  MapPlayer,
  Timer,
  Trigger,
  Unit,
} from "../src/index";
import { Reforged } from "../src/reforged/index";
import { defined } from "./support/defined";
import { handleRef } from "./support/handle-ref";

/** A family's representative: how to make one and look it up again. */
interface Family {
  readonly name: string;
  readonly native: string;
  readonly kind: string;
  readonly create: () => Handle<handle> & { destroy(): unknown };
  readonly lookup: (handle: handle) => Handle<handle> | undefined;
}

const owner = defined(MapPlayer.fromIndex(0), "MapPlayer.fromIndex(0)");

function gameUi(): Frame {
  return defined(Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0), "the game UI");
}

const families: readonly Family[] = [
  {
    name: "Unit",
    native: "RemoveUnit",
    kind: "unit",
    create: () => Unit.create(owner, FourCC("hfoo"), 0, 0),
    lookup: (handle) => Unit.fromHandle(handle as unit),
  },
  {
    name: "Timer",
    native: "DestroyTimer",
    kind: "timer",
    create: () => Timer.create(),
    lookup: (handle) => Timer.fromHandle(handle as timer),
  },
  {
    name: "Group",
    native: "DestroyGroup",
    kind: "group",
    create: () => Group.create(),
    lookup: (handle) => Group.fromHandle(handle as group),
  },
  {
    name: "Effect",
    native: "DestroyEffect",
    kind: "effect",
    create: () => Effect.create("Abilities\\Spells\\Human\\Heal.mdl", 0, 0),
    lookup: (handle) => Effect.fromHandle(handle as effect),
  },
  {
    name: "Frame",
    native: "BlzDestroyFrame",
    kind: "framehandle",
    create: () => Frame.create("ReleasedFrame", gameUi(), 0, 0),
    lookup: (handle) => Frame.fromHandle(handle as framehandle),
  },
  {
    name: "Trigger",
    native: "DestroyTrigger",
    kind: "trigger",
    create: () => Trigger.create(),
    lookup: (handle) => Trigger.fromHandle(handle as trigger),
  },
];

for (const devMode of [false, true]) {
  const mode = devMode ? "in Dev mode" : "in release";

  describe(`destroy() ${mode}`, () => {
    for (const family of families) {
      it(`calls ${family.native}, then a lookup of the same ${family.name} Handle makes a new Wrapper`, () => {
        Reforged.configure({ devMode });
        const wrapper = family.create();
        expect(family.lookup(wrapper.handle)).toBe(wrapper);

        wrapper.destroy();

        expect(stubCalls()).toContainCall(
          `${family.native}(${handleRef(family.kind, wrapper.handle)})`,
        );
        const after = family.lookup(wrapper.handle);
        expect(after).toBeTruthy();
        expect(after === wrapper).toBeFalsy();
        expect(after?.handle).toBe(wrapper.handle);
        expect(family.lookup(wrapper.handle)).toBe(after);
      });
    }
  });
}
