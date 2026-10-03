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
} from "@typescript-eslint/utils";
import * as ts from "typescript";

import type { EventResponse } from "../data/index.js";
import { memberName } from "./member.js";
import {
  type InvocationCandidate,
  mayInvokeListed,
  propertyName,
  resolvedDeclarations,
} from "./member-access.js";
import { resolveNative } from "./native.js";
import { isDeclaredIn, packageNameOf } from "./package.js";

/** A node that can read an event response: a call, or a member read (a getter). */
export type EventResponseCandidate = InvocationCandidate;

/** A classified event response read. */
export interface EventResponseRead {
  /** The read as the message names it: `GetTriggerUnit`, `Unit.fromEvent`. */
  readonly name: string;
  /** The listed Native it reads. */
  readonly response: EventResponse;
}

/**
 * The names of the library members that may read an event response: every
 * method or getter declared in reforged-ts whose `@native` tags all name
 * listed event responses. Read from the program's reforged-ts declarations,
 * for the syntactic pre-match only (`classifyEventResponse` decides).
 */
export function eventResponseMemberNames(
  program: ts.Program,
  responses: ReadonlyMap<string, EventResponse>,
): ReadonlySet<string> {
  const names = new Set<string>();
  const visit = (node: ts.Node): void => {
    if (ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)) {
      for (const member of node.members) {
        if (
          (ts.isMethodDeclaration(member) ||
            ts.isMethodSignature(member) ||
            ts.isGetAccessorDeclaration(member)) &&
          ts.isIdentifier(member.name) &&
          responseOfTags(member, responses) !== undefined
        ) {
          names.add(member.name.text);
        }
      }
    } else if (ts.isModuleDeclaration(node) || ts.isModuleBlock(node)) {
      ts.forEachChild(node, visit);
    }
  };
  for (const file of program.getSourceFiles()) {
    if (packageNameOf(file.fileName) === "reforged-ts") {
      file.statements.forEach(visit);
    }
  }
  return names;
}

/**
 * Whether a node may read an event response, without the checker: a plain
 * call to a listed Native, or a call to (or a read of) a non-computed member
 * named in `memberNames` (`eventResponseMemberNames`).
 */
export function mayReadEventResponse(
  node: EventResponseCandidate,
  responses: ReadonlyMap<string, EventResponse>,
  memberNames: ReadonlySet<string>,
): boolean {
  return mayInvokeListed(node, responses, memberNames);
}

/** The Natives a declaration's `@native` tags name, in order. */
function nativeTags(declaration: ts.Declaration): string[] {
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

/**
 * The event response a call or member read reads, or undefined. Asks the
 * checker: pre-match with `mayReadEventResponse`.
 */
export function classifyEventResponse(
  services: ParserServicesWithTypeInformation,
  node: EventResponseCandidate,
  responses: ReadonlyMap<string, EventResponse>,
): EventResponseRead | undefined {
  const isGetter = node.type === AST_NODE_TYPES.MemberExpression;
  if (!isGetter && node.callee.type === AST_NODE_TYPES.Identifier) {
    const native = resolveNative(services, node);
    const response = native && responses.get(native.name);
    return response === undefined
      ? undefined
      : { name: response.name, response };
  }
  const target = isGetter ? node : node.callee;
  if (target.type !== AST_NODE_TYPES.MemberExpression) {
    return undefined;
  }
  const name = propertyName(target);
  if (name === undefined) {
    return undefined;
  }
  for (const declaration of resolvedDeclarations(services, target.property)) {
    const kindMatches = isGetter
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
