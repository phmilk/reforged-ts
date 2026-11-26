// Which unit Natives fire their event inside the call (#938, for the Event
// dispatch of #933): `KillUnit`, `RemoveUnit`, `SetUnitOwner` and
// `UnitAddItem`, and beside them a lethal `UnitDamageTarget`,
// `UnitAddItemById` and `UnitRemoveItem`. Every Trigger carries a condition
// and an action, and each records, when it runs, whether the Native is still
// running (`phase`), its place among the firings (`order`) and what the
// response Natives answer. Each case then records what the Native returned
// and how many firings came before its return; a last record, 3 seconds
// later, counts the firings that came after a return.

import type { ProbeContext } from "../game/probe";

/** The players whose player unit events are watched: the owner and the new owner. */
const PLAYERS = [0, 1];

const PLAYER_UNIT_EVENTS: readonly (readonly [string, playerunitevent])[] = [
  ["EVENT_PLAYER_UNIT_DEATH", EVENT_PLAYER_UNIT_DEATH],
  ["EVENT_PLAYER_UNIT_DECAY", EVENT_PLAYER_UNIT_DECAY],
  ["EVENT_PLAYER_UNIT_HIDDEN", EVENT_PLAYER_UNIT_HIDDEN],
  ["EVENT_PLAYER_UNIT_DESELECTED", EVENT_PLAYER_UNIT_DESELECTED],
  ["EVENT_PLAYER_UNIT_CHANGE_OWNER", EVENT_PLAYER_UNIT_CHANGE_OWNER],
  ["EVENT_PLAYER_UNIT_PICKUP_ITEM", EVENT_PLAYER_UNIT_PICKUP_ITEM],
  ["EVENT_PLAYER_UNIT_DROP_ITEM", EVENT_PLAYER_UNIT_DROP_ITEM],
  ["EVENT_PLAYER_UNIT_USE_ITEM", EVENT_PLAYER_UNIT_USE_ITEM],
  ["EVENT_PLAYER_UNIT_DAMAGING", EVENT_PLAYER_UNIT_DAMAGING],
  ["EVENT_PLAYER_UNIT_DAMAGED", EVENT_PLAYER_UNIT_DAMAGED],
];

const UNIT_EVENTS: readonly (readonly [string, unitevent])[] = [
  ["EVENT_UNIT_DEATH", EVENT_UNIT_DEATH],
  ["EVENT_UNIT_DECAY", EVENT_UNIT_DECAY],
  ["EVENT_UNIT_HIDDEN", EVENT_UNIT_HIDDEN],
  ["EVENT_UNIT_CHANGE_OWNER", EVENT_UNIT_CHANGE_OWNER],
  ["EVENT_UNIT_PICKUP_ITEM", EVENT_UNIT_PICKUP_ITEM],
  ["EVENT_UNIT_DROP_ITEM", EVENT_UNIT_DROP_ITEM],
  ["EVENT_UNIT_DAMAGING", EVENT_UNIT_DAMAGING],
  ["EVENT_UNIT_DAMAGED", EVENT_UNIT_DAMAGED],
];

