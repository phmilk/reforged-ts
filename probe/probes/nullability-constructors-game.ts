// The Nullability sweep's Slice `nullability-constructors-game` (#392): the
// 35 constructors of game objects, in `common.j` order, each declared for
// the constructors' case generator (./nullability/constructor.ts), and
// what each call returned recorded (./nullability/case-runner.ts).
// `pnpm probe:nullability-report nullability-constructors-game` turns its
// Result file into this Slice's section of the sweep report. The arguments
// come from the Fixtures (./nullability/fixtures.ts), built before the
// cases run; the stale handles are of group b, so they run last.

import type { ProbeContext } from "../game/probe";
import { type ReturnCase, runCases } from "./nullability/case-runner";
import { constructorCases } from "./nullability/constructor";
import { inGroupOrder } from "./nullability/expand";
import {
  consoleUiFrame,
  destroyedBoolExpr,
  destroyedCondition,
  destroyedDialog,
  destroyedFilter,
  destroyedFrame,
  destroyedSimpleFrame,
  destroyedTimer,
  destroyedTrigger,
  gameUiFrame,
  liveCondition,
  liveDialog,
  liveFilter,
  liveLocation,
  liveQuest,
  liveRect,
  liveTimer,
  liveTrigger,
  questAfterDestroyQuest,
  removedLocation,
  removedRect,
} from "./nullability/fixtures";
import {
  fixed,
  handle,
  numeric,
  player,
  rawcode,
  text,
} from "./nullability/parameters";

/** The condition `Condition`, `Filter` and the boolexpr Fixtures wrap. */
function alwaysTrue(): boolean {
  return true;
}

/** The action `TriggerAddAction` adds: the trigger never fires, so it never runs. */
function noAction(): void {
  return;
}

/**
 * The Slice's cases, every (a) case before any (b) case, over the Fixtures
 * built here before any case runs. A boolexpr runs destroyed by each of
 * `DestroyCondition`, `DestroyFilter` and `DestroyBoolExpr`; a location, a
 * rect, a timer, a trigger, a dialog and a frame destroyed or removed; a
 * quest after `DestroyQuest`, whose stale state is not known. A player
 * parameter is `Player(0)` only, by the constructors' rule.
 *
 * The frame names are default templates the game loads with no TOC,
 * measured in a scratch run on 3.0.0.24268 (run
 * 4600bba5-e82d-4753-8bc1-2714f0c2095f): `ScriptDialogButton` on the game
 * UI, `SimpleInfoPanelIconDamage` on `ConsoleUI`. Each owner's stale
 * state is a destroyed frame of its own kind.
 */
