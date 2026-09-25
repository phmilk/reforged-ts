// The allowlist classification: which entry of data/local-safe.json a call,
// or an assignment to a library accessor, invokes. Names are resolved
// through the type checker, so a project function or method that shares a
// listed name is never on the list.
//
// Name forms (the ones data/local-safe.json uses):
// - a Native: a function declared in reforged-types, by its name;
// - a Lua global of lua-types (`print`), by its name;
// - an instance member of a class or interface declared in reforged-ts:
//   `Class#member`; a static member: `Class.member`;
// - `obj.prop = value` (any assignment operator) on an accessor with a setter
//   declared in reforged-ts: `Class#prop` (or `Class.prop` when static), as a
//   call to that setter (decision 4 of the #50 run).
import {
  AST_NODE_TYPES,
  type ParserServicesWithTypeInformation,
  type TSESTree,
} from "@typescript-eslint/utils";
import * as ts from "typescript";

import type { LocalSafeEntry, LocalSafeKind } from "../data/index.js";
import { isDeclaredIn, packageNameOf } from "./package.js";

/** What can invoke an allowlist entry: a call, or an assignment to an accessor. */
export type Invocation =
  TSESTree.CallExpression | TSESTree.AssignmentExpression;

/** The packages whose global functions an allowlist name can denote. */
const globalFunctionPackages = new Set(["reforged-types", "lua-types"]);

/** The member (or global function) name an invocation names syntactically. */
function syntacticName(node: Invocation): string | undefined {
  const target =
    node.type === AST_NODE_TYPES.CallExpression ? node.callee : node.left;
  if (target.type === AST_NODE_TYPES.Identifier) {
    return node.type === AST_NODE_TYPES.CallExpression
      ? target.name
      : undefined;
  }
  if (
    target.type === AST_NODE_TYPES.MemberExpression &&
    !target.computed &&
    target.property.type === AST_NODE_TYPES.Identifier
  ) {
    return target.property.name;
  }
  return undefined;
}

function resolvedSymbol(
  services: ParserServicesWithTypeInformation,
  node: TSESTree.Node,
): ts.Symbol | undefined {
  const checker = services.program.getTypeChecker();
  const symbol = checker.getSymbolAtLocation(
    services.esTreeNodeToTSNodeMap.get(node),
  );
  return symbol !== undefined && symbol.flags & ts.SymbolFlags.Alias
    ? checker.getAliasedSymbol(symbol)
    : symbol;
}

function memberName(
  declaration: ts.Declaration,
  member: string,
): string | undefined {
  const owner = declaration.parent;
  if (
    !(ts.isClassDeclaration(owner) || ts.isInterfaceDeclaration(owner)) ||
    owner.name === undefined ||
    !isDeclaredIn(declaration, "reforged-ts")
  ) {
    return undefined;
  }
  const isStatic =
    ts.getCombinedModifierFlags(declaration) & ts.ModifierFlags.Static;
  return `${owner.name.text}${isStatic ? "." : "#"}${member}`;
}

/**
 * The allowlist name of what a call or accessor assignment invokes (see the
 * name forms above), or undefined when it invokes nothing the allowlist can
 * name: a project function, a computed member, a plain property write.
 * Asks the checker; match syntactically first (`Allowlist.kindOf` does).
 */
export function invokedName(
  services: ParserServicesWithTypeInformation,
  node: Invocation,
): string | undefined {
  const name = syntacticName(node);
  if (name === undefined) {
    return undefined;
  }
  const target =
    node.type === AST_NODE_TYPES.CallExpression ? node.callee : node.left;
  if (target.type === AST_NODE_TYPES.Identifier) {
    const declaration = resolvedSymbol(services, target)?.declarations?.find(
      (each) =>
        ts.isFunctionDeclaration(each) &&
        globalFunctionPackages.has(
          packageNameOf(each.getSourceFile().fileName) ?? "",
        ),
    );
    return declaration === undefined ? undefined : name;
  }
  if (target.type !== AST_NODE_TYPES.MemberExpression) {
    return undefined;
  }
  const isCall = node.type === AST_NODE_TYPES.CallExpression;
  for (const declaration of resolvedSymbol(services, target.property)
    ?.declarations ?? []) {
    const matches = isCall
      ? ts.isMethodDeclaration(declaration) || ts.isMethodSignature(declaration)
      : ts.isSetAccessorDeclaration(declaration);
    const found = matches ? memberName(declaration, name) : undefined;
    if (found !== undefined) {
      return found;
    }
  }
  return undefined;
}

/** The allowlist of data/local-safe.json, indexed for the rules. */
export interface Allowlist {
  /** The kind of a listed name, undefined when the name is not listed. */
  kindOfName(name: string): LocalSafeKind | undefined;
  /**
   * The kind of the entry a call or accessor assignment invokes, undefined
   * when it invokes no listed entry. Matches the name syntactically, then
   * asks the checker through `invokedName`.
   */
  kindOf(
    services: ParserServicesWithTypeInformation,
    node: Invocation,
  ): LocalSafeKind | undefined;
  /** Like `kindOf`, with the resolved name (for messages). */
  entryOf(
    services: ParserServicesWithTypeInformation,
    node: Invocation,
  ): { readonly name: string; readonly kind: LocalSafeKind } | undefined;
}

/**
 * Indexes the allowlist. `extraVisual` adds names (same forms) treated as
 * `visual`, for a rule's `allow` option; a listed entry keeps its own kind.
 */
export function createAllowlist(
  entries: readonly LocalSafeEntry[],
  extraVisual: readonly string[] = [],
): Allowlist {
  const kinds = new Map<string, LocalSafeKind>();
  for (const name of extraVisual) {
    kinds.set(name, "visual");
  }
  for (const entry of entries) {
    kinds.set(entry.name, entry.kind);
  }
  // The last segment of every name, for the syntactic pre-match.
  const shortNames = new Set(
    [...kinds.keys()].map((name) => name.split(/[#.]/).pop() ?? name),
  );
  const allowlist: Allowlist = {
    kindOfName: (name) => kinds.get(name),
    kindOf: (services, node) => allowlist.entryOf(services, node)?.kind,
    entryOf(services, node) {
      const short = syntacticName(node);
      if (short === undefined || !shortNames.has(short)) {
        return undefined;
      }
      const name = invokedName(services, node);
      const kind = name === undefined ? undefined : kinds.get(name);
      return name === undefined || kind === undefined
        ? undefined
        : { name, kind };
    },
  };
  return allowlist;
}
