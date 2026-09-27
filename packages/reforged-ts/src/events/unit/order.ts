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
  /** The ordered unit. */
  unit: Unit;
  /** The order's id. */
  orderId: number;
  /** The x coordinate of a point order's target point. */
  targetX: number | undefined;
  /** The y coordinate of a point order's target point. */
  targetY: number | undefined;
  /** A target order's target, when it is a unit. */
  targetUnit: Unit | undefined;
  /** A target order's target widget. */
  targetWidget: Widget | undefined;
}

/** The target fields of an order payload: those the order carries. */
type OrderTarget = Partial<
  Pick<OrderPayload, "targetX" | "targetY" | "targetUnit" | "targetWidget">
>;

/** An order's payload, with the target fields the order carries. */
function readOrder(unit: Unit, target: OrderTarget): OrderPayload {
  return {
    unit,
    orderId: GetIssuedOrderId(),
    targetX: target.targetX,
    targetY: target.targetY,
    targetUnit: target.targetUnit,
    targetWidget: target.targetWidget,
  };
}

/** A target order's payload: `targetUnit` is undefined unless it is a unit. */
function readTarget(unit: Unit): OrderPayload {
  return readOrder(unit, {
    targetUnit: Unit.fromOrderTarget(),
    targetWidget: Widget.fromOrderTarget(),
  });
}

/**
 * The order rows of UnitEvents: `orderIssued`, `orderPoint`, `orderTarget` and
 * `orderUnit`.
 */
export const orderRows = unitEventRows({
  /** A unit is given an order with no target. */
  orderIssued: {
    event: EVENT_PLAYER_UNIT_ISSUED_ORDER,
    twin: EVENT_UNIT_ISSUED_ORDER,
    unit: "unit",
    from: () => Unit.fromOrdered(),
    read: (unit) => readOrder(unit, {}),
  },
  /** A unit is ordered to a point; `targetX` and `targetY` are that point. */
  orderPoint: {
    event: EVENT_PLAYER_UNIT_ISSUED_POINT_ORDER,
    twin: EVENT_UNIT_ISSUED_POINT_ORDER,
    unit: "unit",
    from: () => Unit.fromOrdered(),
    read: (unit) =>
      readOrder(unit, { targetX: GetOrderPointX(), targetY: GetOrderPointY() }),
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
