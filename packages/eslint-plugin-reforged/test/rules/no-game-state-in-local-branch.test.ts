import type { InvalidTestCase } from "@typescript-eslint/rule-tester";
import { describe, expect, it } from "vitest";

import localSafe from "../../data/local-safe.json" with { type: "json" };
import { lintWithRecommended } from "../support/lint.js";
import { ruleOf } from "../support/plugin.js";
import { createRuleTester } from "../support/rule-tester.js";

const ruleTester = createRuleTester();

type MessageIds = "gameState" | "creation" | "callback" | "random";

const prelude = [
  'import { CameraSetup, Camera, Effect, Frame, MapPlayer, Sound, Unit } from "reforged-ts";',
  "declare const p: player;",
  "declare const mp: MapPlayer;",
  "declare const u: unit;",
  "declare const unit: Unit;",
  "declare const frame: Frame;",
  "declare const effect: Effect;",
  "declare const sound: Sound;",
  "declare const setup: CameraSetup;",
  "",
].join("\n");

// A state Native, a creation and a random call: each local-player form below
// must report all three.
const stateCalls = ["KillUnit(u)", "CreateTimer()", "GetRandomInt(0, 1)"];
const block = stateCalls.map((call) => `  ${call};`).join("\n");

const stateErrors = [
  { messageId: "gameState" as const, data: { callee: "KillUnit" } },
  {
    messageId: "creation" as const,
    data: { callee: "CreateTimer", type: "timer" },
  },
  { messageId: "random" as const, data: { callee: "GetRandomInt" } },
];

// Every local-player form and local-branch shape of the ticket, with the
// three state calls inside the branch.
const forms: readonly { name: string; code: string }[] = [
  {
    name: "GetLocalPlayer() === p",
    code: `if (GetLocalPlayer() === p) {\n${block}\n}`,
  },
  { name: "p.isLocal()", code: `if (mp.isLocal()) {\n${block}\n}` },
  {
    name: "MapPlayer.fromLocal() === p",
    code: `if (MapPlayer.fromLocal() === mp) {\n${block}\n}`,
  },
  {
    name: "a const bound to an equality (module scope)",
    code: `const isMe = GetLocalPlayer() === p;\nif (isMe) {\n${block}\n}`,
  },
  {
    name: "a const bound to GetLocalPlayer() in the same function",
    code: `export function show() {\n  const local = GetLocalPlayer();\n  if (local === p) {\n${block}\n  }\n}`,
  },
  {
    name: "the alternate of a negated test (!)",
    code: `if (!mp.isLocal()) {\n  // other players\n} else {\n${block}\n}`,
  },
  {
    name: "the alternate of an inequality",
    code: `if (GetLocalPlayer() !== p) {\n  // other players\n} else {\n${block}\n}`,
  },
  {
    name: "the alternate of a const bound to an inequality",
    code: `const notMe = GetLocalPlayer() !== p;\nif (notMe) {\n  // other players\n} else {\n${block}\n}`,
  },
  {
    name: "the right operand of &&",
    code: stateCalls.map((call) => `mp.isLocal() && ${call};`).join("\n"),
  },
  {
    name: "the right operand of ||",
    code: stateCalls
      .map((call) => `GetLocalPlayer() !== p || ${call};`)
      .join("\n"),
  },
  {
    name: "the consequent of a conditional expression",
    code: stateCalls
      .map(
        (call, index) =>
          `const r${String(index)} = mp.isLocal() ? ${call} : 0;`,
      )
      .join("\n"),
  },
  {
    name: "a MapPlayer.runLocal callback",
    code: `MapPlayer.runLocal(mp, () => {\n${block}\n});`,
  },
  {
    name: "a function expression handed to MapPlayer.runLocal",
    code: `MapPlayer.runLocal(mp, function () {\n${block}\n});`,
  },
  {
    name: "a nested function defined inside a local branch",
    code: `if (GetLocalPlayer() === p) {\n  const later = () => {\n${block}\n  };\n  later();\n  function again() {\n${block}\n  }\n  again();\n}`,
  },
];

function formErrors(name: string) {
  return name.startsWith("a nested function")
    ? [...stateErrors, ...stateErrors]
    : stateErrors;
}

