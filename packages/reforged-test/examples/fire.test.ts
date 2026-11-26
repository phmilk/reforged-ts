import { expect, it, startGame } from "reforged-test/map";
import { Init, MapPlayer, on, Unit, UnitEvents } from "reforged-ts";

const STORM_BOLT = FourCC("AHtb");
const FOOTMAN = FourCC("hfoo");

Init.onGameStart(() => {
  on(UnitEvents.spellEffect, ({ abilityId, targetUnit }) => {
    if (abilityId !== STORM_BOLT || targetUnit === undefined) return;
    print(
      targetUnit.typeId === FOOTMAN ? "Footman stunned" : "Something stunned",
    );
  });
});

it("stuns the target of a Storm Bolt", () => {
  const game = startGame();
  const host = MapPlayer.fromIndex(0);
  const enemy = MapPlayer.fromIndex(1);
  if (host === undefined || enemy === undefined) throw new Error("no player");
  const hero = Unit.create(host, FourCC("Hmkg"), 0, 0);
  const footman = Unit.create(enemy, FOOTMAN, 300, 0);
  // No Game action casts a spell: the test fires its event, and every
  // Trigger the game would fire for the hero's owner runs.
  game.fire(EVENT_PLAYER_UNIT_SPELL_EFFECT, {
    GetTriggerUnit: hero.handle,
    GetSpellAbilityUnit: hero.handle,
    GetSpellAbilityId: STORM_BOLT,
    GetSpellTargetUnit: footman.handle,
  });
  expect(game.printed).toEqual(["Footman stunned"]);
});
