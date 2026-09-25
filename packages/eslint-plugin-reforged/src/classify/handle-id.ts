// The handle-id classification: a read of a Handle's engine id. Two forms:
// - a call to the Native `GetHandleId` (declared in reforged-types);
// - a read of the `id` accessor declared on the `Handle` base of reforged-ts
//   (`unit.id`, `this.id` in a Wrapper subclass). A Wrapper that overrides
//   `id` with something else (`MapPlayer#id` is the player's slot index,
//   `GetPlayerId`) is not a handle id.
import {
  AST_NODE_TYPES,
  type ParserServicesWithTypeInformation,
  type TSESTree,
} from "@typescript-eslint/utils";
import * as ts from "typescript";

import { calleeName, resolveNative } from "./native.js";
import { isDeclaredIn } from "./package.js";

/** Whether a call calls the Native `GetHandleId`. */
export function isGetHandleIdCall(
  services: ParserServicesWithTypeInformation,
  call: TSESTree.CallExpression,
): boolean {
  return (
    calleeName(call) === "GetHandleId" &&
    resolveNative(services, call)?.name === "GetHandleId"
  );
}

function isHandleBaseIdAccessor(declaration: ts.Declaration): boolean {
  const owner = declaration.parent;
  return (
    ts.isGetAccessorDeclaration(declaration) &&
    ts.isClassLike(owner) &&
    owner.name?.text === "Handle" &&
    isDeclaredIn(owner, "reforged-ts")
  );
}

/**
 * Whether a member expression reads the `id` accessor of the `Handle` base
 * (`unit.id`, `unit?.id`). A computed access and an `id` that a
 * class redeclares are not.
 */
export function isHandleIdRead(
  services: ParserServicesWithTypeInformation,
  member: TSESTree.MemberExpression,
): boolean {
  if (
    member.computed ||
    member.property.type !== AST_NODE_TYPES.Identifier ||
    member.property.name !== "id"
  ) {
    return false;
  }
  const access = services.esTreeNodeToTSNodeMap.get(member);
  if (!ts.isPropertyAccessExpression(access)) {
    return false;
  }
  const declarations =
    services.program.getTypeChecker().getSymbolAtLocation(access.name)
      ?.declarations ?? [];
  return declarations.some(isHandleBaseIdAccessor);
}
