# Function: on()

> **on**\<`P`\>(`event`, `handler`, `when?`): [`Subscription`](../interfaces/Subscription.md)

Defined in: [events/descriptor.ts:114](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/events/descriptor.ts#L114)

Subscribes `handler` to `event` on a new Trigger: `when`, if given, runs
first as the trigger's condition, and the handler runs only when it
returns true. Each reads the payload from the trigger context.

## Type Parameters

### P

`P`

The event's payload.

## Parameters

### event

[`EventDescriptor`](../interfaces/EventDescriptor.md)\<`P`\>

The Event descriptor, such as `UnitEvents.death` or
`PlayerEvents.chat(player, "-help", true)`.

### handler

(`payload`) => `void`

Runs for each event `when` accepts, with its payload.

### when?

(`payload`) => `boolean`

Decides from the payload whether `handler` runs; it runs
for every event when left out.

## Returns

[`Subscription`](../interfaces/Subscription.md)

The Subscription, which the caller owns: its `destroy()` ends
the handler.

## Remarks

- In Dev mode each runs under `pcall`, through the protection step, and
  a failure is reported under the descriptor's name
  (`reforged-ts: UnitEvents.death failed: ...`): a `when` that throws
  evaluates false. The Trigger's own protection of its action and
  condition stays in place around them; it sees no failure, the
  descriptor's step having caught it.
- `when` runs as a trigger condition, where the sleeping Natives are
  invalid. Across Subscriptions to one event the game runs the Triggers in
  registration order in practice, which it does not guarantee.
- Call it from an Init stage (`Init.onTriggers` or later), never at
  module top level: it creates a Trigger.

## Example

**A handler with a filter**

```ts
Init.onTriggers(() => {
  // Every hero's death, whoever owns it: `killer` is undefined when no unit
  // killed it.
  on(
    UnitEvents.death,
    ({ unit, killer }) => {
      print(`${unit.name} fell to ${killer?.name ?? "no unit"}`);
    },
    ({ unit }) => unit.isUnitType(UNIT_TYPE_HERO),
  );
});
```

## Throws

What `Trigger.create` throws: `reforged-ts: failed to create Trigger`
when the game returns no handle, and in Dev mode when called before the
globals Init stage or inside `MapPlayer.runLocal`.

## Native

[CreateTrigger](/typings/3.0.0/functions/CreateTrigger) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateTrigger))

## Native

[TriggerAddCondition](/typings/3.0.0/functions/TriggerAddCondition) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerAddCondition))

## Native

[Condition](/typings/3.0.0/functions/Condition) ([jassbot](https://lep.duckdns.org/jassbot/doc/Condition))

## Native

[TriggerAddAction](/typings/3.0.0/functions/TriggerAddAction) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerAddAction))
