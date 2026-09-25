/** @noSelfInFile */

// Local-only code: `MapPlayer.runLocal` runs its function on the local
// player's client only. In Dev mode, inside it, what changes game state for
// one client (creating or destroying a Wrapper, `Group.for`, `Force.for`, a
// first `Frame.fromName`) raises, a visual call does not, and an error is
// reported without escaping; with Dev mode off none of it raises.

import { describe, expect, it } from "reforged-test/lua";
import {
  Force,
  Frame,
  Group,
  MapPlayer,
  Reforged,
  Timer,
  Unit,
} from "../src/index";
import { defined } from "./support/defined";
import { withNative } from "./support/native-override";
import { raisedIn } from "./support/raised-in";

// Dev mode raises for a Wrapper created before the globals Init stage.
__stub_init_globals();

const local = defined(MapPlayer.fromIndex(0), "MapPlayer.fromIndex(0)");
const remote = defined(MapPlayer.fromIndex(1), "MapPlayer.fromIndex(1)");
__stub_set_local_player(0);

function gameUi(): Frame {
  return defined(Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0), "the game UI");
}

/** The message a Guard raises for `action` inside `runLocal`. */
function localOnly(action: string): string {
  return `reforged-ts: ${action} inside MapPlayer.runLocal changes game state for one client, which desyncs the game: only visuals belong inside runLocal`;
}

/** What `body` printed. */
function printedBy(body: () => void): string[] {
  const before = __stub_printed().length;
  body();
  return __stub_printed().slice(before);
}

/** A frame the game has but no Wrapper was made for yet. */
let unnamed = 0;
function unwrappedFrameName(): string {
  unnamed++;
  const name = `Unwrapped${String(unnamed)}`;
  BlzCreateFrame(name, gameUi().handle, 0, 0);
  return name;
}

/** What each state-changing action raised inside `runLocal`, and on what. */
interface Inside {
  /** The id of the Unit destroyed inside, read before: a tombstone raises. */
  readonly unitId: number;
  readonly frameName: string;
  readonly results: { name: string; raised: string }[];
}

/** Runs each state-changing action inside `runLocal`. */
function stateChangesInside(): Inside {
  const unit = Unit.create(local, FourCC("hfoo"), 0, 0);
  const unitId = unit.id;
  const group = Group.create();
  const force = Force.create();
  const frameName = unwrappedFrameName();
  const results: { name: string; raised: string }[] = [];
  MapPlayer.runLocal(local, () => {
    results.push(
      {
        name: "Unit.create",
        raised: raisedIn(() => {
          Unit.create(local, FourCC("hfoo"), 0, 0);
        }),
      },
      {
        name: "Timer.create",
        raised: raisedIn(() => {
          Timer.create();
        }),
      },
      {
        name: "unit.destroy",
        raised: raisedIn(() => {
          unit.destroy();
        }),
      },
      {
        name: "group.for",
        raised: raisedIn(() => {
          group.for(() => undefined);
        }),
      },
      {
        name: "force.for",
        // ForForce has no stub: it only has to be reached.
        raised: withNative(
          "ForForce",
          () => undefined,
          () =>
            raisedIn(() => {
              force.for(() => undefined);
            }),
        ),
      },
      {
        name: "Frame.fromName",
        raised: raisedIn(() => {
          Frame.fromName(frameName, 0);
        }),
      },
    );
  });
  return { unitId, frameName, results };
}

describe("MapPlayer.runLocal", () => {
  for (const devMode of [false, true]) {
    it(`runs the function only on the local player's client (devMode ${String(devMode)})`, () => {
      Reforged.configure({ devMode });
      const ran: string[] = [];
      MapPlayer.runLocal(remote, () => {
        ran.push("remote");
      });
      MapPlayer.runLocal(local, () => {
        ran.push("local");
      });
      __stub_set_local_player(1);
      MapPlayer.runLocal(remote, () => {
        ran.push("remote, now local");
      });
      __stub_set_local_player(0);
      expect(ran).toEqual(["local", "remote, now local"]);
    });
  }
});

describe("runLocal in Dev mode", () => {
  it("raises for each action that changes game state, with the documented message at the calling line", () => {
    Reforged.configure({ devMode: true });
    const { unitId, frameName, results } = stateChangesInside();
    expect(results).toEqual([
      { name: "Unit.create", raised: localOnly("creating a Unit") },
      { name: "Timer.create", raised: localOnly("creating a Timer") },
      {
        name: "unit.destroy",
        raised: localOnly(`destroying Unit#${String(unitId)}`),
      },
      { name: "group.for", raised: localOnly("Group.for") },
      { name: "force.for", raised: localOnly("Force.for") },
      {
        name: "Frame.fromName",
        raised: localOnly(`the first Frame.fromName("${frameName}")`),
      },
    ]);
  });

  it("lets a frame looked up before be looked up again, and a visual call through", () => {
    Reforged.configure({ devMode: true });
    const name = unwrappedFrameName();
    const frame = defined(Frame.fromName(name, 0), name);
    const raised: string[] = [];
    // BlzFrameSetVisible has no stub: it only has to be reached.
    withNative(
      "BlzFrameSetVisible",
      () => undefined,
      () => {
        MapPlayer.runLocal(local, () => {
          raised.push(
            raisedIn(() => {
              Frame.fromName(name, 0);
            }),
            raisedIn(() => {
              frame.visible = false;
            }),
          );
        });
      },
    );
    expect(raised).toEqual(["(no error)", "(no error)"]);
  });

  it("reports an error inside the function without letting it escape, and restores the depth", () => {
    Reforged.configure({ devMode: true });
    const printed = printedBy(() => {
      MapPlayer.runLocal(local, () => {
        error("local failure", 0);
      });
      MapPlayer.runLocal(local, () => {
        Timer.create();
      });
    });
    expect(printed.length).toEqual(2);
    expect(printed[0]).toEqual(
      `reforged-ts: MapPlayer#${String(local.id)} MapPlayer.runLocal failed: local failure`,
    );
    // The Guard's error, reported with the test's `file:line:` before it.
    const guard = defined(printed[1], "the second line");
    expect(
      guard.startsWith(
        `reforged-ts: MapPlayer#${String(local.id)} MapPlayer.runLocal failed: `,
      ) && guard.endsWith(`: ${localOnly("creating a Timer")}`),
    ).toEqual(true);
    expect(
      raisedIn(() => {
        Timer.create();
      }),
    ).toEqual("(no error)");
  });
});

describe("runLocal with Dev mode off", () => {
  it("raises for none of the actions", () => {
    Reforged.configure({ devMode: false });
    const raised = stateChangesInside().results.map((result) => result.raised);
    expect(raised).toEqual([
      "(no error)",
      "(no error)",
      "(no error)",
      "(no error)",
      "(no error)",
      "(no error)",
    ]);
  });

  it("is the bare comparison: an error inside the function escapes", () => {
    Reforged.configure({ devMode: false });
    expect(() => {
      MapPlayer.runLocal(local, () => {
        error("local failure", 0);
      });
    }).toThrow("local failure");
  });
});
