// Rule 5 of #16's table (pitfall C7): since 3.0.0 the game does not read an
// asset whose file name holds a dot before its extension. A syntactic rule:
// a string literal, or a template literal without substitutions, whose last
// path segment ends in an asset extension and holds another dot.
import {
  ESLintUtils,
  type TSESLint,
  type TSESTree,
} from "@typescript-eslint/utils";

import { createRule } from "../create-rule.js";
import { defineRuleEntry } from "../rule-entry.js";

export const name = "no-dotted-asset-paths";

/** The asset extensions of #16's table: models, textures. */
export const defaultExtensions = [".mdx", ".mdl", ".blp", ".dds", ".tga"];

type Options = [{ extensions?: string[] }];
type MessageIds = "dottedAssetPath" | "replaceInnerDots";

/** `mdx`, `.MDX` and `.mdx` are the same extension. */
function normalizeExtension(extension: string): string {
  const lower = extension.toLowerCase();
  return lower.startsWith(".") ? lower : `.${lower}`;
}

/** The text after the last `/` or `\`. */
function lastSegment(path: string): string {
  return path.slice(
    Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\")) + 1,
  );
}

/** The asset extension the segment ends in, when its stem holds a dot. */
function dottedExtension(
  segment: string,
  extensions: readonly string[],
): string | undefined {
  const lower = segment.toLowerCase();
  const extension = extensions.find((each) => lower.endsWith(each));
  if (extension === undefined) {
    return undefined;
  }
  return segment.slice(0, -extension.length).includes(".")
    ? extension
    : undefined;
}

function underscored(segment: string, extension: string): string {
  const stem = segment.slice(0, -extension.length);
  return stem.replaceAll(".", "_") + segment.slice(-extension.length);
}

type PathLiteral = TSESTree.Literal | TSESTree.TemplateLiteral;

/**
 * The replacement source text: the literal as written, with the inner dots of
 * its last segment replaced. Undefined when the segment is not written as is
 * in the source (an escape sequence in it), where a text edit could miss.
 */
function suggestedText(
  raw: string,
  segment: string,
  extension: string,
): string | undefined {
  const body = raw.slice(1, -1);
  const written = lastSegment(body);
  if (written !== segment) {
    return undefined;
  }
  const head = body.slice(0, body.length - written.length);
  return `${raw.slice(0, 1)}${head}${underscored(segment, extension)}${raw.slice(-1)}`;
}

const rule = createRule<Options, MessageIds>({
  name,
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow asset paths whose file name holds a dot before the extension (3.0.0 does not read them)",
    },
    hasSuggestions: true,
    messages: {
      dottedAssetPath:
        "The file name {{segment}} holds a dot before its extension: since 3.0.0 the game does not read such a path, so the asset silently goes missing. Rename the file without inner dots, as {{fixed}}.",
      replaceInnerDots:
        "Replace the inner dots with underscores: {{fixed}} (rename the file itself to match).",
    },
    schema: [
      {
        type: "object",
        properties: {
          extensions: {
            type: "array",
            items: { type: "string", minLength: 1 },
            uniqueItems: true,
            description:
              "The asset extensions checked, replacing the default list (`.mdx`, `.mdl`, `.blp`, `.dds`, `.tga`); case-insensitive, the leading dot optional.",
          },
        },
        additionalProperties: false,
      },
    ],
    defaultOptions: [{ extensions: defaultExtensions }],
  },
  create(context, [{ extensions = defaultExtensions }]) {
    // Asked first, so a configuration without type information fails at the
    // first file, like every rule of the plugin.
    ESLintUtils.getParserServices(context);
    const checked = extensions.map(normalizeExtension);
    const { sourceCode } = context;

    function check(node: PathLiteral, value: string): void {
      const segment = lastSegment(value);
      const extension = dottedExtension(segment, checked);
      if (extension === undefined) {
        return;
      }
      const fixed = underscored(segment, extension);
      const text = suggestedText(sourceCode.getText(node), segment, extension);
      const suggest: TSESLint.SuggestionReportDescriptor<MessageIds>[] =
        text === undefined
          ? []
          : [
              {
                messageId: "replaceInnerDots",
                data: { fixed },
                fix: (fixer) => fixer.replaceText(node, text),
              },
            ];
      context.report({
        node,
        messageId: "dottedAssetPath",
        data: { segment, fixed },
        suggest,
      });
    }

    return {
      Literal(node) {
        if (typeof node.value === "string") {
          check(node, node.value);
        }
      },
      TemplateLiteral(node) {
        // `cooked` is null in a tagged template with an invalid escape.
        const cooked = node.quasis[0]?.value.cooked;
        if (node.expressions.length === 0 && typeof cooked === "string") {
          check(node, cooked);
        }
      },
    };
  },
});

export default defineRuleEntry({
  name,
  severity: "error",
  create: () => rule,
});