// Native entries of the allowlist (visual and text), all called inside one
// local branch; the member entries by one case per family below.
const nativeEntries = localSafe.filter((entry) => !/[#.]/.test(entry.name));
const memberFamilies: readonly { family: string; code: string }[] = [
  {
    family: "Frame",
    code: 'frame.setVisible(true);\n  frame.visible = false;\n  frame.setText("hi");\n  frame.text = "hi";',
  },
  { family: "Unit", code: "unit.setVertexColor(255, 255, 255, 128);" },
  { family: "Effect", code: "effect.setColor(255, 0, 0);" },
  {
    family: "Sound",
    code: "sound.start();\n  sound.setVolume(100);\n  sound.stop(false, true);",
  },
  {
    family: "Camera",
    code: "Camera.pan(0, 0, undefined);\n  Camera.setPos(0, 0);",
  },
  { family: "CameraSetup", code: "setup.apply(true, false);" },
];

ruleTester.run(
  "no-game-state-in-local-branch",
  ruleOf("no-game-state-in-local-branch"),
  {
    valid: [
      {
        name: "every Native and print entry of local-safe.json inside a local branch",
        code: `${prelude}if (GetLocalPlayer() === p) {\n${nativeEntries.map((entry) => `  ${entry.name}();`).join("\n")}\n}`,
      },
      ...memberFamilies.map(({ family, code }) => ({
        name: `the ${family} members of local-safe.json inside a local branch`,
        code: `${prelude}if (mp.isLocal()) {\n  ${code}\n}`,
      })),
      {
        name: "the allow option: a Native and a Wrapper member treated as visual",
        code: `${prelude}if (mp.isLocal()) {\n  KillUnit(u);\n  unit.kill();\n}`,
        options: [{ allow: ["KillUnit", "Unit#kill"] }],
      },
      {
        name: "pure computation inside a local branch",
        code: `${prelude}if (mp.isLocal()) {\n  const x = Math.floor(1.5) + 2 * 3;\n  const s = "hp".toUpperCase() + String(x);\n  const doubled = [1, 2].map((n) => n * 2);\n}`,
      },
      {
        name: "a call to a project function (not followed)",
        code: `${prelude}function killAll() {\n  KillUnit(u);\n  CreateTimer();\n}\nif (mp.isLocal()) {\n  killAll();\n}`,
      },
      {
        name: "the local-player expressions and runLocal themselves",
        code: `${prelude}if (mp.isLocal()) {\n  if (GetLocalPlayer() === p && MapPlayer.fromLocal() === mp) {\n    MapPlayer.runLocal(mp, () => {});\n  }\n}`,
      },
      {
        name: "the same state calls outside a local branch",
        code: `${prelude}${block}\nif (IsUnitAliveBJ(u)) {\n${block}\n}\nMapPlayer.runLocal(mp, () => {});\n${block}\nexport function later() {\n${block}\n}`,
      },
      {
        name: "the local-player test itself is not inside the branch",
        code: `${prelude}if (GetLocalPlayer() === Player(0)) {\n  PanCameraTo(0, 0);\n}`,
      },
      {
        name: "a const two hops away is not followed",
        code: `${prelude}const local = GetLocalPlayer();\nconst alias = local;\nif (alias === p) {\n  KillUnit(u);\n}`,
      },
      {
        name: "a project binding named GetLocalPlayer",
        code: 'import { Unit } from "reforged-ts";\nexport function GetLocalPlayer(): number {\n  return 0;\n}\nif (GetLocalPlayer() === 0) {\n  KillUnit(Unit.fromEvent()!.handle);\n}',
      },
    ],
    invalid: [
      ...forms.map(
        ({
          name,
          code,
        }): InvalidTestCase<MessageIds, [{ allow?: string[] }]> => ({
          name,
          code: `${prelude}${code}`,
          errors: formErrors(name),
        }),
      ),
      {
        name: "Wrapper creation, Math.random, SetRandomSeed, Filter, ForGroup, a Wrapper member and an accessor",
        code: `${prelude}MapPlayer.runLocal(mp, () => {\n  const unit = Unit.create(mp, 1751543663, 0, 0);\n  const roll = Math.random();\n  SetRandomSeed(1);\n  const filter = Filter(() => true);\n  ForGroup(CreateGroup()!, () => {});\n  unit.kill();\n  unit.life = 0;\n  math.random(1, 6);\n  math.randomseed(7);\n  GetUnitX(u);\n});`,
        // GetUnitX only reads, but the rule is allowlist-based: a Native not
        // listed as visual or text is reported (the allow option lifts it).
        errors: [
          {
            messageId: "creation",
            data: { callee: "Unit.create", type: "Unit" },
          },
          { messageId: "random", data: { callee: "Math.random" } },
          { messageId: "random", data: { callee: "SetRandomSeed" } },
          { messageId: "callback", data: { callee: "Filter" } },
          { messageId: "callback", data: { callee: "ForGroup" } },
          {
            messageId: "creation",
            data: { callee: "CreateGroup", type: "group" },
          },
          { messageId: "gameState", data: { callee: "Unit#kill" } },
          { messageId: "gameState", data: { callee: "Widget#life" } },
          { messageId: "random", data: { callee: "math.random" } },
          { messageId: "random", data: { callee: "math.randomseed" } },
          { messageId: "gameState", data: { callee: "GetUnitX" } },
        ],
      },
      {
        name: "a listed name outside the allow option is still reported",
        code: `${prelude}if (mp.isLocal()) {\n  KillUnit(u);\n  RemoveUnit(u);\n}`,
        options: [{ allow: ["KillUnit"] }],
        errors: [{ messageId: "gameState", data: { callee: "RemoveUnit" } }],
      },
    ],
  },
);

describe("no-game-state-in-local-branch fixtures", () => {
  it("cover every member family of local-safe.json", () => {
    const families = new Set(
      localSafe
        .filter((entry) => /[#.]/.test(entry.name))
        .map((entry) => entry.name.split(/[#.]/)[0]),
    );
    expect(new Set(memberFamilies.map((each) => each.family))).toEqual(
      families,
    );
  });
});

describe("no-game-state-in-local-branch in the recommended config", () => {
  const code = `${prelude}if (GetLocalPlayer() === p) {\n  KillUnit(u);\n}`;

  it("is an error", () => {
    expect(lintWithRecommended(code)).toMatchObject([
      {
        ruleId: "reforged/no-game-state-in-local-branch",
        severity: 2,
        messageId: "gameState",
      },
    ]);
  });

  it("honours an eslint-disable-next-line escape with a reason", () => {
    expect(
      lintWithRecommended(
        `${prelude}if (GetLocalPlayer() === p) {\n  // eslint-disable-next-line reforged/no-game-state-in-local-branch -- replay-only map, never played online\n  KillUnit(u);\n}`,
      ),
    ).toEqual([]);
  });
});
