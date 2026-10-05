// Where a call certainly runs: outside the context of any event or callback,
// or in a trigger's handler. The context of an event holds through every
// synchronous call from its handler, so a function the rule cannot follow (a
// named function, a method, a literal passed anywhere else) is never one.
// The certain places are:
// - module top level (the Lua root), as `top-level.ts` defines it;
// - the body of a function literal passed directly as the callback of an
//   Init stage (`Init.onGlobals`, `Init.onTriggers`, `Init.onInitTriggers`,
//   `Init.onGameStart`), when that registration is itself at module top
//   level: no stage has run yet, so the stage runs the callback later, from
//   the map's initialization. A registration anywhere else may come after
//   its stage ran, and the library then runs the callback at once, inside
//   the caller and its context (`init/stages.ts`). `Init.onGameStart` runs
//   its callbacks after `MarkGameStarted`, the callback of blizzard.j's
//   `bj_gameStartedTimer`: a Timer's expiry holds there. The other three
//   stages run from `main`, in no event;
// - the body of a function literal passed directly as a timer's callback
//   (`TimerStart`, `Timer.after`, `Timer.every`, `timer.start`): it runs
//   later, in its own thread, where only a Timer's expiry holds;
// - the body of a function literal passed directly as a trigger's handler
//   (`on`, `Trigger#addAction`, `TriggerAddAction`): the trigger's event
//   holds there, and the handler runs in a new thread, where no Timer's
//   expiry holds even when the trigger fires from a timer's callback (the
//   Nullability sweep, 3.0.0.24268). `ForGroup` and filter callbacks run in
//   the caller's thread instead.
// The innermost enclosing function literal decides; an immediately invoked
// function is transparent. A type assertion (`as`, `satisfies`, `!`) between
// the literal and the call does not change where it is passed.
import {
  AST_NODE_TYPES,
  type ParserServicesWithTypeInformation,
  type TSESTree,
} from "@typescript-eslint/utils";

import { resolveCallee, syntacticName } from "./callee.js";
import { type FunctionNode, isFunction } from "./function.js";
import { isAtModuleTopLevel, isImmediatelyInvoked } from "./top-level.js";

/** A place where no event context holds, but maybe a Timer's expiry. */
export type ContextFreePlace =
  | { readonly kind: "topLevel"; readonly timerExpiry: false }
  /** `callee`: the stage, `Init.onGameStart`. */
  | {
      readonly kind: "initStage";
      readonly callee: string;
      readonly timerExpiry: boolean;
    }
  /** `callee`: `TimerStart`, `Timer.after`, `Timer.every` or `Timer#start`. */
  | {
      readonly kind: "timerCallback";
      readonly callee: string;
      readonly timerExpiry: true;
    };

/**
 * The body of a trigger's handler: the trigger's event holds, in a new
 * thread where no Timer's expiry does. `callee`: `on`, `Trigger#addAction`
 * or `TriggerAddAction`.
 */
export interface TriggerHandlerPlace {
  readonly kind: "triggerHandler";
  readonly callee: string;
}

/** A place where a call certainly runs: context-free, or a trigger's handler. */
export type EventPlace = ContextFreePlace | TriggerHandlerPlace;

/** A function a callback is passed to, by the name `resolveCallee` gives it. */
interface CallbackTaker {
  /** The index of the callback among the arguments. */
  readonly index: number;
  /** The place the callback runs in. */
  readonly place: Exclude<EventPlace, { kind: "topLevel" }>;
}

function initStage(stage: string, timerExpiry: boolean): CallbackTaker {
  return {
    index: 0,
    place: { kind: "initStage", callee: `Init.${stage}`, timerExpiry },
  };
}

function timerCallback(callee: string, index: number): CallbackTaker {
  return { index, place: { kind: "timerCallback", callee, timerExpiry: true } };
}

function triggerHandler(callee: string, index: number): CallbackTaker {
  return { index, place: { kind: "triggerHandler", callee } };
}