export function run(p: ProbeContext): void {
  p.hold();

  const names = new Map<unit | item, string>();
  let phase = "setup";
  let fires = 0;
  let firesAfterReturn = 0;

  function nameOf(handle: unit | item | undefined): string {
    if (handle === undefined) return "nil";
    return names.get(handle) ?? `unknown ${tostring(GetHandleId(handle))}`;
  }

  function playerOf(who: player | undefined): string {
    return who === undefined ? "nil" : tostring(GetPlayerId(who));
  }

  /** Records one firing: where it came, and what the response Natives answer. */
  function fired(
    event: string,
    registration: string,
    kind: string,
    eventId: eventid,
  ): void {
    fires += 1;
    if (phase === "after return") firesAfterReturn += 1;
    const order = fires;
    const [ok, problem] = pcall(() => {
      const triggerUnit = GetTriggerUnit();
      const manipulating = GetManipulatingUnit();
      const manipulated = GetManipulatedItem();
      p.record("fired", {
        event,
        registration,
        kind,
        phase,
        order,
        eventIdMatches: GetTriggerEventId() === eventId,
        GetTriggerUnit: nameOf(triggerUnit),
        GetTriggerPlayer: playerOf(GetTriggerPlayer()),
        GetDyingUnit: nameOf(GetDyingUnit()),
        GetKillingUnit: nameOf(GetKillingUnit()),
        GetChangingUnit: nameOf(GetChangingUnit()),
        GetChangingUnitPrevOwner: playerOf(GetChangingUnitPrevOwner()),
        GetManipulatingUnit: nameOf(manipulating),
        GetManipulatedItem: nameOf(manipulated),
        GetEventDamage: tostring(GetEventDamage()),
        alive:
          triggerUnit === undefined ? "-" : tostring(UnitAlive(triggerUnit)),
        life:
          triggerUnit === undefined
            ? "-"
            : tostring(GetWidgetLife(triggerUnit)),
        owner:
          triggerUnit === undefined
            ? "-"
            : playerOf(GetOwningPlayer(triggerUnit) as player | undefined),
        hasItem:
          manipulating === undefined || manipulated === undefined
            ? "-"
            : tostring(UnitHasItem(manipulating, manipulated)),
      });
    });
    if (!ok) {
      p.record("handler-error", {
        event,
        registration,
        kind,
        order,
        error: tostring(problem),
      });
    }
  }

  /** A Trigger whose condition and action both record their firing. */
  function watcher(
    event: string,
    registration: string,
    eventId: eventid,
  ): trigger {
    const t = CreateTrigger();
    TriggerAddCondition(
      t,
      Condition(() => {
        fired(event, registration, "condition", eventId);
        return true;
      }),
    );
    TriggerAddAction(t, () => {
      fired(event, registration, "action", eventId);
    });
    return t;
  }

  for (const index of PLAYERS) {
    const who = Player(index);
    if (who === undefined) error(`Player(${tostring(index)}) is nothing`, 0);
    for (const [name, event] of PLAYER_UNIT_EVENTS) {
      TriggerRegisterPlayerUnitEvent(
        watcher(name, `player ${tostring(index)}`, event),
        who,
        event,
      );
    }
  }

  const owner = Player(0);
  const other = Player(1);
  if (owner === undefined || other === undefined) {
    error("Player(0) or Player(1) is nothing", 0);
  }

  /** A unit of `Player(0)`, named, with every unit event and its widget death watched. */
  function unitOf(id: string, name: string): unit {
    const u = CreateUnit(owner!, FourCC(id), 0, 0, 0);
    if (u === undefined) error(`CreateUnit ${id} returned nothing`, 0);
    names.set(u, name);
    for (const [eventName, event] of UNIT_EVENTS) {
      TriggerRegisterUnitEvent(
        watcher(eventName, `unit ${name}`, event),
        u,
        event,
      );
    }
    TriggerRegisterDeathEvent(
      watcher(
        "TriggerRegisterDeathEvent",
        `widget ${name}`,
        EVENT_WIDGET_DEATH,
      ),
      u,
    );
    return u;
  }

  function itemOf(name: string): item {
    const it = CreateItem(FourCC("ratc"), 0, 0);
    if (it === undefined) error("CreateItem ratc returned nothing", 0);
    names.set(it, name);
    return it;
  }

  /** Runs one Native call and records what it returned and the firings before its return. */
  function measure(label: string, step: () => Record<string, string>): void {
    p.pending(label);
    const before = fires;
    phase = `during ${label}`;
    const [ok, result] = pcall(step);
    phase = "after return";
    const firedDuring = fires - before;
    if (ok) {
      p.record("returned", { case: label, firedDuring, ...result });
    } else {
      p.record("returned", {
        case: label,
        firedDuring,
        error: tostring(result),
      });
    }
    p.checkpoint();
  }

  function unitState(u: unit): Record<string, string> {
    return {
      aliveAfter: tostring(UnitAlive(u)),
      lifeAfter: tostring(GetWidgetLife(u)),
      ownerAfter: playerOf(GetOwningPlayer(u) as player | undefined),
      typeAfter: tostring(GetUnitTypeId(u)),
    };
  }

  // KillUnit
  const killed = unitOf("hfoo", "kill-live");
  phase = "after return";
  measure("KillUnit live", () => {
    KillUnit(killed);
    return unitState(killed);
  });
  measure("KillUnit dead", () => {
    KillUnit(killed);
    return unitState(killed);
  });

  // A lethal UnitDamageTarget: the death, with a killer.
  const knight = unitOf("hkni", "knight");
  const victim = unitOf("hfoo", "damage-victim");
  measure("UnitDamageTarget lethal", () => {
    const returned = UnitDamageTarget(
      knight,
      victim,
      10000,
      true,
      false,
      ATTACK_TYPE_NORMAL,
      DAMAGE_TYPE_NORMAL,
      WEAPON_TYPE_WHOKNOWS,
    );
    return { returned: tostring(returned), ...unitState(victim) };
  });

  // RemoveUnit
  const removed = unitOf("hfoo", "remove-live");
  measure("RemoveUnit live", () => {
    RemoveUnit(removed);
    return unitState(removed);
  });
  const corpse = unitOf("hfoo", "remove-dead");
  phase = "setup RemoveUnit dead";
  KillUnit(corpse);
  phase = "after return";
  measure("RemoveUnit dead", () => {
    RemoveUnit(corpse);
    return unitState(corpse);
  });

  // SetUnitOwner
  const changed = unitOf("hfoo", "owner-changed");
  measure("SetUnitOwner other player", () => {
    SetUnitOwner(changed, other, true);
    return unitState(changed);
  });
  const kept = unitOf("hfoo", "owner-kept");
  measure("SetUnitOwner same player", () => {
    SetUnitOwner(kept, owner, true);
    return unitState(kept);
  });

  // UnitAddItem, UnitAddItemById, UnitRemoveItem
  const hero = unitOf("Hpal", "hero");
  const claws = itemOf("claws");
  measure("UnitAddItem hero", () => {
    const returned = UnitAddItem(hero, claws);
    return {
      returned: tostring(returned),
      hasItemAfter: tostring(UnitHasItem(hero, claws)),
    };
  });
  measure("UnitAddItem carried item", () => {
    const returned = UnitAddItem(hero, claws);
    return { returned: tostring(returned) };
  });
  const footman = unitOf("hfoo", "no-inventory");
  const spare = itemOf("spare");
  measure("UnitAddItem no inventory", () => {
    const returned = UnitAddItem(footman, spare);
    return {
      returned: tostring(returned),
      hasItemAfter: tostring(UnitHasItem(footman, spare)),
    };
  });
  measure("UnitAddItemById hero", () => {
    const created = UnitAddItemById(hero, FourCC("ratc"));
    if (created !== undefined) names.set(created, "created-by-id");
    return {
      returned: created === undefined ? "nil" : "an item",
      hasItemAfter:
        created === undefined ? "-" : tostring(UnitHasItem(hero, created)),
    };
  });
  measure("UnitRemoveItem hero", () => {
    UnitRemoveItem(hero, claws);
    return { hasItemAfter: tostring(UnitHasItem(hero, claws)) };
  });

  p.after(3, () => {
    p.record("settled", { fires, firesAfterReturn });
    p.finish();
  });
}
