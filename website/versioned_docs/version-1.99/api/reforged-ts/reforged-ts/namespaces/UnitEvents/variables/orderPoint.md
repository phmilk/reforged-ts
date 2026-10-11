# Variable: orderPoint

> `readonly` **orderPoint**: [`EventDescriptor`](../../../../interfaces/EventDescriptor.md)\<`OrderPayload`\>

Defined in: [events/unit/order.ts:85](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/unit/order.ts#L85)

A unit is ordered to a point; `targetX` and `targetY` are that point.
`targetUnit` and `targetWidget` are undefined.

## Example

**Logging a player's orders and their targets**

```ts
/**
 * Prints each order a player's units get, with the targets the order
 * carries: a point order sets `targetX` and `targetY`, a target order sets
 * `targetWidget`, and `targetUnit` too when the target is a unit. The others
 * are undefined, all four for an order with no target. `orderUnit` is
 * `orderTarget` under its old name, the same event: subscribe to one of the
 * two, or the handler runs twice.
 */
export function logOrders(player: MapPlayer): Subscription[] {
  const ofPlayer = ({ unit }: { unit: Unit }) => unit.getOwner() === player;
  return [
    on(
      UnitEvents.orderIssued,
      ({ orderId, targetX, targetWidget }) => {
        // An order with no target, such as stop: no target field is set.
        const noTarget = targetX === undefined && targetWidget === undefined;
        print(
          `Order ${OrderId2String(orderId) ?? String(orderId)}, no target: ${String(noTarget)}`,
        );
      },
      ofPlayer,
    ),
    on(
      UnitEvents.orderPoint,
      ({ targetX = 0, targetY = 0 }) => {
        print(`To ${targetX.toFixed(0)}, ${targetY.toFixed(0)}`);
      },
      ofPlayer,
    ),
    on(
      UnitEvents.orderTarget,
      ({ targetUnit, targetWidget }) => {
        if (targetUnit !== undefined) {
          print(`Against ${targetUnit.name}`);
        } else if (targetWidget !== undefined) {
          print(`Against a widget at ${targetWidget.x.toFixed(0)}`);
        }
      },
      ofPlayer,
    ),
  ];
}
```

## Native

[TriggerRegisterPlayerUnitEvent](/typings/3.0.0/functions/TriggerRegisterPlayerUnitEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterPlayerUnitEvent))
