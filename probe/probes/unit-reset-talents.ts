// A check made by looking at the screen (#672): does `BlzResetUnitTalents`
// clear a hero's chosen talents and refund its talent points? No Native
// reads either, so the Probe sets the scene and a human looks: a Paladin of
// Player(0) at level 10, the Talents ability `ATal` when it has none, and
// three Tomes of Talent. The human chooses talents in its talent panel,
// types `-reset`, looks at the panel and types what was seen as
// `-seen <text>`, then `-done`, which ends the run. Beside the answer, the
// Probe records the hero's abilities and skill points at each step: a
// talent that shows up as an ability on the hero, and leaves it on the
// reset, is a fact a later Probe can measure on its own.

import type { ProbeContext } from "../game/probe";

/**
 * The rawcode of an ability id, its four bytes as characters. Division, not
 * shifts: TypeScriptToLua writes `>>>` as `id & 4294967295`, a literal past
 * the game's 32-bit integers that fails at run time, and refuses `>>`. A
 * rawcode is positive and below 2^31.
 */
function rawcodeOf(id: number): string {
  return string.char(
    Math.floor(id / 16777216) % 256,
    Math.floor(id / 65536) % 256,
    Math.floor(id / 256) % 256,
    id % 256,
  );
}

/** The hero's abilities, as `rawcode:level` joined by commas, in index order. */
function abilitiesOf(hero: unit): string {
  const found: string[] = [];
  for (let index = 0; ; index++) {
    const ability = BlzGetUnitAbilityByIndex(hero, index);
    if (ability === undefined) break;
    const id = BlzGetAbilityId(ability);
    found.push(`${rawcodeOf(id)}:${String(GetUnitAbilityLevel(hero, id))}`);
  }
  return found.join(",");
}

/** Records the hero's abilities and skill points as `state`, then checkpoints. */
function snapshot(p: ProbeContext, hero: unit, state: string): void {
  p.record("hero", {
    state,
    abilities: abilitiesOf(hero),
    skillPoints: String(GetHeroSkillPoints(hero)),
    level: String(GetHeroLevel(hero)),
  });
  p.checkpoint();
}

export function run(p: ProbeContext): void {
  p.hold();
  const owner = Player(0);
  if (owner === undefined) error("Player(0) is nil", 0);
  const hero = CreateUnit(owner, FourCC("Hpal"), 0, 0, 270);
  if (hero === undefined) error("CreateUnit Hpal returned nil", 0);
  snapshot(p, hero, "created");

  if (GetUnitAbilityLevel(hero, FourCC("ATal")) === 0) {
    p.record("added", {
      rawcode: "ATal",
      result: tostring(UnitAddAbility(hero, FourCC("ATal"))),
    });
  }
  SetHeroLevel(hero, 10, false);
  for (let i = 0; i < 3; i++) {
    p.record("tome", {
      result: tostring(UnitAddItemById(hero, FourCC("ttal")) !== undefined),
    });
  }
  snapshot(p, hero, "granted");

  if (GetLocalPlayer() === owner) {
    ClearSelection();
    SelectUnit(hero, true);
    PanCameraToTimed(GetUnitX(hero), GetUnitY(hero), 0);
  }
  const instructions =
    "Choose talents in the Paladin's talent panel, note the points left, then type -reset.";
  p.show(instructions, 600);

  const chat = CreateTrigger();
  TriggerRegisterPlayerChatEvent(chat, owner, "-", false);
  TriggerAddAction(chat, () => {
    const text = GetEventPlayerChatString() ?? "";
    if (text === "-reset") {
      snapshot(p, hero, "before reset");
      p.pending("BlzResetUnitTalents");
      const [ok, err] = pcall(() => {
        BlzResetUnitTalents(hero);
      });
      p.record("reset", ok ? { done: "true" } : { error: tostring(err) });
      snapshot(p, hero, "after reset");
      p.after(1, () => {
        snapshot(p, hero, "1s after reset");
      });
      p.show(
        "Look at the talent panel: are the talents cleared, the points back? Type -seen <what you saw>, then -done.",
        600,
      );
    } else if (text.startsWith("-seen ")) {
      p.record("seen", { text: text.substring(6) });
      p.checkpoint();
    } else if (text === "-done") {
      DestroyTrigger(chat);
      p.finish();
    }
  });
}
