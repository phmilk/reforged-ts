import type {
  InvalidTestCase,
  ValidTestCase,
} from "@typescript-eslint/rule-tester";
import { describe, expect, it } from "vitest";

import { lintWithRecommended } from "../support/lint.js";
import { ruleOf } from "../support/plugin.js";
import { createRuleTester } from "../support/rule-tester.js";

const ruleTester = createRuleTester();

type MessageIds = "asyncArgument" | "asyncVariable" | "asyncKey";

const imports =
  'import { Frame, Input, MapPlayer, Point, SyncRequest, Unit } from "reforged-ts";\n';

// The number-valued sources: an `@async` Native, the `os` clock functions and
// an `@async` library getter (decision 3), of an instance or of a static
// namespace. `SOURCE` in a snippet is replaced.
const sources: readonly { name: string; code: string }[] = [
  { name: "GetCameraTargetPositionX", code: "GetCameraTargetPositionX()" },
  { name: "os.clock", code: "os.clock()" },
  { name: "os.time", code: "os.time()" },
  { name: "Point#z", code: "point.z" },
  { name: "Input.mouseScreenX", code: "Input.mouseScreenX" },
];

/** The body wrapped in a function, with the names the snippets use. */
function inFunction(body: string, before = ""): string {
  return `${imports}${before}function f(u: unit, point: Point, frame: Frame, table: LuaMap<number, boolean>, owner: MapPlayer) {\n${body}\n}`;
}

function valid(body: string, before = ""): ValidTestCase<[]>[] {
  return sources.map((source) => ({
    name: `${source.name}: ${body}`,
    code: inFunction(body.replaceAll("SOURCE", source.code), before),
  }));
}

function invalid(
  body: string,
  messageId: MessageIds,
  sink: string,
  before = "",
): InvalidTestCase<MessageIds, []>[] {
  return sources.map((source) => ({
    name: `${source.name}: ${body}`,
    code: inFunction(body.replaceAll("SOURCE", source.code), before),
    errors: [{ messageId, data: { source: source.name, sink } }],
  }));
}

