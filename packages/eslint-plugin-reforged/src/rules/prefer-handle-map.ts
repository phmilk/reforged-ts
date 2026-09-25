// Rule 11 of #16's table (pitfall L2): a `Map` or `Set` keyed by a Wrapper.
// The entry holds the object, so it outlives the destroyed unit or effect and
// the table grows for the rest of the game. `HandleMap`/`HandleSet` (the
// runtime Guards of reforged-ts) drop the entry with the object. Matches
// `new Map`/`new Set` syntactically, then asks the checker for the global
// constructor and the key type (explicit or inferred).
import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";
import * as ts from "typescript";

import { wrapperClassOf } from "../classify/wrapper.js";
import { createRule } from "../create-rule.js";
import { defineRuleEntry } from "../rule-entry.js";

export const name = "prefer-handle-map";

type MessageIds = "preferHandleMap" | "useHandleMap";

const replacements: ReadonlyMap<string, string> = new Map([
  ["Map", "HandleMap"],
  ["Set", "HandleSet"],
]);

const rule = createRule<[], MessageIds>({
  name,
  meta: {
    type: "problem",
    docs: {
      description:
        "Prefer HandleMap/HandleSet to a Map or Set keyed by a Wrapper",
    },
    hasSuggestions: true,
    messages: {
      preferHandleMap:
        "A {{collection}} keyed by {{wrapper}} keeps its entry after the {{wrapper}} is destroyed, so the table grows for the rest of the game. Use {{replacement}} from reforged-ts (add the import).",
      useHandleMap:
        "Change the constructor to {{replacement}} (then import it from reforged-ts).",
    },
    schema: [],
    defaultOptions: [],
  },
  create(context) {
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();

    /** Whether the constructor is the global `Map`/`Set` of the default library. */
    function isGlobalCollection(callee: TSESTree.Identifier): boolean {
      const declarations =
        checker.getSymbolAtLocation(services.esTreeNodeToTSNodeMap.get(callee))
          ?.declarations ?? [];
      return (
        declarations.length > 0 &&
        declarations.every((declaration) =>
          services.program.isSourceFileDefaultLibrary(
            declaration.getSourceFile(),
          ),
        )
      );
    }

    /** The Wrapper class of a collection type's key (its first type argument). */
    function keyWrapperOf(type: ts.Type | undefined): string | undefined {
      const collection = type && checker.getNonNullableType(type);
      if (
        collection === undefined ||
        !(collection.flags & ts.TypeFlags.Object)
      ) {
        return undefined;
      }
      const objectType = collection as ts.ObjectType;
      if (!(objectType.objectFlags & ts.ObjectFlags.Reference)) {
        return undefined;
      }
      const key = checker
        .getTypeArguments(objectType as ts.TypeReference)
        .at(0);
      return key === undefined ? undefined : wrapperClassOf(checker, key);
    }

    /**
     * The Wrapper class of the collection's key: from its own type, else
     * from the type it is assigned to (`new Map()` without arguments is a
     * `Map<any, any>`, so `const m: Map<Unit, number> = new Map()` needs the
     * annotation).
     */
    function keyWrapper(node: TSESTree.NewExpression): string | undefined {
      const expression = services.esTreeNodeToTSNodeMap.get(node);
      return (
        keyWrapperOf(checker.getTypeAtLocation(expression)) ??
        keyWrapperOf(checker.getContextualType(expression))
      );
    }

    return {
      NewExpression(node) {
        const { callee } = node;
        if (callee.type !== AST_NODE_TYPES.Identifier) {
          return;
        }
        const replacement = replacements.get(callee.name);
        if (replacement === undefined || !isGlobalCollection(callee)) {
          return;
        }
        const wrapper = keyWrapper(node);
        if (wrapper === undefined) {
          return;
        }
        const data = { collection: callee.name, wrapper, replacement };
        context.report({
          node,
          messageId: "preferHandleMap",
          data,
          suggest: [
            {
              messageId: "useHandleMap",
              data,
              fix: (fixer) => fixer.replaceText(callee, replacement),
            },
          ],
        });
      },
    };
  },
});

export default defineRuleEntry({
  name,
  severity: "warn",
  create: () => rule,
});
