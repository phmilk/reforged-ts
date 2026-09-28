// The UnitEvents descriptors through on(): `UnitEvents.name` for the units
// of every player, `UnitEvents.nameOf(unit)` for one unit. Each handler
// receives the event's payload, where a field the event can leave empty is
// typed `| undefined`, and on() returns the Subscription whose destroy()
// ends the handler.
import { Init, MapPlayer, on, tsGlobals, Unit, UnitEvents } from "reforged-ts";
import type { Subscription } from "reforged-ts";

// #region combat
/**
 * A boss that takes half damage from units and none from anything else, and
 * names each attacker. The Subscriptions belong to the boss: the death
 * handler ends them all, itself included, once it dies.
 */
export function shieldBoss(boss: Unit): void {
  const attacked = on(UnitEvents.attackedOf(boss), ({ attacker }) => {
    print(`${attacker.name} attacks the boss`);
  });
  // `damaging` runs before the damage lands, while its amount can change;
  // `source` is undefined when no unit deals it, such as a trap.
  const damaging = on(UnitEvents.damagingOf(boss), ({ source, amount }) => {
    BlzSetEventDamage(source === undefined ? 0 : amount / 2);
  });
  // `damaged` runs once it has landed, with the amount the boss took.
  const damaged = on(UnitEvents.damagedOf(boss), ({ amount, isAttack }) => {
    print(
      `The boss took ${amount.toFixed(0)} ${isAttack ? "from an attack" : "damage"}`,
    );
  });
  const death = on(UnitEvents.deathOf(boss), () => {
    for (const subscription of [attacked, damaging, damaged, death]) {
      subscription.destroy();
    }
  });
}
// #endregion combat

// #region death
/**
 * Pays 10 gold per level of each unit killed to the killer's owner, until
 * the Subscription ends. `killer` is undefined when no unit killed it; a
 * unit killed by its own owner's units pays nothing either.
 */
export function startBounties(): Subscription {
  return on(
    UnitEvents.death,
    ({ unit, killer }) => {
      if (killer === undefined) {
        return;
      }
      const owner = killer.getOwner();
      const gold = owner.getState(PLAYER_STATE_RESOURCE_GOLD);
      owner.setState(PLAYER_STATE_RESOURCE_GOLD, gold + 10 * unit.level);
    },
    ({ unit, killer }) => killer?.getOwner() !== unit.getOwner(),
  );
}
// #endregion death

// #region item
/**
 * Reports what one hero does with its items, until the returned
 * Subscriptions end. Every field of an item payload is set; for a shop,
 * `sellItem`'s `unit` is the shop that sold the item.
 */
export function watchInventory(hero: Unit): Subscription[] {
  return [
    on(UnitEvents.pickupItemOf(hero), ({ item }) => {
      print(`Picked up ${item.name}`);
    }),
    on(UnitEvents.dropItemOf(hero), ({ item }) => {
      print(`Dropped ${item.name}`);
    }),
    on(UnitEvents.useItemOf(hero), ({ item }) => {
      print(`Used ${item.name}, ${String(item.charges)} charges left`);
    }),
    on(UnitEvents.pawnItemOf(hero), ({ item }) => {
      print(`Pawned ${item.name}`);
    }),
    on(UnitEvents.equipOf(hero), ({ item }) => {
      print(`Equipped ${item.name}`);
    }),
    on(UnitEvents.unequipOf(hero), ({ item }) => {
      print(`Unequipped ${item.name}`);
    }),
    on(UnitEvents.sellItem, ({ unit: shop, item }) => {
      print(`${shop.name} sold ${item.name}`);
    }),
  ];
}
// #endregion item

// #region order
/**
 * Prints each order a player's units get, with the targets the order
 * carries: a point order sets `targetX` and `targetY`, a target order sets
 * `targetWidget`, and `targetUnit` too when the target is a unit. The others
 * are undefined. `orderUnit` is `orderTarget` under its old name.
 */
export function logOrders(player: MapPlayer): Subscription[] {
  const ofPlayer = ({ unit }: { unit: Unit }) => unit.getOwner() === player;
  return [
    on(
      UnitEvents.orderIssued,
      ({ orderId }) => {
        print(`Order ${OrderId2String(orderId) ?? String(orderId)}`);
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
// #endregion order

// #region ownership
/**
 * Tells a player when one of their units is taken: `previousOwner` is the
 * player the unit had, `unit.getOwner()` the one it has now.
 */
export function reportTheft(): Subscription {
  return on(UnitEvents.changeOwner, ({ unit, previousOwner }) => {
    previousOwner.displayText(
      0,
      0,
      `${unit.getOwner().name} took your ${unit.name}`,
    );
  });
}
// #endregion ownership

// #region progress
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
// #endregion progress

// #region selection
/**
 * Counts how many players have `unit` selected, until the Subscriptions
 * end. `player` is the one who selected or deselected it.
 */
export function countSelections(unit: Unit): Subscription[] {
  let selectedBy = 0;
  return [
    on(UnitEvents.selectedOf(unit), ({ player }) => {
      selectedBy++;
      print(`${player.name} selected it: ${String(selectedBy)} now`);
    }),
    on(UnitEvents.deselectedOf(unit), () => {
      selectedBy--;
    }),
  ];
}
// #endregion selection

// #region spell
/**
 * Follows every spell from its channel to its end. `targetX` and `targetY`
 * are always set; `targetUnit`, `targetItem` and `targetDestructable` are
 * undefined unless the spell targets one of that kind. `spellEffect` is the
 * one to act on: its cost is paid and its cooldown started.
 */
export function traceSpells(): Subscription[] {
  return [
    on(UnitEvents.spellChannel, ({ caster, abilityId }) => {
      print(`${caster.name} channels ${String(abilityId)}`);
    }),
    on(UnitEvents.spellCast, ({ targetX, targetY }) => {
      print(`Cast at ${targetX.toFixed(0)}, ${targetY.toFixed(0)}`);
    }),
    on(
      UnitEvents.spellEffect,
      ({ targetUnit, targetItem, targetDestructable }) => {
        const target =
          targetUnit?.name ?? targetItem?.name ?? targetDestructable?.name;
        print(
          target === undefined ? "Effect on the ground" : `Effect on ${target}`,
        );
      },
    ),
    on(UnitEvents.spellFinish, ({ caster }) => {
      print(`${caster.name} finished casting`);
    }),
    on(UnitEvents.spellEndcast, ({ caster }) => {
      print(`${caster.name} stopped casting`);
    }),
  ];
}
// #endregion spell

// #region summon
/** Gives every summoned unit its summoner's colour. Both units are set. */
export function colourSummons(): Subscription {
  return on(UnitEvents.summon, ({ summoner, summoned }) => {
    summoned.color = summoner.getOwner().color;
  });
}
// #endregion summon

// #region transport
/**
 * Reports each unit loaded into a transport. Both units are set: `unit` is
 * the one loaded, `transport` the one carrying it.
 */
export function reportBoarding(): Subscription {
  return on(UnitEvents.loaded, ({ unit, transport }) => {
    print(`${unit.name} boarded ${transport.name}`);
  });
}
// #endregion transport

Init.onTriggers(() => {
  const owner = tsGlobals.Players[0];
  const boss = Unit.create(owner, FourCC("Hpal"), 0, 0);
  shieldBoss(boss);
  startBounties();
  watchInventory(boss);
  logOrders(owner);
  reportTheft();
  announceProgress(owner);
  countSelections(boss);
  traceSpells();
  colourSummons();
  reportBoarding();
});