ruleTester.run("no-async-value-as-state", ruleOf("no-async-value-as-state"), {
  valid: [
    // A text sink, directly, in a template, a concatenation or a conversion.
    ...valid("print(SOURCE);"),
    ...valid("DisplayTextToPlayer(Player(0)!, 0, 0, `at ${SOURCE}`);"),
    ...valid('BJDebugMsg("at " + tostring(SOURCE));'),
    ...valid("frame.text = String(SOURCE);"),
    // A visual allowlist entry: a Native, a library method, an accessor.
    ...valid("SetCameraPosition(SOURCE, 0);"),
    ...valid("BlzFrameSetAlpha(BlzGetFrameByName('Bar', 0)!, SOURCE);"),
    ...valid("frame.setVisible(SOURCE > 1);"),
    ...valid("frame.visible = SOURCE > 10;"),
    // Through one const, into a text or visual call.
    ...valid(
      "const value = SOURCE;\nprint(value);\nSetCameraPosition(value, 0);",
    ),
    // Local computation that goes nowhere.
    ...valid("const delta = SOURCE - 100;"),
    ...valid("if (SOURCE > 100) {\n  return;\n}"),
    ...valid("let value = SOURCE;\nvalue += 1;"),
    ...valid("void SOURCE;"),
    ...valid("return SOURCE;"),
    // A source's argument is not state (the outer source is checked), and
    // Math's functions compute locally.
    { code: inFunction("print(os.difftime(os.time(), 0));") },
    ...valid("const seconds = Math.floor(SOURCE);\nprint(seconds);"),
    ...valid("SetCameraPosition(Math.max(SOURCE, 0), 0);"),
    // A pure Native of the allowlist passes the value on to where its result
    // flows: here a text sink, a visual call, or nowhere.
    ...valid("DisplayTextToPlayer(Player(0)!, 0, 0, R2S(SOURCE));"),
    ...valid("print(I2S(R2I(SOURCE)));"),
    ...valid("SetCameraPosition(SquareRoot(Pow(SOURCE, 2)), 0);"),
    ...valid("const label = SubString(R2S(SOURCE), 0, 4);"),
    // The sync System shares the value: its constructor and `start`.
    ...valid(
      "new SyncRequest(owner, String(SOURCE)).then((res) => {\n  print(res.data);\n});",
    ),
    ...valid(
      "const request = new SyncRequest(owner);\nrequest.start(tostring(SOURCE));",
    ),
    // The local branch idiom: a comparison in a condition.
    {
      code: inFunction(
        "if (GetLocalPlayer() === Player(0)) {\n  print('mine');\n}",
      ),
    },
    {
      code: inFunction(
        "const local = MapPlayer.fromLocal();\nif (local === owner) {\n  frame.setVisible(true);\n}",
      ),
    },
    // A display Native addressed to the local player.
    { code: inFunction("DisplayTextToPlayer(GetLocalPlayer(), 0, 0, 'hi');") },
    // A Native that is not @async, and a getter that is not.
    { code: inFunction("SetUnitX(u, GetUnitX(u));\nSetUnitY(u, point.x);") },
    // A project function or object that shadows a source's name.
    {
      code: inFunction(
        "SetUnitX(u, GetCameraTargetPositionX());",
        "function GetCameraTargetPositionX(): number {\n  return 0;\n}\n",
      ),
    },
    {
      code: inFunction(
        "const os = { clock: () => 1 };\nSetUnitX(u, os.clock());",
      ),
    },
    // A project member documented with JSDoc's own @async tag.
    {
      code: inFunction(
        "SetUnitX(u, clockOf.now());",
        "const clockOf = {\n  /** @async */\n  now(): number {\n    return 0;\n  },\n};\n",
      ),
    },
    // A const followed once only.
    {
      code: inFunction(
        "const first = os.clock();\nconst second = first;\nSetUnitX(u, second);",
      ),
    },
    // A local variable is not module state.
    { code: inFunction("let last = 0;\nlast = os.clock();\nprint(last);") },
  ],
  invalid: [
    {
      name: "a project class named SyncRequest is not the sync System",
      code: `class SyncRequest {\n  constructor(readonly data: string) {}\n  start(data: string) {}\n}\nfunction f() {\n  new SyncRequest(String(os.clock()));\n  new SyncRequest("").start(String(os.time()));\n}`,
      errors: [
        {
          messageId: "asyncArgument",
          data: { source: "os.clock", sink: "new SyncRequest" },
        },
        {
          messageId: "asyncArgument",
          data: { source: "os.time", sink: 'new SyncRequest("").start' },
        },
      ],
    },
    // An argument of a state call: a Native, a library method, a setter.
    ...invalid("SetUnitX(u, SOURCE);", "asyncArgument", "SetUnitX"),
    ...invalid("SetUnitX(u, SOURCE * 2 + 1);", "asyncArgument", "SetUnitX"),
    ...invalid("frame.value = SOURCE;", "asyncArgument", "Frame#value"),
    ...invalid("table.set(SOURCE, true);", "asyncArgument", "table.set"),
    // Through a pure Native of the allowlist, which passes the value on.
    ...invalid("SetUnitX(u, R2I(SOURCE));", "asyncArgument", "SetUnitX"),
    ...invalid(
      "SetUnitX(u, SquareRoot(Pow(SOURCE, 2)));",
      "asyncArgument",
      "SetUnitX",
    ),
    ...invalid("table[R2I(SOURCE)] = true;", "asyncKey", "table"),
    ...invalid(
      "last = S2I(I2S(R2I(SOURCE)));",
      "asyncVariable",
      "last",
      "let last = 0;\n",
    ),
    // A module-level variable, assigned or initialised.
    ...invalid("last = SOURCE;", "asyncVariable", "last", "let last = 0;\n"),
    // A table key, written or read, and a computed property key.
    ...invalid("table[SOURCE] = true;", "asyncKey", "table"),
    ...invalid("print(table[SOURCE]);", "asyncKey", "table"),
    ...invalid(
      "const keyed = { [SOURCE]: true };",
      "asyncKey",
      "an object literal",
    ),
    // Through one const.
    ...invalid(
      "const value = SOURCE;\nprint(value);\nSetUnitX(u, value);",
      "asyncArgument",
      "SetUnitX",
    ),
    ...invalid(
      "const value = SOURCE;\nlast = value;",
      "asyncVariable",
      "last",
      "let last = 0;\n",
    ),
    ...invalid(
      "const value = SOURCE;\ntable[value] = true;",
      "asyncKey",
      "table",
    ),
    {
      name: "an @async Native's value as a state Native's argument",
      code: inFunction(
        "SetPlayerState(GetLocalPlayer(), PLAYER_STATE_RESOURCE_GOLD, 100);",
      ),
      errors: [
        {
          messageId: "asyncArgument",
          data: { source: "GetLocalPlayer", sink: "SetPlayerState" },
        },
      ],
    },
    {
      name: "an @async library member as a library method's argument",
      code: inFunction(
        "Unit.create(owner, 0, 0, 0).setOwner(MapPlayer.fromLocal());",
      ),
      errors: [
        {
          messageId: "asyncArgument",
          data: {
            source: "MapPlayer.fromLocal",
            sink: "Unit.create(owner, 0, 0, 0).setOwner",
          },
        },
      ],
    },
    {
      name: "a static namespace's @async method as game state",
      code: `${imports}export const moving = Input.isKeyPressed(OSKEY_W);`,
      errors: [
        {
          messageId: "asyncVariable",
          data: { source: "Input.isKeyPressed", sink: "moving" },
        },
      ],
    },
    {
      name: "a module-level initialiser",
      code: `${imports}let started = os.clock();\nexport const name = GetUnitName(CreateUnit(Player(0)!, 0, 0, 0, 0)!);\nexport const local = MapPlayer.fromLocal();`,
      errors: [
        {
          messageId: "asyncVariable",
          data: { source: "os.clock", sink: "started" },
        },
        {
          messageId: "asyncVariable",
          data: { source: "GetUnitName", sink: "name" },
        },
        {
          messageId: "asyncVariable",
          data: { source: "MapPlayer.fromLocal", sink: "local" },
        },
      ],
    },
    ...invalid("SetUnitX(u, Math.floor(SOURCE));", "asyncArgument", "SetUnitX"),
    {
      name: "a source whose argument is a source reports once",
      code: inFunction("SetUnitX(u, os.difftime(os.time(), 0));"),
      errors: [
        {
          messageId: "asyncArgument",
          data: { source: "os.difftime", sink: "SetUnitX" },
        },
      ],
    },
    {
      name: "a new expression's argument",
      code: inFunction(
        "const state = new Map([[0, os.clock()]]);\nnew Array(os.date());",
      ),
      errors: [
        {
          messageId: "asyncArgument",
          data: { source: "os.date", sink: "new Array" },
        },
      ],
    },
  ],
});

describe("no-async-value-as-state in the recommended config", () => {
  it("warns", () => {
    expect(
      lintWithRecommended("export const started = os.clock();"),
    ).toMatchObject([
      {
        ruleId: "reforged/no-async-value-as-state",
        severity: 1,
        messageId: "asyncVariable",
      },
    ]);
  });

  it("names the sync System", () => {
    const [message] = lintWithRecommended("export const started = os.clock();");
    expect(message.message).toContain("sync System");
  });

  it("honours an eslint-disable-next-line escape with a reason", () => {
    expect(
      lintWithRecommended(
        "// eslint-disable-next-line reforged/no-async-value-as-state -- a log timestamp, never synced state\nexport const started = os.clock();",
      ),
    ).toEqual([]);
  });
});
