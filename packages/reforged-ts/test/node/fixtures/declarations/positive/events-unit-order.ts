// The order payloads type the target fields as possibly undefined, the same
// shape for every order row; orderUnit has no Of twin.
import type { EventDescriptor, Widget } from "reforged-ts";
import { on, Unit, UnitEvents } from "reforged-ts";

declare const footman: Unit;

interface OrderPayload {
  unit: Unit;
  orderId: number;
  targetX: number | undefined;
  targetY: number | undefined;
  targetUnit: Unit | undefined;
  targetWidget: Widget | undefined;
}

const seen: unknown[] = [];
const subscription = on(
  UnitEvents.orderPoint,
  ({ unit, orderId, targetX, targetY, targetUnit, targetWidget }) => {
    const ordered: Unit = unit;
    const id: number = orderId;
    const x: number | undefined = targetX;
    const y: number | undefined = targetY;
    const onUnit: Unit | undefined = targetUnit;
    const onWidget: Widget | undefined = targetWidget;
    seen.push(ordered, id, x, y, onUnit, onWidget);
  },
);

const rows: EventDescriptor<OrderPayload>[] = [
  UnitEvents.orderIssued,
  UnitEvents.orderIssuedOf(footman),
  UnitEvents.orderPoint,
  UnitEvents.orderPointOf(footman),
  UnitEvents.orderTarget,
  UnitEvents.orderTargetOf(footman),
  UnitEvents.orderUnit,
];
const ordered: Unit | undefined = Unit.fromOrdered();
const orderTarget: Unit | undefined = Unit.fromOrderTarget();

export { seen, subscription, rows, ordered, orderTarget };
