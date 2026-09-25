// Random-number calls that draw from, or reseed, the stream every client
// shares (pitfall D2): the RNG Natives, and `Math.random`, which
// typescript-to-lua compiles to Lua's `math.random`; lua-types' `math.random`
// and `math.randomseed` are matched too.
import {
  AST_NODE_TYPES,
  type ParserServicesWithTypeInformation,
  type TSESTree,
} from "@typescript-eslint/utils";

import { packageNameOf } from "./package.js";

/** The Natives that draw from or reseed the shared random stream. */
export const randomNatives: ReadonlySet<string> = new Set([
  "GetRandomInt",
  "GetRandomReal",
  "SetRandomSeed",
]);

/**
 * `Math.random` (the global of TypeScript's default library), or
 * `math.random` / `math.randomseed` (declared by lua-types), when a call
 * calls it: that name, else undefined. A project binding named `Math` or
 * `math` is not matched.
 */
export function randomMemberCall(
  services: ParserServicesWithTypeInformation,
  call: TSESTree.CallExpression,
): string | undefined {
  const { callee } = call;
  if (
    callee.type !== AST_NODE_TYPES.MemberExpression ||
    callee.computed ||
    callee.object.type !== AST_NODE_TYPES.Identifier ||
    callee.property.type !== AST_NODE_TYPES.Identifier
  ) {
    return undefined;
  }
  const object = callee.object.name;
  const member = callee.property.name;
  const matchesName =
    member === "random" || (object === "math" && member === "randomseed");
  if (!matchesName || (object !== "Math" && object !== "math")) {
    return undefined;
  }
  const checker = services.program.getTypeChecker();
  const declarations =
    checker.getSymbolAtLocation(
      services.esTreeNodeToTSNodeMap.get(callee.property),
    )?.declarations ?? [];
  const matches = declarations.some((each) => {
    const file = each.getSourceFile();
    return object === "Math"
      ? services.program.isSourceFileDefaultLibrary(file)
      : packageNameOf(file.fileName) === "lua-types";
  });
  return matches ? `${object}.${member}` : undefined;
}
