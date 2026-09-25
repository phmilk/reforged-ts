// The Wrapper classification: a class whose inheritance chain reaches the
// `Handle` base class declared inside the reforged-ts package. A project
// class that extends a Wrapper is a Wrapper too; a project class named
// `Handle`, or one that only looks like a Wrapper, is not.
import {
  AST_NODE_TYPES,
  type ParserServicesWithTypeInformation,
  type TSESTree,
} from "@typescript-eslint/utils";
import * as ts from "typescript";

import { isDeclaredIn } from "./package.js";

const wrapperOfClass = new WeakMap<ts.ClassLikeDeclaration, boolean>();

function isHandleBase(declaration: ts.ClassLikeDeclaration): boolean {
  return (
    declaration.name?.text === "Handle" &&
    isDeclaredIn(declaration, "reforged-ts")
  );
}

function classDeclarationOf(
  type: ts.Type,
): ts.ClassLikeDeclaration | undefined {
  return type
    .getSymbol()
    ?.declarations?.find((each): each is ts.ClassLikeDeclaration =>
      ts.isClassLike(each),
    );
}

/** The class declarations of a class type's base classes (generic bases by their target). */
function baseClassDeclarations(
  checker: ts.TypeChecker,
  declaration: ts.ClassLikeDeclaration,
): ts.ClassLikeDeclaration[] {
  const symbol =
    declaration.name === undefined
      ? undefined
      : checker.getSymbolAtLocation(declaration.name);
  const type = symbol && checker.getDeclaredTypeOfSymbol(symbol);
  if (!type?.isClassOrInterface()) {
    return [];
  }
  return checker
    .getBaseTypes(type)
    .map(classDeclarationOf)
    .filter((each) => each !== undefined);
}

/**
 * Whether a class is a Wrapper: its inheritance chain reaches the `Handle`
 * base of reforged-ts (the base itself included). Cached per declaration.
 */
export function isWrapperClass(
  checker: ts.TypeChecker,
  declaration: ts.ClassLikeDeclaration,
): boolean {
  const cached = wrapperOfClass.get(declaration);
  if (cached !== undefined) {
    return cached;
  }
  wrapperOfClass.set(declaration, false); // a cycle is not a Wrapper
  const result =
    isHandleBase(declaration) ||
    baseClassDeclarations(checker, declaration).some((base) =>
      isWrapperClass(checker, base),
    );
  wrapperOfClass.set(declaration, result);
  return result;
}

/**
 * The class name when a type, with `undefined` and `null` removed, is an
 * instance of a Wrapper (`Unit` for `Unit | undefined`); otherwise undefined.
 */
export function wrapperClassOf(
  checker: ts.TypeChecker,
  type: ts.Type,
): string | undefined {
  const nonNullable = checker.getNonNullableType(type);
  if (nonNullable.isUnion()) {
    return undefined;
  }
  const declaration = classDeclarationOf(nonNullable);
  return declaration !== undefined && isWrapperClass(checker, declaration)
    ? declaration.name?.text
    : undefined;
}

/** A call the checker resolved to a static member of a Wrapper. */
export interface WrapperStaticCall {
  /** The Wrapper declaring the member (`Unit` for `Hero.create()` when `Hero extends Unit`). */
  readonly className: string;
  /** The member's name (`create`, `fromHandle`, ...). */
  readonly member: string;
  /** The member's declaration. */
  readonly declaration: ts.Declaration;
}

/**
 * The static Wrapper member a call calls (`Unit.create(...)`), or undefined
 * when the callee is not a non-computed member access that resolves to a
 * static member declared on a Wrapper. Match syntactically first (for
 * instance on the member's name) and call this for the matched node only.
 */
export function resolveWrapperStatic(
  services: ParserServicesWithTypeInformation,
  call: TSESTree.CallExpression,
): WrapperStaticCall | undefined {
  const member = calleeMemberName(call);
  if (member === undefined) {
    return undefined;
  }
  const checker = services.program.getTypeChecker();
  const access = services.esTreeNodeToTSNodeMap.get(call.callee);
  if (!ts.isPropertyAccessExpression(access)) {
    return undefined;
  }
  const declaration = checker
    .getSymbolAtLocation(access.name)
    ?.declarations?.find(
      (each) =>
        ts.isClassElement(each) &&
        ts.getCombinedModifierFlags(each) & ts.ModifierFlags.Static &&
        ts.isClassLike(each.parent) &&
        isWrapperClass(checker, each.parent),
    );
  const owner = declaration?.parent;
  if (
    declaration === undefined ||
    owner === undefined ||
    !ts.isClassLike(owner) ||
    owner.name === undefined
  ) {
    return undefined;
  }
  return { className: owner.name.text, member, declaration };
}

/** The member name of a `X.member(...)` callee (non-computed), for the syntactic pre-match. */
export function calleeMemberName(
  call: TSESTree.CallExpression,
): string | undefined {
  const { callee } = call;
  return callee.type === AST_NODE_TYPES.MemberExpression &&
    !callee.computed &&
    callee.property.type === AST_NODE_TYPES.Identifier
    ? callee.property.name
    : undefined;
}
