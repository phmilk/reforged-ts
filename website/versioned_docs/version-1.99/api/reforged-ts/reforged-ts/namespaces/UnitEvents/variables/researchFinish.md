# Variable: researchFinish

> `readonly` **researchFinish**: [`EventDescriptor`](../../../../interfaces/EventDescriptor.md)\<\{ `researched`: `Rawcode`\<`"upgrade"`\>; `unit`: [`Unit`](../../../../classes/Unit.md); \}\>

Defined in: [events/unit/progress.ts:71](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/unit/progress.ts#L71)

A unit finishes a research; `researched` is its rawcode.
Every field is set.

## Example

**Announcing a player's progress**

```ts
/**
 * Announces a player's progress to them: what their buildings finish and
 * how their heroes grow. Every field of these payloads is set.
 */
export function announceProgress(player: MapPlayer): Subscription[] {
  const say = (text: string) => {
    player.displayText(0, 0, text);
  };
  const owns = (unit: Unit) => unit.getOwner() === player;
  return [
    on(
      UnitEvents.trainFinish,
      ({ trainer, trained }) => {
        say(`${trainer.name} trained ${trained.name}`);
      },
      ({ trainer }) => owns(trainer),
    ),
    on(
      UnitEvents.constructFinish,
      ({ structure }) => {
        say(`${structure.name} is built`);
      },
      ({ structure }) => owns(structure),
    ),
    on(
      UnitEvents.researchFinish,
      ({ researched }) => {
        say(`Research ${String(researched)} is done`);
      },
      ({ unit }) => owns(unit),
    ),
    on(
      UnitEvents.upgradeFinish,
      ({ unit }) => {
        say(`${unit.name} is upgraded`);
      },
      ({ unit }) => owns(unit),
    ),
    on(
      UnitEvents.heroLevel,
      ({ unit, level }) => {
        say(`${unit.name} reached level ${String(level)}`);
      },
      ({ unit }) => owns(unit),
    ),
    on(
      UnitEvents.heroSkill,
      ({ unit, abilityId }) => {
        say(`${unit.name} learned ${String(abilityId)}`);
      },
      ({ unit }) => owns(unit),
    ),
  ];
}
```

## Native

[TriggerRegisterPlayerUnitEvent](/typings/3.0.0/functions/TriggerRegisterPlayerUnitEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterPlayerUnitEvent))
