// Rule 10 of #16's table (pitfall C3): a string literal or template with a
// lone `%` that reaches a text sink. The game formats the displayed string
// and unescapes `%%` to `%`, so a lone `%` garbles the message or crashes the
// game. Syntactic match on the `%` first, then the walk of text-sink.ts.
import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import { ESLintUtils } from "@typescript-eslint/utils";

import { createAllowlist } from "../classify/allowlist.js";
import { reachedTextSink } from "../classify/text-sink.js";
import { createRule } from "../create-rule.js";
import type { LocalSafeEntry } from "../data/index.js";
import { defineRuleEntry } from "../rule-entry.js";

export const name = "no-percent-in-display-strings";

type Options = [];
type MessageIds = "percentInDisplayString" | "doublePercent";

/** Whether a string holds a `%` that is not part of an escaped `%%`. */
function hasLonePercent(text: string): boolean {
  return text.replaceAll("%%", "").includes("%");
}

/** Doubles every lone `%` of source text, leaving `%%` as it is. */
function escapePercents(text: string): string {
  return text.replace(/%%|%/g, "%%");
}

export function createNoPercentInDisplayStrings(
  localSafe: readonly LocalSafeEntry[],
) {
  return createRule<Options, MessageIds>({
    name,
    meta: {
      type: "problem",
      docs: {
        description:
          "Disallow a lone % in a string that reaches a text-display Native",
      },
      hasSuggestions: true,
      messages: {
        percentInDisplayString:
          'A lone "%" in a string displayed by {{sink}}: the game reads "%" as a format character, so the message is garbled or the game crashes. Write "%%" for a percent sign.',
        doublePercent: 'Double the "%" ("%%" displays as "%").',
      },
      schema: [],
      defaultOptions: [],
    },
    create(context) {
      // Asked first, so a configuration without type information fails at
      // the first file with typescript-eslint's own error.
      ESLintUtils.getParserServices(context);
      const allowlist = createAllowlist(localSafe);
      const { sourceCode } = context;

      function check(
        node: TSESTree.StringLiteral | TSESTree.TemplateLiteral,
        quasis: readonly TSESTree.Node[],
      ): void {
        const hit = reachedTextSink(context, allowlist, node);
        if (hit === undefined) {
          return;
        }
        context.report({
          node,
          messageId: "percentInDisplayString",
          data: { sink: hit.name },
          suggest: [
            {
              messageId: "doublePercent",
              fix: (fixer) =>
                quasis.map((part) =>
                  fixer.replaceText(
                    part,
                    escapePercents(sourceCode.getText(part)),
                  ),
                ),
            },
          ],
        });
      }

      return {
        Literal(node) {
          if (typeof node.value === "string" && hasLonePercent(node.value)) {
            check(node, [node]);
          }
        },
        TemplateLiteral(node) {
          if (node.parent.type === AST_NODE_TYPES.TaggedTemplateExpression) {
            return;
          }
          const withPercent = node.quasis.filter((quasi) =>
            hasLonePercent(quasi.value.cooked ?? quasi.value.raw),
          );
          if (withPercent.length > 0) {
            check(node, withPercent);
          }
        },
      };
    },
  });
}

export default defineRuleEntry({
  name,
  severity: "warn",
  create: (data) => createNoPercentInDisplayStrings(data.localSafe),
});
