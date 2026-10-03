// Where no event context can hold: the places a call certainly runs outside
// the context of any event or callback. The context of an event holds
// through every synchronous call from its handler, so a function the rule
// cannot follow (a named function, a method, a literal passed anywhere
// else) is never one. The certain places are:
// - module top level (the Lua root), as `top-level.ts` defines it;
// - the body of a function literal passed directly as the callback of an
//   Init stage (`Init.onGlobals`, `Init.onTriggers`, `Init.onInitTriggers`,
//   `Init.onGameStart`): it runs from the map's init, in no event;
// - the body of a function literal passed directly as a timer's callback
//   (`TimerStart`, `Timer.after`, `Timer.every`, `timer.start`): it runs
//   later, in its own thread, after the handler that started the timer has
//   returned. Only a Timer's expiry holds there.
// The innermost enclosing function literal decides; an immediately invoked
// function is transparent.
import {
  AST_NODE_TYPES,
  type ParserServicesWithTypeInformation,
  type TSESTree,
} from "@typescript-eslint/utils";
import * as ts from "typescript";

import { type FunctionNode, isFunction } from "./function.js";
import { memberName } from "./member.js";
import { resolveNative } from "./native.js";
import { isDeclaredIn } from "./package.js";
import { isAtModuleTopLevel, isImmediatelyInvoked } from "./top-level.js";
import { resolveWrapperMember } from "./wrapper-member.js";

/** A place where no event context holds. */
export type ContextFreePlace =
  | { readonly kind: "topLevel" }
  /** `callee`: the stage, `Init.onGameStart`. */
  | { readonly kind: "initStage"; readonly callee: string }
  /** `callee`: `TimerStart`, `Timer.after`, `Timer.every` or `Timer#start`. */
  | { readonly kind: "timerCallback"; readonly callee: string };

/** The Init stages, by member name. */
const initStages: ReadonlySet<string> = new Set([
  "onGlobals",
  "onTriggers",
  "onInitTriggers",
  "onGameStart",
]);

/** The timer members, by the name of the member, with the index of their callback. */
const timerMembers: ReadonlyMap<string, { name: string; index: number }> =
  new Map([
    ["after", { name: "Timer.after", index: 1 }],
    ["every", { name: "Timer.every", index: 1 }],
    ["start", { name: "Timer#start", index: 2 }],
  ]);

/** The index of `TimerStart`'s callback. */
const timerStartCallback = 3;

/** The innermost enclosing function that is not immediately invoked. */
function innermostFunction(node: TSESTree.Node): FunctionNode | undefined {
  let parent = node.parent as TSESTree.Node | null | undefined;
  while (parent != null) {
    if (isFunction(parent) && !isImmediatelyInvoked(parent)) {
      return parent;
    }
    parent = parent.parent;
  }
  return undefined;
}

/**
 * The call a function literal is passed to directly, and its argument
 * index; undefined for a declaration, a method or any other position.
 */
function passedTo(
  fn: FunctionNode,
): { call: TSESTree.CallExpression; index: number } | undefined {
  if (fn.type === AST_NODE_TYPES.FunctionDeclaration) {
    return undefined;
  }
  const { parent } = fn;
  if (parent.type !== AST_NODE_TYPES.CallExpression) {
    return undefined;
  }
  const index = parent.arguments.indexOf(fn);
  return index < 0 ? undefined : { call: parent, index };
}

function propertyName(member: TSESTree.MemberExpression): string | undefined {
  return !member.computed && member.property.type === AST_NODE_TYPES.Identifier
    ? member.property.name
    : undefined;
}

/** Whether an Init stage call resolves to the library's `InitStages`. */
function isInitStage(
  services: ParserServicesWithTypeInformation,
  callee: TSESTree.MemberExpression,
  stage: string,
): boolean {
  const checker = services.program.getTypeChecker();
  const symbol = checker.getSymbolAtLocation(
    services.esTreeNodeToTSNodeMap.get(callee.property),
  );
  return (symbol?.declarations ?? []).some(
    (each) =>
      (ts.isMethodSignature(each) || ts.isMethodDeclaration(each)) &&
      isDeclaredIn(each, "reforged-ts") &&
      memberName(each, stage) === `InitStages#${stage}`,
  );
}

/**
 * The context-free place a function literal's body is, when the literal is
 * passed directly to an Init stage or as a timer's callback. Matches
 * syntactically, then asks the checker for the call it is passed to.
 */
function placeOfCallback(
  services: ParserServicesWithTypeInformation,
  fn: FunctionNode,
): ContextFreePlace | undefined {
  const passed = passedTo(fn);
  if (passed === undefined) {
    return undefined;
  }
  const { call, index } = passed;
  const { callee } = call;
  if (callee.type === AST_NODE_TYPES.Identifier) {
    return callee.name === "TimerStart" &&
      index === timerStartCallback &&
      resolveNative(services, call)?.name === "TimerStart"
      ? { kind: "timerCallback", callee: "TimerStart" }
      : undefined;
  }
  if (callee.type !== AST_NODE_TYPES.MemberExpression) {
    return undefined;
  }
  const property = propertyName(callee);
  if (property === undefined) {
    return undefined;
  }
  if (initStages.has(property)) {
    return index === 0 && isInitStage(services, callee, property)
      ? { kind: "initStage", callee: `Init.${property}` }
      : undefined;
  }
  const timer = timerMembers.get(property);
  if (timer?.index !== index) {
    return undefined;
  }
  return resolveWrapperMember(services, call)?.name === timer.name
    ? { kind: "timerCallback", callee: timer.name }
    : undefined;
}

/**
 * The context-free place a node runs in, or undefined when an event context
 * may hold there. Syntactic first: the checker is asked only for the call
 * the innermost function literal is passed to, and the answer is cached per
 * function in `cache`.
 */
export function contextFreePlaceOf(
  services: ParserServicesWithTypeInformation,
  node: TSESTree.Node,
  cache: Map<FunctionNode, ContextFreePlace | undefined>,
): ContextFreePlace | undefined {
  const fn = innermostFunction(node);
  if (fn === undefined) {
    return isAtModuleTopLevel(node) ? { kind: "topLevel" } : undefined;
  }
  if (!cache.has(fn)) {
    cache.set(fn, placeOfCallback(services, fn));
  }
  return cache.get(fn);
}
