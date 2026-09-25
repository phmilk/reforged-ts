/** @noSelfInFile */

// The order rows of UnitEvents (orderIssued, orderPoint, orderTarget,
// orderUnit) and their Of twins through on(), and the lookups they read the
// ordered and the targeted unit with: the suites of support/events.ts, which
// fire the Subscription's Trigger with a stubbed context and observe the call
// log and what the handler received.

import { describe, expect, it } from "reforged-test/lua";
import { Item, MapPlayer, Unit, UnitEvents } from "../../src/index";
import { defined } from "../support/defined";
import {
  describeDescriptor,
  describeLookup,
  everySlot,
} from "../support/events";
import { handleRef } from "../support/handle-ref";

const owner = defined(MapPlayer.fromIndex(0), "the player in slot 0");
const ordered = Unit.create(owner, FourCC("hfoo"), 0, 0);
const target = Unit.create(owner, FourCC("hfoo"), 0, 0);
const item = Item.create(FourCC("rat6"), 0, 0);
const orderId = 851971;

/** The target fields an order without that kind of target leaves out. */
const untargeted = {
  targetX: undefined,
  targetY: undefined,
  targetUnit: undefined,
  targetWidget: undefined,
};

describeDescriptor({
  name: "UnitEvents.orderIssued",
  descriptor: UnitEvents.orderIssued,
  registers: (trigger) =>
    everySlot(
      (player) =>
        `TriggerRegisterPlayerUnitEvent(${trigger}, ${player}, EVENT_PLAYER_UNIT_ISSUED_ORDER, nil)`,
    ),
  context: { GetOrderedUnit: ordered.handle, GetIssuedOrderId: orderId },
  payload: { ...untargeted, unit: ordered, orderId },
  required: [["unit", "GetOrderedUnit"]],
});

describeDescriptor({
  name: "UnitEvents.orderIssuedOf",
  descriptor: UnitEvents.orderIssuedOf(ordered),
  registers: (trigger) => [
    `TriggerRegisterUnitEvent(${trigger}, ${handleRef("unit", ordered.handle)}, EVENT_UNIT_ISSUED_ORDER)`,
  ],
  context: { GetIssuedOrderId: orderId },
  payload: { ...untargeted, unit: ordered, orderId },
});

const pointContext = {
  GetOrderedUnit: ordered.handle,
  GetIssuedOrderId: orderId,
  GetOrderPointX: 128.5,
  GetOrderPointY: -64.25,
};

describeDescriptor({
  name: "UnitEvents.orderPoint",
  descriptor: UnitEvents.orderPoint,
  registers: (trigger) =>
    everySlot(
      (player) =>
        `TriggerRegisterPlayerUnitEvent(${trigger}, ${player}, EVENT_PLAYER_UNIT_ISSUED_POINT_ORDER, nil)`,
    ),
  context: pointContext,
  payload: {
    ...untargeted,
    unit: ordered,
    orderId,
    targetX: 128.5,
    targetY: -64.25,
  },
  required: [["unit", "GetOrderedUnit"]],
});

describeDescriptor({
  name: "UnitEvents.orderPointOf",
  descriptor: UnitEvents.orderPointOf(ordered),
  registers: (trigger) => [
    `TriggerRegisterUnitEvent(${trigger}, ${handleRef("unit", ordered.handle)}, EVENT_UNIT_ISSUED_POINT_ORDER)`,
  ],
  context: pointContext,
  payload: {
    ...untargeted,
    unit: ordered,
    orderId,
    targetX: 128.5,
    targetY: -64.25,
  },
});

const targetContext = {
  GetOrderedUnit: ordered.handle,
  GetIssuedOrderId: orderId,
  GetOrderTargetUnit: target.handle,
  GetOrderTarget: target.handle,
};
const targetPayload = {
  ...untargeted,
  unit: ordered,
  orderId,
  targetUnit: target,
  targetWidget: target,
};

describeDescriptor({
  name: "UnitEvents.orderTarget",
  descriptor: UnitEvents.orderTarget,
  registers: (trigger) =>
    everySlot(
      (player) =>
        `TriggerRegisterPlayerUnitEvent(${trigger}, ${player}, EVENT_PLAYER_UNIT_ISSUED_TARGET_ORDER, nil)`,
    ),
  context: targetContext,
  payload: targetPayload,
  required: [["unit", "GetOrderedUnit"]],
  optional: [
    ["targetUnit", "GetOrderTargetUnit"],
    ["targetWidget", "GetOrderTarget"],
  ],
});

describeDescriptor({
  name: "UnitEvents.orderTarget",
  title: "UnitEvents.orderTarget on an item",
  descriptor: UnitEvents.orderTarget,
  registers: (trigger) =>
    everySlot(
      (player) =>
        `TriggerRegisterPlayerUnitEvent(${trigger}, ${player}, EVENT_PLAYER_UNIT_ISSUED_TARGET_ORDER, nil)`,
    ),
  context: {
    GetOrderedUnit: ordered.handle,
    GetIssuedOrderId: orderId,
    GetOrderTarget: item.handle,
  },
  payload: { ...untargeted, unit: ordered, orderId, targetWidget: item },
});

describeDescriptor({
  name: "UnitEvents.orderTargetOf",
  descriptor: UnitEvents.orderTargetOf(ordered),
  registers: (trigger) => [
    `TriggerRegisterUnitEvent(${trigger}, ${handleRef("unit", ordered.handle)}, EVENT_UNIT_ISSUED_TARGET_ORDER)`,
  ],
  context: targetContext,
  payload: targetPayload,
  optional: [
    ["targetUnit", "GetOrderTargetUnit"],
    ["targetWidget", "GetOrderTarget"],
  ],
});

describeDescriptor({
  name: "UnitEvents.orderUnit",
  descriptor: UnitEvents.orderUnit,
  registers: (trigger) =>
    everySlot(
      (player) =>
        `TriggerRegisterPlayerUnitEvent(${trigger}, ${player}, EVENT_PLAYER_UNIT_ISSUED_UNIT_ORDER, nil)`,
    ),
  context: targetContext,
  payload: targetPayload,
  required: [["unit", "GetOrderedUnit"]],
  optional: [
    ["targetUnit", "GetOrderTargetUnit"],
    ["targetWidget", "GetOrderTarget"],
  ],
});

describe("UnitEvents.orderUnitOf", () => {
  it("does not exist, for the Patch has no unit event for it", () => {
    expect("orderUnitOf" in UnitEvents).toEqual(false);
    expect("orderTargetOf" in UnitEvents).toEqual(true);
  });
});

describeLookup({
  name: "Unit.fromOrdered",
  lookup: () => Unit.fromOrdered(),
  context: { GetOrderedUnit: ordered.handle },
  expected: ordered,
});

describeLookup({
  name: "Unit.fromOrderTarget",
  lookup: () => Unit.fromOrderTarget(),
  context: { GetOrderTargetUnit: target.handle },
  expected: target,
});