function sliceCases(): ReturnCase[] {
  const boolexprStale = [
    ["destroyed condition", destroyedCondition()],
    ["destroyed filter", destroyedFilter()],
    ["destroyed boolexpr", destroyedBoolExpr()],
  ] as const;
  const condition = (name: string) =>
    handle<boolexpr>(name, liveCondition(), boolexprStale);
  const filterOperand = (name: string) =>
    handle<boolexpr>(name, liveFilter(), boolexprStale);
  const whichTrigger = handle("whichTrigger", liveTrigger(), [
    ["destroyed trigger", destroyedTrigger()],
  ]);
  const location = (name: string, x: number, y: number) =>
    handle(name, liveLocation(x, y), [["removed location", removedLocation()]]);
  const whichDialog = handle("whichDialog", liveDialog(), [
    ["destroyed dialog", destroyedDialog()],
  ]);
  const frameOwner = (owner: framehandle, destroyed: framehandle) =>
    handle("owner", owner, [["destroyed frame", destroyed]]);
  return inGroupOrder(
    constructorCases("CreateTimer", [], () => CreateTimer()),
    constructorCases("CreateGroup", [], () => CreateGroup()),
    constructorCases("CreateForce", [], () => CreateForce()),
    constructorCases(
      "Rect",
      [
        numeric("minx", -256),
        numeric("miny", -256),
        numeric("maxx", 256),
        numeric("maxy", 256),
      ],
      ([minx, miny, maxx, maxy]) => Rect(minx, miny, maxx, maxy),
    ),
    constructorCases(
      "RectFromLoc",
      [location("min", -256, -256), location("max", 256, 256)],
      ([min, max]) => RectFromLoc(min, max),
    ),
    constructorCases("CreateRegion", [], () => CreateRegion()),
    constructorCases(
      "Location",
      [numeric("x", 256), numeric("y", 256)],
      ([x, y]) => Location(x, y),
    ),
    constructorCases("CreateTrigger", [], () => CreateTrigger()),
    constructorCases(
      "And",
      [condition("operandA"), filterOperand("operandB")],
      ([a, b]) => And(a, b),
    ),
    constructorCases(
      "Or",
      [condition("operandA"), filterOperand("operandB")],
      ([a, b]) => Or(a, b),
    ),
    constructorCases("Not", [condition("operand")], ([operand]) =>
      Not(operand),
    ),
    constructorCases("Condition", [fixed("func", alwaysTrue)], ([func]) =>
      Condition(func),
    ),
    constructorCases("Filter", [fixed("func", alwaysTrue)], ([func]) =>
      Filter(func),
    ),
    constructorCases(
      "TriggerAddCondition",
      [whichTrigger, condition("condition")],
      ([t, c]) => TriggerAddCondition(t, c),
    ),
    constructorCases(
      "TriggerAddAction",
      [whichTrigger, fixed("actionFunc", noAction)],
      ([t, action]) => TriggerAddAction(t, action),
    ),
    constructorCases(
      "CreateFogModifierRect",
      [
        player("forWhichPlayer"),
        fixed("whichState", FOG_OF_WAR_VISIBLE),
        handle("where", liveRect(), [["removed rect", removedRect()]]),
        fixed("useSharedVision", true),
        fixed("afterUnits", true),
      ],
      ([p, state, where, shared, after]) =>
        CreateFogModifierRect(p, state, where, shared, after),
    ),
    constructorCases(
      "CreateFogModifierRadius",
      [
        player("forWhichPlayer"),
        fixed("whichState", FOG_OF_WAR_VISIBLE),
        numeric("centerx", 256),
        numeric("centerY", 256),
        numeric("radius", 512),
        fixed("useSharedVision", true),
        fixed("afterUnits", true),
      ],
      ([p, state, x, y, radius, shared, after]) =>
        CreateFogModifierRadius(p, state, x, y, radius, shared, after),
    ),
    constructorCases(
      "CreateFogModifierRadiusLoc",
      [
        player("forWhichPlayer"),
        fixed("whichState", FOG_OF_WAR_VISIBLE),
        location("center", 256, 256),
        numeric("radius", 512),
        fixed("useSharedVision", true),
        fixed("afterUnits", true),
      ],
      ([p, state, center, radius, shared, after]) =>
        CreateFogModifierRadiusLoc(p, state, center, radius, shared, after),
    ),
    constructorCases("DialogCreate", [], () => DialogCreate()),
    // A hotkey of 0 is none, as the dialog buttons of blizzard.j pass.
    constructorCases(
      "DialogAddButton",
      [whichDialog, text("buttonText", "Nullability"), numeric("hotkey", 0)],
      ([d, buttonText, hotkey]) => DialogAddButton(d, buttonText, hotkey),
    ),
    constructorCases(
      "DialogAddQuitButton",
      [
        whichDialog,
        fixed("doScoreScreen", false),
        text("buttonText", "Nullability"),
        numeric("hotkey", 0),
      ],
      ([d, score, buttonText, hotkey]) =>
        DialogAddQuitButton(d, score, buttonText, hotkey),
    ),
    constructorCases(
      "InitGameCache",
      [text("campaignFile", "NullabilitySweep.w3v")],
      ([file]) => InitGameCache(file),
    ),
    constructorCases("InitHashtable", [], () => InitHashtable()),
    constructorCases("CreateQuest", [], () => CreateQuest()),
    constructorCases(
      "QuestCreateItem",
      [
        handle("whichQuest", liveQuest(), [
          ["quest after DestroyQuest", questAfterDestroyQuest()],
        ]),
      ],
      ([q]) => QuestCreateItem(q),
    ),
    constructorCases("CreateDefeatCondition", [], () =>
      CreateDefeatCondition(),
    ),
    constructorCases(
      "CreateTimerDialog",
      [handle("t", liveTimer(), [["destroyed timer", destroyedTimer()]])],
      ([t]) => CreateTimerDialog(t),
    ),
    constructorCases("CreateLeaderboard", [], () => CreateLeaderboard()),
    constructorCases("CreateMultiboard", [], () => CreateMultiboard()),
    constructorCases("CreateCameraSetup", [], () => CreateCameraSetup()),
    constructorCases(
      "BlzCreateFrame",
      [
        text("name", "ScriptDialogButton"),
        frameOwner(gameUiFrame(), destroyedFrame()),
        numeric("priority", 0),
        numeric("createContext", 0),
      ],
      ([name, owner, priority, context]) =>
        BlzCreateFrame(name, owner, priority, context),
    ),
    constructorCases(
      "BlzCreateSimpleFrame",
      [
        text("name", "SimpleInfoPanelIconDamage"),
        frameOwner(consoleUiFrame(), destroyedSimpleFrame()),
        numeric("createContext", 0),
      ],
      ([name, owner, context]) => BlzCreateSimpleFrame(name, owner, context),
    ),
    // Holy Light, its order string, and Iron Forged Swords.
    constructorCases(
      "CreateCommandButtonEffect",
      [rawcode("abilityId", FourCC("AHhb")), text("order", "holybolt")],
      ([abilityId, order]) => CreateCommandButtonEffect(abilityId, order),
    ),
    constructorCases(
      "CreateUpgradeCommandButtonEffect",
      [rawcode("whichUprgade", FourCC("Rhme"))],
      ([upgrade]) => CreateUpgradeCommandButtonEffect(upgrade),
    ),
    constructorCases(
      "CreateLearnCommandButtonEffect",
      [rawcode("abilityId", FourCC("AHhb"))],
      ([abilityId]) => CreateLearnCommandButtonEffect(abilityId),
    ),
  );
}

/**
 * The cases not to call, each as `<native> <case>`: a case that crashed the
 * game in an earlier run, named by the pending step `probe:read` printed.
 */
const SKIP: readonly string[] = [
  // Crashed on 3.0.0.24268, runs 9e132106-d7e6-4748-aaab-0334a0bb57a8 and
  // bfb14491-bb8f-45ec-bbb5-4e21621e41b5 (the confirming run).
  "CreateFogModifierRadius radius: 2147483647",
  // Crashed on 3.0.0.24268, runs 677e6d4b-285a-4ccf-82f2-4cd17fbd4a81 and
  // fdd3fb91-61d7-43be-89af-435bf194918d (the confirming run).
  "CreateFogModifierRadiusLoc radius: 2147483647",
];

export function run(p: ProbeContext): void {
  runCases(p, sliceCases(), { skip: SKIP });
}
