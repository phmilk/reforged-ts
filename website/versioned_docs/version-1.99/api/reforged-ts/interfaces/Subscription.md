# Interface: Subscription

Defined in: [events/descriptor.ts:57](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/descriptor.ts#L57)

What `on()` returns for one handler: the Trigger it created, owned by the
caller of `on()`.

## Remarks

Nothing ends a Subscription but its `destroy()`: the handler runs for
every matching event until then, for the rest of the game when it is never
called. Keep the Subscription for a handler that must stop, such as a
listener for one round or one unit.

## Example

**Ending a Subscription from its own handler**

```ts
/** Waits for `player` to type "-ready", once: the handler ends its own Trigger. */
export function awaitReady(player: MapPlayer): void {
  const subscription = on(
    PlayerEvents.chat(player, "-ready", true),
    ({ player: ready }) => {
      print(`${ready.name} is ready`);
      subscription.destroy();
    },
  );
}
```

## Properties

### trigger

> `readonly` **trigger**: [`Trigger`](../classes/Trigger.md)

Defined in: [events/descriptor.ts:63](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/descriptor.ts#L63)

The Trigger the event is registered on, which the caller owns: it can
be disabled or given more events, but destroy it through the
Subscription.

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [events/descriptor.ts:71](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/descriptor.ts#L71)

Ends the Subscription: destroys its Trigger, with the event
registration, the `when` condition and the handler, and no other
Trigger. The handler never runs again.

#### Returns

`void`

#### Example

**Ending a Subscription from its own handler**

```ts
/** Waits for `player` to type "-ready", once: the handler ends its own Trigger. */
export function awaitReady(player: MapPlayer): void {
  const subscription = on(
    PlayerEvents.chat(player, "-ready", true),
    ({ player: ready }) => {
      print(`${ready.name} is ready`);
      subscription.destroy();
    },
  );
}
```
