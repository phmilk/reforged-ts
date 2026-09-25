// Rule 11 of #16's table (pitfall L2): a `Map` or `Set` keyed by a Wrapper.
// The entry holds the Wrapper, so it outlives the destroyed unit or effect and
// the table grows for the rest of the game. `HandleMap`/`HandleSet` (the
// runtime Guards of reforged-ts) drop the entry with the Handle. Matches
// `new Map`/`new Set` syntactically, then asks the checker for the global
// constructor and the key type (explicit or inferred).
import { ESLintUtils } from "@typescript-eslint/utils";

import {
  type CollectionName,
  mayBeCollection,
  wrapperKeyedCollection,
} from "../classify/collection.js";
import { createRule } from "../create-rule.js";
import { defineRuleEntry } from "../rule-entry.js";

export const name = "prefer-handle-map";

type MessageIds = "preferHandleMap" | "useHandleMap";

const replacements: Readonly<Record<CollectionName, string>> = {
  Map: "HandleMap",
  Set: "HandleSet",
};

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
    return {
      NewExpression(node) {
        if (!mayBeCollection(node)) {
          return;
        }
        const collection = wrapperKeyedCollection(services, node);
        if (collection === undefined) {
          return;
        }
        const { callee, wrapper } = collection;
        const replacement = replacements[callee.name];
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
