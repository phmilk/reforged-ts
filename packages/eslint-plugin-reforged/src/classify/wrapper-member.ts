// Wrapper members: a method call or an accessor assignment that the checker
// resolves to a member declared, inside reforged-ts, on a Wrapper class. A
// member a project class declares (even on a class extending a Wrapper) is a
// project function, not a Wrapper member.
import {
  AST_NODE_TYPES,
  type ParserServicesWithTypeInformation,
} from "@typescript-eslint/utils";
import * as ts from "typescript";

import type { Invocation } from "./allowlist.js";
import { isDeclaredIn } from "./package.js";
import { isWrapperClass } from "./wrapper.js";

/** A call or accessor assignment resolved to a Wrapper member. */
export interface WrapperMember {
  /** `Class#member` (instance) or `Class.member` (static), the allowlist's forms. */
  readonly name: string;
  /** The Wrapper declaring the member (`Unit` for `hero.kill()` when `Hero extends Unit`). */
  readonly className: string;
  /** The member's name. */
  readonly member: string;
  /** Whether the member is static. */
  readonly isStatic: boolean;
}

/**
 * The Wrapper member a call (`unit.kill()`, `Unit.create(...)`) or an
 * assignment to an accessor (`unit.life = 0`, as a call to its setter)
 * invokes, or undefined. Only a non-computed member access matches. Asks
 * the checker: match syntactically first.
 */
export function resolveWrapperMember(
  services: ParserServicesWithTypeInformation,
  node: Invocation,
): WrapperMember | undefined {
  const isCall = node.type === AST_NODE_TYPES.CallExpression;
  const target = isCall ? node.callee : node.left;
  if (
    target.type !== AST_NODE_TYPES.MemberExpression ||
    target.computed ||
    target.property.type !== AST_NODE_TYPES.Identifier
  ) {
    return undefined;
  }
  const member = target.property.name;
  const checker = services.program.getTypeChecker();
  const symbol = checker.getSymbolAtLocation(
    services.esTreeNodeToTSNodeMap.get(target.property),
  );
  for (const declaration of symbol?.declarations ?? []) {
    const matches = isCall
      ? ts.isMethodDeclaration(declaration)
      : ts.isSetAccessorDeclaration(declaration);
    const owner = declaration.parent;
    if (
      matches &&
      ts.isClassLike(owner) &&
      owner.name !== undefined &&
      isDeclaredIn(declaration, "reforged-ts") &&
      isWrapperClass(checker, owner)
    ) {
      const isStatic =
        (ts.getCombinedModifierFlags(declaration) & ts.ModifierFlags.Static) !==
        0;
      const className = owner.name.text;
      return {
        name: `${className}${isStatic ? "." : "#"}${member}`,
        className,
        member,
        isStatic,
      };
    }
  }
  return undefined;
}
