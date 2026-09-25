/** @noSelfInFile */

import { Unit } from "../../handles/unit";
import { Widget } from "../../handles/widget";
import { unitEventRows } from "./rows";

/**
 * The payload of every order event: the target fields are set only by the
 * orders that carry them, the point by point orders and the unit and widget
 * by target orders.
 */
interface OrderPayload {
  unit: Unit;
  orderId: number;
  targetX: number | undefined;
  targetY: number | undefined;
  targetUnit: Unit | undefined;
  targetWidget: Widget | undefined;
}

/** A target order's payload: `targetUnit` is undefined unless it is a unit. */
function readTarget(unit: Unit): OrderPayload {
  return {
    unit,
    orderId: GetIssuedOrderId(),
    targetX: undefined,
    targetY: undefined,
    targetUnit: Unit.fromOrderTarget(),
    targetWidget: Widget.fromHandle(GetOrderTarget()),
  };
}

export const orderRows = unitEventRows({
  /** A unit is given an order with no target. */
  orderIssued: {
    event: EVENT_PLAYER_UNIT_ISSUED_ORDER,
    twin: EVENT_UNIT_ISSUED_ORDER,
    unit: "unit",
    from: () => Unit.fromOrdered(),
    read: (unit): OrderPayload => ({
      unit,
      orderId: GetIssuedOrderId(),
      targetX: undefined,
      targetY: undefined,
      targetUnit: undefined,
      targetWidget: undefined,
    }),
  },
  /** A unit is ordered to a point; `targetX` and `targetY` are that point. */
  orderPoint: {
    event: EVENT_PLAYER_UNIT_ISSUED_POINT_ORDER,
    twin: EVENT_UNIT_ISSUED_POINT_ORDER,
    unit: "unit",
    from: () => Unit.fromOrdered(),
    read: (unit): OrderPayload => ({
      unit,
      orderId: GetIssuedOrderId(),
      targetX: GetOrderPointX(),
      targetY: GetOrderPointY(),
      targetUnit: undefined,
      targetWidget: undefined,
    }),
  },
  /**
   * A unit is ordered to target a widget; `targetUnit` is set when the target
   * is a unit.
   */
  orderTarget: {
    event: EVENT_PLAYER_UNIT_ISSUED_TARGET_ORDER,
    twin: EVENT_UNIT_ISSUED_TARGET_ORDER,
    unit: "unit",
    from: () => Unit.fromOrdered(),
    read: readTarget,
  },
  /**
   * The event of `orderTarget` under its compatibility name: the Patch gives
   * `EVENT_PLAYER_UNIT_ISSUED_UNIT_ORDER` the same id and no unit event, so
   * there is no `orderUnitOf`.
   */
  orderUnit: {
    event: EVENT_PLAYER_UNIT_ISSUED_UNIT_ORDER,
    unit: "unit",
    from: () => Unit.fromOrdered(),
    read: readTarget,
  },
});
