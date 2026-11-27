// What the game does with a player's selection, for `game.select`,
// `game.deselect` and the selection Natives of the Shipped stubs of
// `reforged-test` (#984):
//
// 1. `SelectUnit` and `ClearSelection`: whether a selection event fires
//    before the Native returns, and whether `IsUnitSelected` and
//    `GroupEnumUnitsSelected` read the change on the line after it.
// 2. Which Triggers a selection and a deselection fire, in which order:
//    `EVENT_PLAYER_UNIT_SELECTED` and `EVENT_PLAYER_UNIT_DESELECTED` of the
//    player who selects and of the unit's owner, `EVENT_UNIT_SELECTED` and
//    `EVENT_UNIT_DESELECTED` of the unit. Two units have their unit events
//    registered before the players' events, four after.
// 3. What a handler reads: `GetTriggerUnit`, `GetTriggerPlayer`,
//    `GetTriggerEventId`, and whether the unit is selected by then, for
//    `IsUnitSelected` and for `GroupEnumUnitsSelected`.
// 4. What the game refuses: a unit already selected, a unit not selected, a
//    dead unit, another player's unit.
// 5. What a death and a removal do to the selection.
// 6. `GroupEnumUnitsSelected`: a group that held units, a filter, a player
//    who selected nothing.
//
// No Native selects for another player, so every selection is the local
// player's, `Player(0)`, made with `SelectUnit`. The run is a chain of
// steps, 1.5 seconds apart: each calls its Native, reads the state on the
// next line (`AFTER_STATE`), and the step after it first reads the state
// the events left (`SETTLED`).

import type { ProbeContext } from "../game/probe";

/** The seconds between two steps: the time a selection has to arrive. */
const SETTLE = 1.5;

/** One step: its name, and the call it makes. */
type Step = readonly [string, () => void];

