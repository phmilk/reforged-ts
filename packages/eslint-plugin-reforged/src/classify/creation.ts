// The creation classification (spec #50, as decided in the run):
//
// - a call to a Native listed in the plugin's creation-Natives file whose
//   declared return type is a Handle type other than a registration type
//   (`event`, `triggeraction`, `triggercondition`);
// - a call to a static member of a Wrapper whose name starts with `create`
//   (`create`, `createZ`, `createAttachment`, ...).
//
// Lookups and conversions (`Player`, `GetTriggerUnit`, `Convert*`) and the
// other Wrapper statics (`Timer.after`, `Unit.fromEvent`) are never
// creations. `Filter` and `Condition` are not creations either; rules that
// report them ask `resolveFilterOrCondition`.
import type {
  ParserServicesWithTypeInformation,
  TSESTree,
} from "@typescript-eslint/utils";

import { isRegistrationType, returnedHandleType } from "./handle.js";
import { calleeName, resolveNative } from "./native.js";
import { calleeMemberName, resolveWrapperStatic } from "./wrapper.js";

/** A call classified as a creation. */
export interface Creation {
  /** A creation Native, or a `create*` static of a Wrapper. */
  readonly kind: "native" | "wrapper";
  /** The callee as a message names it: `CreateTimer`, `Unit.create`. */
  readonly callee: string;
  /** The created type as a message names it: `timer`, `Unit`. */
  readonly type: string;
}

/**
 * Whether a Wrapper static's name makes it a creation: `create` followed by
 * nothing or an upper-case letter (`create`, `createZ`, `createAttachment`),
 * so a `created` or `creates` member is not one.
 */
export function isCreationStaticName(member: string): boolean {
  return /^create(?![a-z])/.test(member);
}

/**
 * The syntactic pre-match: whether a call could be a creation, from the
 * callee alone (a plain name in `creationNatives`, or `X.create*`). No
 * checker; ask `classifyCreation` for the matched node.
 */
export function mayBeCreation(
  call: TSESTree.CallExpression,
  creationNatives: ReadonlySet<string>,
): boolean {
  const name = calleeName(call);
  if (name !== undefined) {
    return creationNatives.has(name);
  }
  const member = calleeMemberName(call);
  return member !== undefined && isCreationStaticName(member);
}

/**
 * The creation a call makes, or undefined when it is not one. Asks the
 * checker: pre-match with `mayBeCreation` first.
 */
export function classifyCreation(
  services: ParserServicesWithTypeInformation,
  call: TSESTree.CallExpression,
  creationNatives: ReadonlySet<string>,
): Creation | undefined {
  const checker = services.program.getTypeChecker();
  if (calleeName(call) !== undefined) {
    const native = resolveNative(services, call);
    if (native === undefined || !creationNatives.has(native.name)) {
      return undefined;
    }
    const type = returnedHandleType(checker, native.declaration);
    return type === undefined || isRegistrationType(type)
      ? undefined
      : { kind: "native", callee: native.name, type };
  }
  const member = calleeMemberName(call);
  if (member === undefined || !isCreationStaticName(member)) {
    return undefined;
  }
  const wrapperStatic = resolveWrapperStatic(services, call);
  if (wrapperStatic === undefined) {
    return undefined;
  }
  const returned = checker.getNonNullableType(
    checker.getTypeAtLocation(services.esTreeNodeToTSNodeMap.get(call)),
  );
  return {
    kind: "wrapper",
    callee: `${wrapperStatic.className}.${member}`,
    type: checker.typeToString(returned),
  };
}

/** The Natives that wrap a callback in a boolexpr: `Filter` and `Condition`. */
export const filterOrConditionNatives: ReadonlySet<string> = new Set([
  "Filter",
  "Condition",
]);

/**
 * A call to the `Filter` or `Condition` Native, with the boolexpr type it
 * returns (`filterfunc`, `conditionfunc`); undefined otherwise.
 */
export function resolveFilterOrCondition(
  services: ParserServicesWithTypeInformation,
  call: TSESTree.CallExpression,
): Omit<Creation, "kind"> | undefined {
  const name = calleeName(call);
  if (name === undefined || !filterOrConditionNatives.has(name)) {
    return undefined;
  }
  const native = resolveNative(services, call);
  if (native === undefined) {
    return undefined;
  }
  const checker = services.program.getTypeChecker();
  const type = returnedHandleType(checker, native.declaration);
  return type === undefined ? undefined : { callee: native.name, type };
}
