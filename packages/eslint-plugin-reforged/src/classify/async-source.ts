// The async-source classification: an expression whose value differs between
// clients. Sources:
// - a call whose resolved function or method carries the `@async` doc tag,
//   declared in reforged-types (a Native: `GetLocalPlayer()`) or in reforged-ts
//   (a library member: `MapPlayer.fromLocal()`);
// - a read of a reforged-ts accessor whose getter carries the tag
//   (`unit.name`; decision 3 of the #50 run);
// - a call to lua-types' `os.clock`, `os.time`, `os.date` or `os.difftime`.
// The tag is read from the declarations the checker resolves, never from the
// name: a project function named `GetLocalPlayer` is not a source, and a
// project function documented `@async` (JSDoc's tag for an async function)
// is not either.
import {
  AST_NODE_TYPES,
  type ParserServicesWithTypeInformation,
  type TSESTree,
} from "@typescript-eslint/utils";
import * as ts from "typescript";

import { memberName } from "./member.js";
import {
  type InvocationCandidate,
  mayInvokeListed,
  propertyName,
  resolvedDeclarations,
} from "./member-access.js";
import { isDeclaredIn, packageNameOf } from "./package.js";

/** The `os` functions that read the local clock. */
export const osClockFunctions: ReadonlySet<string> = new Set([
  "clock",
  "date",
  "difftime",
  "time",
]);

/** A node that can be a source: a call, or a member read (a getter). */
export type AsyncCandidate = InvocationCandidate;

/** A classified source. */
export interface AsyncSource {
  /** The source as the message names it: `GetLocalPlayer`, `MapPlayer.fromLocal`, `Unit#name`, `os.clock`. */
  readonly name: string;
}

/** `os.clock` (and the others), syntactically. */
function isOsClockCallee(
  callee: TSESTree.Expression,
): callee is TSESTree.MemberExpression & { object: TSESTree.Identifier } {
  return (
    callee.type === AST_NODE_TYPES.MemberExpression &&
    callee.object.type === AST_NODE_TYPES.Identifier &&
    callee.object.name === "os" &&
    osClockFunctions.has(propertyName(callee) ?? "")
  );
}

/**
 * Whether a node may be a source, without the checker: a plain call to a
 * name of `asyncNatives`, a call to a non-computed member (a library member
 * or `os.clock`), or a read of a non-computed member.
 */
export function mayBeAsyncSource(
  node: AsyncCandidate,
  asyncNatives: ReadonlySet<string>,
): boolean {
  return mayInvokeListed(node, asyncNatives, "any");
}

function hasAsyncTag(declaration: ts.Declaration): boolean {
  return ts
    .getJSDocTags(declaration)
    .some((tag) => tag.tagName.text === "async");
}

/**
 * The source a call or member read is (see the rules above), or undefined.
 * Asks the checker; pre-match with `mayBeAsyncSource`.
 */
export function classifyAsyncSource(
  services: ParserServicesWithTypeInformation,
  node: AsyncCandidate,
): AsyncSource | undefined {
  if (node.type === AST_NODE_TYPES.MemberExpression) {
    const name = propertyName(node);
    const getter = resolvedDeclarations(services, node.property).find(
      (each) =>
        ts.isGetAccessorDeclaration(each) &&
        isDeclaredIn(each, "reforged-ts") &&
        hasAsyncTag(each),
    );
    return getter === undefined || name === undefined
      ? undefined
      : { name: memberName(getter, name) ?? name };
  }
  const { callee } = node;
  if (callee.type === AST_NODE_TYPES.Identifier) {
    const native = resolvedDeclarations(services, callee).find(
      (each) =>
        ts.isFunctionDeclaration(each) &&
        isDeclaredIn(each, "reforged-types") &&
        hasAsyncTag(each),
    );
    return native === undefined ? undefined : { name: callee.name };
  }
  if (callee.type !== AST_NODE_TYPES.MemberExpression) {
    return undefined;
  }
  const name = propertyName(callee);
  if (name === undefined) {
    return undefined;
  }
  if (isOsClockCallee(callee)) {
    const isLuaOs = resolvedDeclarations(services, callee.object).some(
      (each) => packageNameOf(each.getSourceFile().fileName) === "lua-types",
    );
    return isLuaOs ? { name: `os.${name}` } : undefined;
  }
  const member = resolvedDeclarations(services, callee.property).find(
    (each) =>
      (ts.isMethodDeclaration(each) || ts.isMethodSignature(each)) &&
      (isDeclaredIn(each, "reforged-ts") ||
        isDeclaredIn(each, "reforged-types")) &&
      hasAsyncTag(each),
  );
  return member === undefined
    ? undefined
    : { name: memberName(member, name) ?? name };
}