/** The callback takers, by resolved name. */
const callbackTakers: ReadonlyMap<string, CallbackTaker> = new Map([
  ["InitStages#onGlobals", initStage("onGlobals", false)],
  ["InitStages#onTriggers", initStage("onTriggers", false)],
  ["InitStages#onInitTriggers", initStage("onInitTriggers", false)],
  ["InitStages#onGameStart", initStage("onGameStart", true)],
  ["TimerStart", timerCallback("TimerStart", 3)],
  ["Timer.after", timerCallback("Timer.after", 1)],
  ["Timer.every", timerCallback("Timer.every", 1)],
  ["Timer#start", timerCallback("Timer#start", 2)],
  ["on", triggerHandler("on", 1)],
  ["Trigger#addAction", triggerHandler("Trigger#addAction", 0)],
  ["TriggerAddAction", triggerHandler("TriggerAddAction", 1)],
]);

/** The last segment of each taker's name, with its callback index, for the syntactic pre-match. */
const takerIndexes: ReadonlyMap<string, number> = new Map(
  [...callbackTakers].map(([name, taker]) => [
    name.split(/[#.]/).pop() ?? name,
    taker.index,
  ]),
);

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

/** The type assertions that leave a value as it is. */
const transparentWrappers: ReadonlySet<string> = new Set([
  AST_NODE_TYPES.TSAsExpression,
  AST_NODE_TYPES.TSSatisfiesExpression,
  AST_NODE_TYPES.TSNonNullExpression,
  AST_NODE_TYPES.TSTypeAssertion,
]);

/**
 * The call a function literal is passed to directly (through type
 * assertions; parentheses leave no node), and its argument index; undefined
 * for a declaration, a method or any other position.
 */
function passedTo(
  fn: FunctionNode,
): { call: TSESTree.CallExpression; index: number } | undefined {
  if (fn.type === AST_NODE_TYPES.FunctionDeclaration) {
    return undefined;
  }
  let argument: TSESTree.Node = fn;
  let parent: TSESTree.Node | undefined = fn.parent;
  while (parent !== undefined && transparentWrappers.has(parent.type)) {
    argument = parent;
    parent = parent.parent;
  }
  if (parent?.type !== AST_NODE_TYPES.CallExpression) {
    return undefined;
  }
  const index = parent.arguments.indexOf(argument as TSESTree.Expression);
  return index < 0 ? undefined : { call: parent, index };
}

/**
 * The packages a callback taker called by its plain name is declared in:
 * the Natives (`TimerStart`) and the library's own functions (`on`).
 */
const takerPackages: ReadonlySet<string> = new Set([
  "reforged-types",
  "reforged-ts",
]);

/**
 * The place a function literal's body is, when the literal is passed
 * directly to an Init stage registered at module top level, as a timer's
 * callback or as a trigger's handler. Matches syntactically, then asks the
 * checker for the call it is passed to.
 */
function placeOfCallback(
  services: ParserServicesWithTypeInformation,
  fn: FunctionNode,
): EventPlace | undefined {
  const passed = passedTo(fn);
  if (passed === undefined) {
    return undefined;
  }
  const { call, index } = passed;
  const short = syntacticName(call);
  if (short === undefined || takerIndexes.get(short) !== index) {
    return undefined;
  }
  const name = resolveCallee(services, call, takerPackages)?.name;
  const taker = name === undefined ? undefined : callbackTakers.get(name);
  if (taker?.index !== index) {
    return undefined;
  }
  return taker.place.kind === "initStage" && !isAtModuleTopLevel(call)
    ? undefined
    : taker.place;
}

/**
 * The place a node certainly runs in (context-free, or a trigger's handler),
 * or undefined when the rule cannot tell. Syntactic first: the checker is
 * asked only for the call the innermost function literal is passed to, and
 * the answer is cached per function in `cache`.
 */
export function eventPlaceOf(
  services: ParserServicesWithTypeInformation,
  node: TSESTree.Node,
  cache: Map<FunctionNode, EventPlace | undefined>,
): EventPlace | undefined {
  const fn = innermostFunction(node);
  if (fn === undefined) {
    return isAtModuleTopLevel(node)
      ? { kind: "topLevel", timerExpiry: false }
      : undefined;
  }
  if (!cache.has(fn)) {
    cache.set(fn, placeOfCallback(services, fn));
  }
  return cache.get(fn);
}
