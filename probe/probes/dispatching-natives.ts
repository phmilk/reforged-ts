// Five facts of the Dispatching Natives of `reforged-test` (#982) that the
// Probe of unit event timing (`docs/research/unit-event-timing.md`) did not
// measure:
//
// 1. One unit event with a Trigger on the player's event and a Trigger on
//    the unit's event: which runs first. Each event is tried with the two
//    registration orders and, for each, the two orders the Triggers were
//    created in, so the answer is told apart from both. The death is tried
//    with the widget death as a third registration, in its six orders.
// 2. `UnitAddItemById` on a unit without an inventory: what it returns,
//    whether the item exists afterwards, which events fire.
// 3. `UnitRemoveItem` of an item the unit does not carry: which events
//    fire, and what a handler reads.
// 4. `UnitRemoveItemFromSlot`: what it returns and which events fire, on a
//    filled slot and on an empty one.
// 5. `GetTriggerWidget` in a handler of the widget's death.
//
// The cases of the first fact make their own Triggers and destroy them.
// The others share watchers registered once: for `Player(0)`, one Trigger
// per player unit event below; for every unit, one Trigger per unit event
// below and one widget death Trigger. Each watcher has a condition and an
// action, and each records, when it runs, the case, whether the Native is
// still running (`phase`) and what the response Natives answer. A last
// record, 3 seconds later, counts the firings that came after a return.

import type { ProbeContext } from "../game/probe";

const PLAYER_UNIT_EVENTS: readonly (readonly [string, playerunitevent])[] = [
  ["EVENT_PLAYER_UNIT_DEATH", EVENT_PLAYER_UNIT_DEATH],
  ["EVENT_PLAYER_UNIT_PICKUP_ITEM", EVENT_PLAYER_UNIT_PICKUP_ITEM],
  ["EVENT_PLAYER_UNIT_DROP_ITEM", EVENT_PLAYER_UNIT_DROP_ITEM],
  ["EVENT_PLAYER_UNIT_USE_ITEM", EVENT_PLAYER_UNIT_USE_ITEM],
  ["EVENT_PLAYER_UNIT_PAWN_ITEM", EVENT_PLAYER_UNIT_PAWN_ITEM],
  ["EVENT_PLAYER_UNIT_SELL_ITEM", EVENT_PLAYER_UNIT_SELL_ITEM],
  ["EVENT_PLAYER_UNIT_STACK_ITEM", EVENT_PLAYER_UNIT_STACK_ITEM],
];

const UNIT_EVENTS: readonly (readonly [string, unitevent])[] = [
  ["EVENT_UNIT_DEATH", EVENT_UNIT_DEATH],
  ["EVENT_UNIT_PICKUP_ITEM", EVENT_UNIT_PICKUP_ITEM],
  ["EVENT_UNIT_DROP_ITEM", EVENT_UNIT_DROP_ITEM],
  ["EVENT_UNIT_USE_ITEM", EVENT_UNIT_USE_ITEM],
];

/** A registration of a case of the first fact. */
type Registration = "player" | "unit" | "widget";

/** One event of the first fact: how it is registered and fired. */
interface OrderedEvent {
  readonly name: string;
  /** The unit the case fires the event on, made before the registrations. */
  readonly subject: () => unit;
  /** The player whose player unit event fires. */
  readonly player: player;
  readonly playerEvent: playerunitevent;
  readonly unitEvent: unitevent;
  readonly fire: (subject: unit) => void;
}

const CLAWS = FourCC("ratc");

