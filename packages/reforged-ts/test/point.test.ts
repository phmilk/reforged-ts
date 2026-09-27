/** @noSelfInFile */

// Point on the Handle base: creation throws.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { Point } from "../src/index";
import { defined } from "./support/defined";
import { handleRef } from "./support/handle-ref";
import { describeNatives, nativeCase } from "./support/native-cases";
import { withNative } from "./support/native-override";
import { raisedIn } from "./support/raised-in";

describe("Point.create", () => {
  it("wraps the handle Location returns, and a lookup finds it", () => {
    const point = Point.create(16, -32);
    expect(stubCalls()).toContainCall("Location(16, -32)");
    expect(Point.fromHandle(point.handle)).toBe(point);
  });

  it("throws when Location returns nil", () => {
    const message = withNative(
      "Location",
      () => undefined,
      () =>
        raisedIn(() => {
          Point.create(16, -32);
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Point");
  });
});

{
  const point = Point.create(16, -32);
  const ref = handleRef("location", point.handle);
  const masked = defined(ConvertFogState(2), "ConvertFogState(2)");
  // The library does not wrap minimapicon: a sentinel the call log renders
  // by name stands for the handle the game returns.
  const icon = { __name: "minimapicon#1" } as unknown as minimapicon;

  describeNatives("Point members", [
    nativeCase({
      native: "CreateMinimapIconAtLoc",
      answer: () => icon,
      member: () =>
        point.createMinimapIcon(255, 128, 0, "UI/Minimap/Ping.mdx", masked),
      line: `CreateMinimapIconAtLoc(${ref}, 255, 128, 0, "UI/Minimap/Ping.mdx", ${handleRef("fogstate", masked)})`,
      returns: icon,
    }),
  ]);

  it("createMinimapIcon throws when CreateMinimapIconAtLoc returns nil", () => {
    const message = withNative(
      "CreateMinimapIconAtLoc",
      () => undefined,
      () =>
        raisedIn(() => {
          point.createMinimapIcon(255, 128, 0, "UI/Minimap/Ping.mdx", masked);
        }),
    );
    expect(message).toEqual(
      "reforged-ts: failed to create minimapicon (UI/Minimap/Ping.mdx)",
    );
  });

  const lookups = [
    ["GetOrderPointLoc", () => Point.fromOrderPoint()],
    ["GetSpellTargetLoc", () => Point.fromSpellTarget()],
    ["BlzGetTriggerPlayerMousePosition", () => Point.fromMousePosition()],
  ] as const;

  describeNatives(
    "Point event lookups",
    lookups.map(([native, member]) =>
      nativeCase({
        native,
        answer: () => point.handle,
        member,
        line: `${native}()`,
        returns: point,
      }),
    ),
  );

  describeNatives(
    "Point event lookups when their Native answers nil",
    lookups.map(([native, member]) =>
      nativeCase({
        native,
        answer: () => undefined,
        member,
        line: `${native}()`,
      }),
    ),
  );
}