export function run(p: ProbeContext): void {
  p.hold();

  function slot(index: number): player {
    const found = Player(index);
    if (found === undefined) error("Player returned nothing", 0);
    return found;
  }
  const local = slot(0);
  const foePlayer = slot(1);

  const names = new Map<unit, string>();
  const all: unit[] = [];
  function unitOf(owner: player, name: string, x: number): unit {
    const created = CreateUnit(owner, FourCC("hfoo"), x, -600, 0);
    if (created === undefined) error("CreateUnit returned nothing", 0);
    names.set(created, name);
    all.push(created);
    return created;
  }
  function nameOf(which: unit | undefined): string {
    if (which === undefined) return "nil";
    return names.get(which) ?? `unknown ${tostring(GetHandleId(which))}`;
  }
  function playerOf(who: player | undefined): string {
    return who === undefined ? "nil" : tostring(GetPlayerId(who));
  }

  const own = unitOf(local, "own", -300);
  const dead = unitOf(local, "dead", -150);
  const foe = unitOf(foePlayer, "foe", 0);
  const second = unitOf(local, "second", 150);
  const removed = unitOf(local, "removed", 300);
  const third = unitOf(local, "third", 450);

  let step = "setup";
  let inside = false;
  let order = 0;

  const eventNames = new Map<number, string>([
    [GetHandleId(EVENT_PLAYER_UNIT_SELECTED), "EVENT_PLAYER_UNIT_SELECTED"],
    [GetHandleId(EVENT_PLAYER_UNIT_DESELECTED), "EVENT_PLAYER_UNIT_DESELECTED"],
    [GetHandleId(EVENT_UNIT_SELECTED), "EVENT_UNIT_SELECTED"],
    [GetHandleId(EVENT_UNIT_DESELECTED), "EVENT_UNIT_DESELECTED"],
  ]);

  /** A Trigger that records each run of its condition and of its action. */
  function watcher(name: string): trigger {
    const self = CreateTrigger();
    function fired(part: string): void {
      order++;
      const subject = GetTriggerUnit();
      const event = GetTriggerEventId();
      const id = event === undefined ? -1 : GetHandleId(event);
      p.record("FIRE", {
        order,
        step,
        phase: inside ? "inside" : "after",
        trigger: name,
        part,
        unit: nameOf(subject),
        player: playerOf(GetTriggerPlayer()),
        event: eventNames.get(id) ?? `id ${tostring(id)}`,
        selected:
          subject === undefined
            ? "nil"
            : tostring(IsUnitSelected(subject, local)),
        alive: subject === undefined ? "nil" : tostring(UnitAlive(subject)),
        enumLocal: selection(local),
      });
    }
    TriggerAddCondition(
      self,
      Condition(() => {
        fired("condition");
        return true;
      }),
    );
    TriggerAddAction(self, () => {
      fired("action");
    });
    return self;
  }

  function watchUnit(which: unit): void {
    const name = nameOf(which);
    TriggerRegisterUnitEvent(
      watcher(`unit ${name} selected`),
      which,
      EVENT_UNIT_SELECTED,
    );
    TriggerRegisterUnitEvent(
      watcher(`unit ${name} deselected`),
      which,
      EVENT_UNIT_DESELECTED,
    );
  }
  function watchPlayer(who: player): void {
    const name = playerOf(who);
    TriggerRegisterPlayerUnitEvent(
      watcher(`player ${name} selected`),
      who,
      EVENT_PLAYER_UNIT_SELECTED,
      undefined,
    );
    TriggerRegisterPlayerUnitEvent(
      watcher(`player ${name} deselected`),
      who,
      EVENT_PLAYER_UNIT_DESELECTED,
      undefined,
    );
  }

  // The unit events of `own` and `dead` before the players' events, those
  // of `foe`, `second`, `removed` and `third` after.
  watchUnit(own);
  watchUnit(dead);
  watchPlayer(local);
  watchPlayer(foePlayer);
  watchUnit(foe);
  watchUnit(second);
  watchUnit(removed);
  watchUnit(third);

  /** The units a group holds, in its order. */
  function listed(which: group): string {
    const found: string[] = [];
    for (let index = 0; index < BlzGroupGetSize(which); index++) {
      found.push(nameOf(BlzGroupUnitAt(which, index)));
    }
    return found.length === 0 ? "none" : found.join(",");
  }

  /** What `GroupEnumUnitsSelected` answers for a player, in a new group. */
  function selection(who: player): string {
    const into = CreateGroup();
    GroupEnumUnitsSelected(into, who, undefined);
    const found = listed(into);
    DestroyGroup(into);
    return found;
  }

  function state(kind: string): void {
    const selected: string[] = [];
    for (const which of all) {
      if (IsUnitSelected(which, local)) selected.push(nameOf(which));
    }
    p.record(kind, {
      step,
      isUnitSelected: selected.length === 0 ? "none" : selected.join(","),
      enumLocal: selection(local),
      enumFoe: selection(foePlayer),
      fires: order,
    });
  }

  const steps: Step[] = [
    [
      "ClearSelection, at the start",
      () => {
        ClearSelection();
      },
    ],
    [
      "SelectUnit(own, true)",
      () => {
        SelectUnit(own, true);
      },
    ],
    [
      "SelectUnit(own, true), already selected",
      () => {
        SelectUnit(own, true);
      },
    ],
    [
      "SelectUnit(foe, true), another player's, own selected",
      () => {
        SelectUnit(foe, true);
      },
    ],
    [
      "SelectUnit(second, true)",
      () => {
        SelectUnit(second, true);
      },
    ],
    [
      "SelectUnit(own, false)",
      () => {
        SelectUnit(own, false);
      },
    ],
    [
      "SelectUnit(own, false), not selected",
      () => {
        SelectUnit(own, false);
      },
    ],
    [
      "ClearSelection, a unit selected",
      () => {
        ClearSelection();
      },
    ],
    [
      "ClearSelection, nothing selected",
      () => {
        ClearSelection();
      },
    ],
    [
      "SelectUnit(foe, true), nothing selected",
      () => {
        SelectUnit(foe, true);
      },
    ],
    [
      "SelectUnit(foe, false)",
      () => {
        SelectUnit(foe, false);
      },
    ],
    [
      "SelectUnit(second, true), before the foe",
      () => {
        SelectUnit(second, true);
      },
    ],
    [
      "SelectUnit(foe, true), second selected",
      () => {
        SelectUnit(foe, true);
      },
    ],
    [
      "ClearSelection, before the dead unit",
      () => {
        ClearSelection();
      },
    ],
    [
      "KillUnit(dead)",
      () => {
        KillUnit(dead);
      },
    ],
    [
      "SelectUnit(dead, true), a dead unit",
      () => {
        SelectUnit(dead, true);
      },
    ],
    [
      "SelectUnit(dead, false), a dead unit",
      () => {
        SelectUnit(dead, false);
      },
    ],
    [
      "SelectUnit(removed, true), before its removal",
      () => {
        SelectUnit(removed, true);
      },
    ],
    [
      "RemoveUnit(removed), selected",
      () => {
        RemoveUnit(removed);
      },
    ],
    [
      "SelectUnit(removed, true), a removed unit",
      () => {
        SelectUnit(removed, true);
      },
    ],
    [
      "SelectUnit(own, true), before its death",
      () => {
        SelectUnit(own, true);
      },
    ],
    [
      "KillUnit(own), selected",
      () => {
        KillUnit(own);
      },
    ],
    [
      "SelectUnit(second, true), for the groups",
      () => {
        SelectUnit(second, true);
      },
    ],
    [
      "SelectUnit(third, true), for the groups",
      () => {
        SelectUnit(third, true);
      },
    ],
  ];

  function groups(): void {
    step = "GroupEnumUnitsSelected";
    p.pending(step);

    // A group that already holds a unit the player did not select.
    const held = CreateGroup();
    GroupAddUnit(held, dead);
    GroupEnumUnitsSelected(held, local, undefined);
    p.record("GROUP", { case: "a group that held dead", units: listed(held) });

    // The same group, for a player who selected nothing.
    GroupEnumUnitsSelected(held, foePlayer, undefined);
    p.record("GROUP", {
      case: "the same group, for the foe's player",
      units: listed(held),
    });
    DestroyGroup(held);

    // A filter: what it reads, and what it keeps.
    const filtered = CreateGroup();
    const asked: string[] = [];
    const filter = Filter(() => {
      const which = GetFilterUnit();
      asked.push(nameOf(which));
      return which === third;
    });
    GroupEnumUnitsSelected(filtered, local, filter);
    p.record("GROUP", {
      case: "a filter that keeps third",
      units: listed(filtered),
      asked: asked.length === 0 ? "none" : asked.join(","),
    });
    DestroyGroup(filtered);

    p.record("MARK", { step: "done", fires: order });
    p.finish();
  }

  function next(index: number): void {
    if (index > 0) state("SETTLED");
    if (index >= steps.length) {
      groups();
      return;
    }
    const [name, act] = steps[index];
    step = name;
    p.pending(name);
    const before = order;
    inside = true;
    act();
    inside = false;
    p.record("AFTER", { step, firesInside: order - before });
    state("AFTER_STATE");
    p.checkpoint();
    p.after(SETTLE, () => {
      next(index + 1);
    });
  }

  p.record("IDS", {
    playerSelected: GetHandleId(EVENT_PLAYER_UNIT_SELECTED),
    playerDeselected: GetHandleId(EVENT_PLAYER_UNIT_DESELECTED),
    unitSelected: GetHandleId(EVENT_UNIT_SELECTED),
    unitDeselected: GetHandleId(EVENT_UNIT_DESELECTED),
  });
  state("START");
  p.checkpoint();
  p.after(SETTLE, () => {
    next(0);
  });
}
