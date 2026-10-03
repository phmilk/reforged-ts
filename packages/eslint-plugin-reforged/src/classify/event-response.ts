// The event-response classification: a call that reads the context of an
// event or a callback. Two kinds of call:
// - a Native listed in data/event-responses.json (`GetTriggerUnit()`), the
//   callee resolving to the Typings;
// - a library member (`Unit.fromEvent()`, `Trigger.eventId`) whose
//   declaration in reforged-ts carries `@native` tags that all name listed
//   event responses. The tags decide, never the member's name. A member that
//   also names another Native (`Group#getUnits`: `ForGroup` and
//   `GetEnumUnit`) opens the context itself and is not one.
import {
  AST_NODE_TYPES,
  type ParserServicesWithTypeInformation,
  type TSESTree,
} from "@typescript-eslint/utils";
import * as ts from "typescript";

import type { EventResponse } from "../data/index.js";
import { memberName } from "./member.js";
import { calleeName, resolveNative } from "./native.js";
import { isDeclaredIn } from "./package.js";

/** A node that can read an event response: a call, or a member read (a getter). */
export type EventResponseCandidate =
  TSESTree.CallExpression | TSESTree.MemberExpression;

/** A classified event response read. */
export interface EventResponseRead {
  /** The read as the message names it: `GetTriggerUnit`, `Unit.fromEvent`. */
  readonly name: string;
  /** The listed Native it reads. */
  readonly response: EventResponse;
}

function propertyName(member: TSESTree.MemberExpression): string | undefined {
  return !member.computed && member.property.type === AST_NODE_TYPES.Identifier
    ? member.property.name
    : undefined;
}

/**
 * Whether a node may read an event response, without the checker: a plain
 * call to a listed name, a call to a non-computed member, or a non-computed
 * member read that is not itself the callee of a call.
 */
export function mayReadEventResponse(
  node: EventResponseCandidate,
  responses: ReadonlyMap<string, EventResponse>,
): boolean {
  if (node.type === AST_NODE_TYPES.MemberExpression) {
    const { parent } = node;
    return (
      propertyName(node) !== undefined &&
      !(parent.type === AST_NODE_TYPES.CallExpression && parent.callee === node)
    );
  }
  const callee = calleeName(node);
  if (callee !== undefined) {
    return responses.has(callee);
  }
  return (
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    propertyName(node.callee) !== undefined
  );
}

/** The Natives a declaration's `@native` tags name, in order. */
export function nativeTags(declaration: ts.Declaration): string[] {
  return ts
    .getJSDocTags(declaration)
    .filter((tag) => tag.tagName.text === "native")
    .map((tag) => ts.getTextOfJSDocComment(tag.comment)?.trim() ?? "")
    .map((text) => text.split(/\s/)[0] ?? "")
    .filter((name) => name !== "");
}

/**
 * The event response a member declaration reads: its `@native` tags all name
 * listed event responses (the first decides), or undefined.
 */
function responseOfTags(
  declaration: ts.Declaration,
  responses: ReadonlyMap<string, EventResponse>,
): EventResponse | undefined {
  const tags = nativeTags(declaration);
  if (tags.length === 0 || !tags.every((tag) => responses.has(tag))) {
    return undefined;
  }
  return responses.get(tags[0]);
}

function resolvedDeclarations(
  services: ParserServicesWithTypeInformation,
  node: TSESTree.Node,
): readonly ts.Declaration[] {
  const checker = services.program.getTypeChecker();
  let symbol = checker.getSymbolAtLocation(
    services.esTreeNodeToTSNodeMap.get(node),
  );
  if (symbol !== undefined && symbol.flags & ts.SymbolFlags.Alias) {
    symbol = checker.getAliasedSymbol(symbol);
  }
  return symbol?.declarations ?? [];
}

/**
 * The event response a call or member read reads, or undefined. Asks the
 * checker: pre-match with `mayReadEventResponse`.
 */
export function classifyEventResponse(
  services: ParserServicesWithTypeInformation,
  node: EventResponseCandidate,
  responses: ReadonlyMap<string, EventResponse>,
): EventResponseRead | undefined {
  const isRead = node.type === AST_NODE_TYPES.MemberExpression;
  if (!isRead && node.callee.type === AST_NODE_TYPES.Identifier) {
    const native = resolveNative(services, node);
    const response = native && responses.get(native.name);
    return response === undefined
      ? undefined
      : { name: response.name, response };
  }
  const target = isRead ? node : node.callee;
  if (target.type !== AST_NODE_TYPES.MemberExpression) {
    return undefined;
  }
  const name = propertyName(target);
  if (name === undefined) {
    return undefined;
  }
  for (const declaration of resolvedDeclarations(services, target.property)) {
    const kindMatches = isRead
      ? ts.isGetAccessorDeclaration(declaration)
      : ts.isMethodDeclaration(declaration) ||
        ts.isMethodSignature(declaration);
    if (!kindMatches || !isDeclaredIn(declaration, "reforged-ts")) {
      continue;
    }
    const response = responseOfTags(declaration, responses);
    if (response !== undefined) {
      return { name: memberName(declaration, name) ?? name, response };
    }
  }
  return undefined;
}
