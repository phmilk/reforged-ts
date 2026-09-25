// Collections keyed by a Wrapper: `new Map(...)` or `new Set(...)` of the
// default library whose key type (the first type argument, explicit or
// inferred) is a Wrapper class. For `prefer-handle-map`.
import {
  AST_NODE_TYPES,
  type ParserServicesWithTypeInformation,
  type TSESTree,
} from "@typescript-eslint/utils";
import * as ts from "typescript";

import { wrapperClassOf } from "./wrapper.js";

export type CollectionName = "Map" | "Set";

const collectionNames: ReadonlySet<string> = new Set<CollectionName>([
  "Map",
  "Set",
]);

/** A `new` of a global collection, keyed by a Wrapper. */
export interface WrapperKeyedCollection {
  /** The constructor's identifier (`Map` or `Set`). */
  readonly callee: TSESTree.Identifier & { readonly name: CollectionName };
  /** The Wrapper class of the key (`Unit`). */
  readonly wrapper: string;
}

/** `new Map(...)` / `new Set(...)` by name: the syntactic pre-match. */
export function mayBeCollection(node: TSESTree.NewExpression): boolean {
  return (
    node.callee.type === AST_NODE_TYPES.Identifier &&
    collectionNames.has(node.callee.name)
  );
}

/** Whether the constructor is the global of the default library. */
function isGlobal(
  services: ParserServicesWithTypeInformation,
  callee: TSESTree.Identifier,
): boolean {
  const declarations =
    services.program
      .getTypeChecker()
      .getSymbolAtLocation(services.esTreeNodeToTSNodeMap.get(callee))
      ?.declarations ?? [];
  return (
    declarations.length > 0 &&
    declarations.every((declaration) =>
      services.program.isSourceFileDefaultLibrary(declaration.getSourceFile()),
    )
  );
}

/** The Wrapper class of a collection type's key (its first type argument). */
function keyWrapperOf(
  checker: ts.TypeChecker,
  type: ts.Type | undefined,
): string | undefined {
  const collection = type && checker.getNonNullableType(type);
  if (collection === undefined || !(collection.flags & ts.TypeFlags.Object)) {
    return undefined;
  }
  const objectType = collection as ts.ObjectType;
  if (!(objectType.objectFlags & ts.ObjectFlags.Reference)) {
    return undefined;
  }
  const key = checker.getTypeArguments(objectType as ts.TypeReference).at(0);
  return key === undefined ? undefined : wrapperClassOf(checker, key);
}

/**
 * The global `Map`/`Set` a `new` constructs and the Wrapper class keying it,
 * or undefined. The key comes from the expression's own type, else from the
 * type it is assigned to (`new Map()` without arguments is a
 * `Map<any, any>`, so `const m: Map<Unit, number> = new Map()` needs the
 * annotation). Asks the checker: pre-match with `mayBeCollection`.
 */
export function wrapperKeyedCollection(
  services: ParserServicesWithTypeInformation,
  node: TSESTree.NewExpression,
): WrapperKeyedCollection | undefined {
  const { callee } = node;
  if (
    callee.type !== AST_NODE_TYPES.Identifier ||
    !collectionNames.has(callee.name) ||
    !isGlobal(services, callee)
  ) {
    return undefined;
  }
  const checker = services.program.getTypeChecker();
  const expression = services.esTreeNodeToTSNodeMap.get(node);
  const wrapper =
    keyWrapperOf(checker, checker.getTypeAtLocation(expression)) ??
    keyWrapperOf(checker, checker.getContextualType(expression));
  return wrapper === undefined
    ? undefined
    : {
        callee: callee as WrapperKeyedCollection["callee"],
        wrapper,
      };
}