export function run(p: ProbeContext): void {
  p.hold();

  function slot(index: number): player {
    const found = Player(index);
    if (found === undefined) error("Player returned nothing", 0);
    return found;
  }
  const owner = slot(0);
  const other = slot(1);

  const names = new Map<unit | item, string>();
  function unitOf(typeId: string, name: string): unit {
    const created = CreateUnit(owner, FourCC(typeId), 0, 0, 0);
    if (created === undefined) error("CreateUnit returned nothing", 0);
    names.set(created, name);
    return created;
  }
  function claws(name: string): item {
    const created = CreateItem(CLAWS, 0, 0);
    if (created === undefined) error("CreateItem returned nothing", 0);
    names.set(created, name);
    return created;
  }
  function nameOf(handle: unit | item | undefined): string {
    if (handle === undefined) return "nil";
    return names.get(handle) ?? `unknown ${tostring(GetHandleId(handle))}`;
  }
  function playerOf(who: player | undefined): string {
    return who === undefined ? "nil" : tostring(GetPlayerId(who));
  }

  // The first fact: the player's event and the unit's, in every order.

  function ordered(
    event: OrderedEvent,
    created: readonly Registration[],
    registered: readonly Registration[],
  ): void {
    const label = `${event.name}, created ${created.join(">")}, registered ${registered.join(">")}`;
    p.pending(label);
    const subject = event.subject();
    const log: string[] = [];
    const triggers = new Map<Registration, trigger>();
    for (const registration of created) {
      const self = CreateTrigger();
      TriggerAddCondition(
        self,
        Condition(() => {
          log.push(`${registration}:condition`);
          return true;
        }),
      );
      TriggerAddAction(self, () => {
        log.push(`${registration}:action`);
      });
      triggers.set(registration, self);
    }
    for (const registration of registered) {
      const self = triggers.get(registration);
      if (self === undefined) error("a registration without its Trigger", 0);
      if (registration === "player") {
        TriggerRegisterPlayerUnitEvent(
          self,
          event.player,
          event.playerEvent,
          undefined,
        );
      } else if (registration === "unit") {
        TriggerRegisterUnitEvent(self, subject, event.unitEvent);
      } else {
        TriggerRegisterDeathEvent(self, subject);
      }
    }
    event.fire(subject);
    p.record("ORDER", {
      event: event.name,
      created: created.join(">"),
      registered: registered.join(">"),
      ran: log.join(","),
    });
    for (const [, self] of triggers) DestroyTrigger(self);
    p.checkpoint();
  }

  const death: OrderedEvent = {
    name: "death",
    subject: () => unitOf("hfoo", "death footman"),
    player: owner,
    playerEvent: EVENT_PLAYER_UNIT_DEATH,
    unitEvent: EVENT_UNIT_DEATH,
    fire: (subject) => {
      KillUnit(subject);
    },
  };
  const DEATH_ORDERS: readonly (readonly Registration[])[] = [
    ["player", "unit", "widget"],
    ["player", "widget", "unit"],
    ["unit", "player", "widget"],
    ["unit", "widget", "player"],
    ["widget", "player", "unit"],
    ["widget", "unit", "player"],
  ];
  for (const registered of DEATH_ORDERS) {
    ordered(death, registered, registered);
    ordered(death, [...registered].reverse(), registered);
  }

  // The item of the pickup and of the drop cases, one per case.
  let handled: item | undefined;
  const pairs: readonly OrderedEvent[] = [
    {
      name: "change owner",
      subject: () => unitOf("hfoo", "change owner footman"),
      // The change of owner is the new owner's event.
      player: other,
      playerEvent: EVENT_PLAYER_UNIT_CHANGE_OWNER,
      unitEvent: EVENT_UNIT_CHANGE_OWNER,
      fire: (subject) => {
        SetUnitOwner(subject, other, true);
        // A unit of Player(1) left among Player(0)'s would start a fight.
        RemoveUnit(subject);
      },
    },
    {
      name: "pickup",
      subject: () => {
        handled = claws("claws");
        return unitOf("Hpal", "pickup paladin");
      },
      player: owner,
      playerEvent: EVENT_PLAYER_UNIT_PICKUP_ITEM,
      unitEvent: EVENT_UNIT_PICKUP_ITEM,
      fire: (subject) => {
        if (handled === undefined) error("no item to add", 0);
        UnitAddItem(subject, handled);
        RemoveUnit(subject);
      },
    },
    {
      name: "drop",
      subject: () => {
        const carrier = unitOf("Hpal", "drop paladin");
        handled = claws("claws");
        // Before the registrations: this pickup is not the case's event.
        UnitAddItem(carrier, handled);
        return carrier;
      },
      player: owner,
      playerEvent: EVENT_PLAYER_UNIT_DROP_ITEM,
      unitEvent: EVENT_UNIT_DROP_ITEM,
      fire: (subject) => {
        if (handled === undefined) error("no item to remove", 0);
        UnitRemoveItem(subject, handled);
        RemoveUnit(subject);
      },
    },
  ];
  for (const event of pairs) {
    ordered(event, ["player", "unit"], ["player", "unit"]);
    ordered(event, ["unit", "player"], ["player", "unit"]);
    ordered(event, ["unit", "player"], ["unit", "player"]);
    ordered(event, ["player", "unit"], ["unit", "player"]);
  }

  // The other facts: watchers registered once, read case by case.

  let current = "setup";
  let phase = "setup";
  let fires = 0;
  let firesAfterReturn = 0;
  /** What GetTriggerWidget answered in the firing before, when not nil. */
  let lastWidget: widget | undefined;

  function fired(event: string, registration: string, kind: string): void {
    fires += 1;
    if (phase === "after return") firesAfterReturn += 1;
    const order = fires;
    const [ok, problem] = pcall(() => {
      const triggerUnit = GetTriggerUnit();
      const triggerWidget = GetTriggerWidget();
      const manipulating = GetManipulatingUnit();
      const manipulated = GetManipulatedItem();
      p.record("fired", {
        case: current,
        event,
        registration,
        kind,
        phase,
        order,
        GetTriggerUnit: nameOf(triggerUnit),
        // How the widget is the unit: by `==`, by raw equality, by its
        // handle id, and as the key of a table keyed by the unit.
        GetTriggerWidget:
          triggerWidget === undefined ? "nil" : tostring(triggerWidget),
        triggerUnitText: tostring(triggerUnit),
        widgetEqualsUnit:
          triggerWidget === undefined || triggerUnit === undefined
            ? "-"
            : tostring((triggerWidget as unknown) === triggerUnit),
        widgetRawEqualsUnit:
          triggerWidget === undefined || triggerUnit === undefined
            ? "-"
            : tostring(rawequal(triggerWidget, triggerUnit)),
        widgetHasUnitsHandleId:
          triggerWidget === undefined || triggerUnit === undefined
            ? "-"
            : tostring(GetHandleId(triggerWidget) === GetHandleId(triggerUnit)),
        // Map.get reads the key raw; Map.has would also compare by `==`.
        widgetIsKeyOfUnit:
          triggerWidget === undefined
            ? "-"
            : tostring(names.get(triggerWidget as unit) !== undefined),
        widgetRawEqualsLastWidget:
          triggerWidget === undefined || lastWidget === undefined
            ? "-"
            : tostring(rawequal(triggerWidget, lastWidget)),
        GetTriggerPlayer: playerOf(GetTriggerPlayer()),
        GetDyingUnit: nameOf(GetDyingUnit()),
        GetKillingUnit: nameOf(GetKillingUnit()),
        GetManipulatingUnit: nameOf(manipulating),
        GetManipulatedItem: nameOf(manipulated),
        alive:
          triggerUnit === undefined ? "-" : tostring(UnitAlive(triggerUnit)),
        hasItem:
          manipulating === undefined || manipulated === undefined
            ? "-"
            : tostring(UnitHasItem(manipulating, manipulated)),
        slot0:
          manipulating === undefined
            ? "-"
            : nameOf(UnitItemInSlot(manipulating, 0)),
        itemOwned:
          manipulated === undefined ? "-" : tostring(IsItemOwned(manipulated)),
      });
    });
    lastWidget = GetTriggerWidget() ?? lastWidget;
    if (!ok) {
      p.record("handler-error", {
        case: current,
        event,
        registration,
        kind,
        order,
        error: tostring(problem),
      });
    }
  }

  function watcher(event: string, registration: string): trigger {
    const self = CreateTrigger();
    TriggerAddCondition(
      self,
      Condition(() => {
        fired(event, registration, "condition");
        return true;
      }),
    );
    TriggerAddAction(self, () => {
      fired(event, registration, "action");
    });
    return self;
  }

  for (const [name, event] of PLAYER_UNIT_EVENTS) {
    TriggerRegisterPlayerUnitEvent(
      watcher(name, "player 0"),
      owner,
      event,
      undefined,
    );
  }

  /** A unit with the unit watchers and the widget death watcher on it. */
  function watched(typeId: string, name: string): unit {
    const created = unitOf(typeId, name);
    for (const [eventName, event] of UNIT_EVENTS) {
      TriggerRegisterUnitEvent(watcher(eventName, name), created, event);
    }
    TriggerRegisterDeathEvent(watcher("widget death", name), created);
    p.record("unit", {
      name,
      typeId,
      inventorySize: UnitInventorySize(created),
    });
    return created;
  }

  /** The items EnumItemsInRect finds on the whole map. */
  function itemsOnTheMap(): item[] {
    const found: item[] = [];
    EnumItemsInRect(GetWorldBounds(), undefined, () => {
      const each = GetEnumItem();
      if (each !== undefined) found.push(each);
    });
    return found;
  }

  /** What is read of an item, each field prefixed: `nil` alone for none. */
  function itemFields(
    prefix: string,
    read: item | undefined,
  ): Record<string, string | number | boolean> {
    if (read === undefined) return { [prefix]: "nil" };
    return {
      [prefix]: nameOf(read),
      [`${prefix}IsClaws`]: GetItemTypeId(read) === CLAWS,
      [`${prefix}Owned`]: IsItemOwned(read),
      [`${prefix}Visible`]: IsItemVisible(read),
      [`${prefix}Life`]: tostring(GetWidgetLife(read)),
      [`${prefix}X`]: tostring(GetItemX(read)),
      [`${prefix}Y`]: tostring(GetItemY(read)),
    };
  }

  /**
   * Runs one case: `act` calls the Native and answers what to record of the
   * state on the line after it.
   */
  function measure(
    label: string,
    act: () => Record<string, string | number | boolean>,
  ): void {
    p.pending(label);
    current = label;
    phase = "inside";
    const before = fires;
    const fields = act();
    phase = "after return";
    p.record("case", { ...fields, case: label, firedInside: fires - before });
    p.checkpoint();
  }

  /** A step between cases: its firings are recorded under its own label. */
  function setup(label: string, act: () => void): void {
    current = `setup: ${label}`;
    phase = "setup";
    act();
    phase = "after return";
  }

  const footman = watched("hfoo", "footman");
  const paladin = watched("Hpal", "paladin");
  const carrier = watched("Hpal", "carrier");
  const dying = watched("hfoo", "dying");

  // The fifth fact: GetTriggerWidget in the three death handlers.
  measure("KillUnit(dying)", () => {
    KillUnit(dying);
    return { alive: UnitAlive(dying) };
  });

  // Beside the fifth fact: whether a unit read as a widget is the unit, with
  // no event, through a hashtable, which stores a Handle under either type.
  p.pending("a unit read as a widget from a hashtable");
  const table = InitHashtable();
  SaveUnitHandle(table, 0, 0, paladin);
  SaveWidgetHandle(table, 0, 1, paladin);
  const asUnit = LoadUnitHandle(table, 0, 0);
  const asWidget = LoadWidgetHandle(table, 0, 1);
  const asWidgetAgain = LoadWidgetHandle(table, 0, 1);
  p.record("handle", {
    unitText: tostring(paladin),
    asUnitText: tostring(asUnit),
    asWidgetText: tostring(asWidget),
    asUnitEqualsUnit: (asUnit as unknown) === paladin,
    asUnitRawEqualsUnit: rawequal(asUnit, paladin),
    asUnitIsKeyOfUnit: asUnit !== undefined && names.get(asUnit) !== undefined,
    asWidgetEqualsUnit: (asWidget as unknown) === paladin,
    asWidgetRawEqualsUnit: rawequal(asWidget, paladin),
    asWidgetIsKeyOfUnit:
      asWidget !== undefined && names.get(asWidget as unit) !== undefined,
    asWidgetRawEqualsAsWidgetAgain: rawequal(asWidget, asWidgetAgain),
  });
  p.checkpoint();

  // The second fact: a footman has no inventory.
  measure("UnitAddItemById(footman, ratc), no inventory", () => {
    const before = itemsOnTheMap();
    const returned = UnitAddItemById(footman, CLAWS);
    if (returned !== undefined) names.set(returned, "made for the footman");
    // The item the call left on the map, when it returned none.
    const after = itemsOnTheMap();
    const appeared = after.filter((each) => !before.includes(each));
    if (returned === undefined && appeared[0] !== undefined) {
      names.set(appeared[0], "appeared");
    }
    return {
      ...itemFields("returned", returned),
      ...itemFields("appeared", appeared[0]),
      appearedCount: appeared.length,
      footmanX: tostring(GetUnitX(footman)),
      footmanY: tostring(GetUnitY(footman)),
      itemsBefore: before.length,
      itemsAfter: after.length,
      footmanHasIt:
        returned === undefined ? "-" : tostring(UnitHasItem(footman, returned)),
      slot0: nameOf(UnitItemInSlot(footman, 0)),
    };
  });
  // The measured case of unit-event-timing.md, beside it.
  const refused = claws("refused");
  measure("UnitAddItem(footman, refused), no inventory", () => {
    const itemsBefore = itemsOnTheMap().length;
    const returned = UnitAddItem(footman, refused);
    return {
      returned,
      itemsBefore,
      itemsAfter: itemsOnTheMap().length,
      footmanHasIt: UnitHasItem(footman, refused),
      ...itemFields("item", refused),
    };
  });
  // A unit with an inventory, beside them.
  let first: item | undefined;
  measure("UnitAddItemById(paladin, ratc)", () => {
    const itemsBefore = itemsOnTheMap().length;
    first = UnitAddItemById(paladin, CLAWS);
    if (first !== undefined) names.set(first, "first");
    return {
      ...itemFields("returned", first),
      itemsBefore,
      itemsAfter: itemsOnTheMap().length,
      paladinHasIt:
        first === undefined ? "-" : tostring(UnitHasItem(paladin, first)),
      slot0: nameOf(UnitItemInSlot(paladin, 0)),
    };
  });
  if (first === undefined) error("UnitAddItemById gave the paladin nothing", 0);
  const carried = first;

  // The third fact: an item the unit does not carry.
  const ground = claws("ground");
  measure("UnitRemoveItem(paladin, ground), an item on the ground", () => {
    UnitRemoveItem(paladin, ground);
    return {
      paladinHasIt: UnitHasItem(paladin, ground),
      slot0: nameOf(UnitItemInSlot(paladin, 0)),
      ...itemFields("item", ground),
    };
  });
  const others = claws("others");
  setup("UnitAddItem(carrier, others)", () => {
    UnitAddItem(carrier, others);
  });
  measure(
    "UnitRemoveItem(paladin, others), an item another unit carries",
    () => {
      UnitRemoveItem(paladin, others);
      return {
        paladinHasIt: UnitHasItem(paladin, others),
        carrierHasIt: UnitHasItem(carrier, others),
        slot0: nameOf(UnitItemInSlot(paladin, 0)),
        carrierSlot0: nameOf(UnitItemInSlot(carrier, 0)),
        ...itemFields("item", others),
      };
    },
  );
  measure("UnitRemoveItem(footman, ground), no inventory", () => {
    UnitRemoveItem(footman, ground);
    return {
      footmanHasIt: UnitHasItem(footman, ground),
      ...itemFields("item", ground),
    };
  });

  // The fourth fact: a filled slot and an empty one.
  measure("UnitRemoveItemFromSlot(paladin, 0), a filled slot", () => {
    const returned = UnitRemoveItemFromSlot(paladin, 0);
    return {
      ...itemFields("returned", returned),
      returnedIsCarried: returned === carried,
      paladinHasIt: UnitHasItem(paladin, carried),
      slot0: nameOf(UnitItemInSlot(paladin, 0)),
    };
  });
  measure("UnitRemoveItemFromSlot(paladin, 0), an empty inventory", () => {
    const returned = UnitRemoveItemFromSlot(paladin, 0);
    return {
      ...itemFields("returned", returned),
      slot0: nameOf(UnitItemInSlot(paladin, 0)),
    };
  });
  setup("UnitAddItem(paladin, first)", () => {
    UnitAddItem(paladin, carried);
  });
  measure(
    "UnitRemoveItemFromSlot(paladin, 1), an empty slot beside a filled one",
    () => {
      const returned = UnitRemoveItemFromSlot(paladin, 1);
      return {
        ...itemFields("returned", returned),
        paladinHasFirst: UnitHasItem(paladin, carried),
        slot0: nameOf(UnitItemInSlot(paladin, 0)),
        slot1: nameOf(UnitItemInSlot(paladin, 1)),
      };
    },
  );
  measure("UnitRemoveItemFromSlot(footman, 0), no inventory", () => {
    const returned = UnitRemoveItemFromSlot(footman, 0);
    return { ...itemFields("returned", returned) };
  });

  current = "later";
  p.after(3, () => {
    p.record("later", { fires, firesAfterReturn });
    p.finish();
  });
}
