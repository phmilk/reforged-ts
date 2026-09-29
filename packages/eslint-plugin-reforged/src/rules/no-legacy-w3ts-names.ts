// Rule 6 of #16's table: a w3ts 3.x name the linted project still uses, read
// from the rename map reforged-ts publishes (migration/renames.json, the
// library's schema is the contract). It reports an import from the old
// package, an import specifier of a renamed or removed export, a member or
// static access on a library class, and a `new` of a library class. Members
// and constructors are matched through the checker: the object must be the
// library class (or an instance, or a subclass), never a project class of the
// same name. One-to-one entries are fixed; the others are suggested, one
// suggestion per replacement; a removed symbol gets neither. Entries of kind
// `entryPoint` (the `W3TS_HOOK` values) are not code the rule can find.
//
// A member entry whose new name is its old one keeps its name and changes
// its signature or behaviour (#311). The name is no signal, so a call of it
// is reported only where the checker shows the w3ts shape: an argument the
// new parameter does not take (a raw handle where the Wrapper is taken), or
// a result used as the old one was, passed where the new type is not taken
// or checked for a missing value when the new type cannot be missing. Code
// on the new signature compiles, so it is never reported; an entry with no
// such use (a parameter made optional, a setter that now returns its
// Wrapper) reports nothing.
import {
  AST_NODE_TYPES,
  ASTUtils,
  ESLintUtils,
  type TSESLint,
  type TSESTree,
} from "@typescript-eslint/utils";

import * as ts from "typescript";

import { libraryClassesOf, libraryClassOf } from "../classify/library-class.js";
import { through, walkValueFlow } from "../classify/value-flow.js";
import { createRule } from "../create-rule.js";
import type { RenameEntry, RenameName } from "../data/index.js";
import { defineRuleEntry } from "../rule-entry.js";

export const name = "no-legacy-w3ts-names";

type MessageIds =
  | "renamed"
  | "removed"
  | "useReplacement"
  | "oldArgument"
  | "oldResult"
  | "checkedResult";

type Edit = (
  fixer: TSESLint.RuleFixer,
) => TSESLint.RuleFix | TSESLint.RuleFix[];

/** The map, indexed by what the rule matches syntactically. */
interface Index {
  /** Package entries by old package name. */
  readonly packages: ReadonlyMap<string, RenameEntry>;
  /** The package names whose declarations and imports are the library's. */
  readonly libraryPackages: ReadonlySet<string>;
  /** The package a missing import is added from. */
  readonly newPackage: string;
  /** Function, class and type entries by exported name. */
  readonly exports: ReadonlyMap<string, RenameEntry>;
  /** Constructor entries by class name. */
  readonly constructors: ReadonlyMap<string, RenameEntry>;
  /** Member and accessor entries by member name. */
  readonly members: ReadonlyMap<string, readonly MemberEntry[]>;
  /** Member entries that keep their name, by member name. */
  readonly kept: ReadonlyMap<string, readonly MemberEntry[]>;
}

interface MemberEntry {
  readonly className: string;
  readonly entry: RenameEntry;
}

function add(
  map: Map<string, MemberEntry[]>,
  member: string,
  each: MemberEntry,
): void {
  map.set(member, [...(map.get(member) ?? []), each]);
}

function indexOf(entries: readonly RenameEntry[]): Index {
  const packages = new Map<string, RenameEntry>();
  const exports = new Map<string, RenameEntry>();
  const constructors = new Map<string, RenameEntry>();
  const members = new Map<string, MemberEntry[]>();
  const kept = new Map<string, MemberEntry[]>();
  for (const entry of entries) {
    if (entry.kind === "package") {
      packages.set(entry.old.text, entry);
      continue;
    }
    // An entry point is not code.
    const { symbol } = entry.old;
    if (entry.kind === "entryPoint" || symbol === undefined) {
      continue;
    }
    // An entry that keeps its name (`GameCache.restoreUnit`) is found by the
    // shape of its use, not by its name.
    if (entry.replacements.some((each) => each.text === entry.old.text)) {
      if (symbol.member !== undefined) {
        add(kept, symbol.member, { className: symbol.className, entry });
      }
      continue;
    }
    if (entry.kind === "constructor") {
      constructors.set(symbol.className, entry);
    } else if (symbol.member === undefined) {
      exports.set(symbol.className, entry);
    } else {
      add(members, symbol.member, { className: symbol.className, entry });
    }
  }
  const renamed = [...packages.values()];
  const newPackage =
    renamed.flatMap((entry) => entry.replacements)[0]?.text ?? "reforged-ts";
  return {
    packages,
    libraryPackages: new Set([
      newPackage,
      ...renamed.flatMap((entry) =>
        [entry.old, ...entry.replacements].map((each) => each.text),
      ),
    ]),
    newPackage,
    exports,
    constructors,
    members,
    kept,
  };
}

/** Whether `type` holds undefined, null or void, or is not checked at all. */
function mayBeMissing(type: ts.Type): boolean {
  const loose =
    ts.TypeFlags.Undefined |
    ts.TypeFlags.Null |
    ts.TypeFlags.Void |
    ts.TypeFlags.Any |
    ts.TypeFlags.Unknown;
  return (type.isUnion() ? type.types : [type]).some(
    (each) => (each.flags & loose) !== 0,
  );
}

function isMissingLiteral(node: TSESTree.Node): boolean {
  return (
    (node.type === AST_NODE_TYPES.Identifier && node.name === "undefined") ||
    (node.type === AST_NODE_TYPES.Literal && node.value === null)
  );
}

/** Whether `parent` checks its child `child` for a missing value. */
function checksForMissing(
  parent: TSESTree.Node,
  child: TSESTree.Node,
): boolean {
  switch (parent.type) {
    case AST_NODE_TYPES.BinaryExpression:
      return (
        ["==", "!=", "===", "!=="].includes(parent.operator) &&
        isMissingLiteral(parent.left === child ? parent.right : parent.left)
      );
    case AST_NODE_TYPES.UnaryExpression:
      return parent.operator === "!";
    case AST_NODE_TYPES.LogicalExpression:
      return parent.left === child;
    case AST_NODE_TYPES.IfStatement:
    case AST_NODE_TYPES.WhileStatement:
    case AST_NODE_TYPES.DoWhileStatement:
    case AST_NODE_TYPES.ForStatement:
    case AST_NODE_TYPES.ConditionalExpression:
      return parent.test === child;
    case AST_NODE_TYPES.MemberExpression:
      return parent.optional && parent.object === child;
    case AST_NODE_TYPES.CallExpression:
      return parent.optional && parent.callee === child;
    default:
      return false;
  }
}

export function createNoLegacyW3tsNames(renames: readonly RenameEntry[]) {
  const index = indexOf(renames);
  return createRule<[], MessageIds>({
    name,
    meta: {
      type: "problem",
      docs: {
        description:
          "Disallow the w3ts 3.x names that reforged-ts renamed or removed (the library's rename map)",
      },
      fixable: "code",
      hasSuggestions: true,
      messages: {
        renamed:
          "`{{old}}` is from {{from}} and is gone in {{to}}, so the map no longer compiles against it: use {{replacement}}. {{note}}",
        removed:
          "`{{old}}` is from {{from}} and has no replacement in {{to}}, so the map no longer compiles against it. {{note}}",
        useReplacement: "Use `{{replacement}}`.",
        oldArgument:
          "`{{old}}` keeps its name in {{to}} but not its {{from}} parameters: this argument does not fit the new one, so the map no longer compiles. {{note}}",
        oldResult:
          "`{{old}}` keeps its name in {{to}} but not its {{from}} result: it is used here where the new one does not fit, so the map no longer compiles. {{note}}",
        checkedResult:
          "`{{old}}` keeps its name in {{to}} but not its {{from}} result: the new one is never missing, so this check never catches a failure. {{note}}",
      },
      schema: [],
      defaultOptions: [],
    },
    create(context) {
      // Asked first, so a configuration without type information fails at
      // the first file with typescript-eslint's own error.
      const services = ESLintUtils.getParserServices(context);
      const { sourceCode } = context;

      function report(
        node: TSESTree.Node,
        entry: RenameEntry,
        edit: (replacement: RenameName) => Edit | undefined,
      ): void {
        const data = {
          old: entry.old.text,
          from: entry.versions.from,
          to: entry.versions.to,
          note: entry.note,
          replacement: entry.replacements
            .map((each) => `\`${each.text}\``)
            .join(" or "),
        };
        if (entry.replacements.length === 0) {
          context.report({ node, messageId: "removed", data });
          return;
        }
        const edits = entry.replacements.map((replacement) => ({
          replacement,
          fix: edit(replacement),
        }));
        const [first] = edits;
        if (entry.oneToOne && first.fix !== undefined) {
          context.report({ node, messageId: "renamed", data, fix: first.fix });
          return;
        }
        context.report({
          node,
          messageId: "renamed",
          data,
          suggest: edits.flatMap(({ replacement, fix }) =>
            fix === undefined
              ? []
              : [
                  {
                    messageId: "useReplacement" as const,
                    data: { replacement: replacement.text },
                    fix,
                  },
                ],
          ),
        });
      }

      /** Adds `className` to the imports when the file does not see it. */
      function importFixes(
        fixer: TSESLint.RuleFixer,
        at: TSESTree.Node,
        className: string,
      ): TSESLint.RuleFix[] {
        if (ASTUtils.findVariable(sourceCode.getScope(at), className)) {
          return [];
        }
        const imports = sourceCode.ast.body.filter(
          (statement): statement is TSESTree.ImportDeclaration =>
            statement.type === AST_NODE_TYPES.ImportDeclaration,
        );
        const named = imports
          .filter(
            (each) =>
              each.importKind === "value" &&
              index.libraryPackages.has(each.source.value),
          )
          .flatMap((each) =>
            each.specifiers.filter(
              (specifier) => specifier.type === AST_NODE_TYPES.ImportSpecifier,
            ),
          );
        const lastNamed = named.at(-1);
        if (lastNamed !== undefined) {
          return [fixer.insertTextAfter(lastNamed, `, ${className}`)];
        }
        const statement = `import { ${className} } from "${index.newPackage}";`;
        const lastImport = imports.at(-1);
        return [
          lastImport === undefined
            ? fixer.insertTextBefore(sourceCode.ast.body[0], `${statement}\n`)
            : fixer.insertTextAfter(lastImport, `\n${statement}`),
        ];
      }

      const checker = services.program.getTypeChecker();

      /** Whether `node` does not fit the type the checker expects where it stands. */
      function misfits(node: TSESTree.Node): boolean {
        const tsNode = services.esTreeNodeToTSNodeMap.get(node);
        if (!ts.isExpression(tsNode)) {
          return false;
        }
        const expected = checker.getContextualType(tsNode);
        return (
          expected !== undefined &&
          !checker.isTypeAssignableTo(
            checker.getTypeAtLocation(tsNode),
            expected,
          )
        );
      }

      /**
       * A call of a member that kept its name (see the file comment): its
       * arguments first, then where its result goes.
       */
      function checkKept(node: TSESTree.CallExpression): void {
        const { callee } = node;
        if (
          callee.type !== AST_NODE_TYPES.MemberExpression ||
          callee.computed ||
          callee.property.type !== AST_NODE_TYPES.Identifier
        ) {
          return;
        }
        const candidates = index.kept.get(callee.property.name);
        if (candidates === undefined) {
          return;
        }
        const chain = libraryClassesOf(
          services,
          callee.object,
          index.libraryPackages,
        );
        const found = candidates.find(({ className }) =>
          chain.includes(className),
        );
        if (found === undefined) {
          return;
        }
        const { entry } = found;
        const data = {
          old: entry.old.text,
          from: entry.versions.from,
          to: entry.versions.to,
          note: entry.note,
        };
        const argument = node.arguments.find(
          (each) => each.type !== AST_NODE_TYPES.SpreadElement && misfits(each),
        );
        if (argument !== undefined) {
          context.report({ node: argument, messageId: "oldArgument", data });
          return;
        }
        const missable = mayBeMissing(services.getTypeAtLocation(node));
        const use = walkValueFlow<{
          node: TSESTree.Node;
          messageId: "oldResult" | "checkedResult";
        }>(
          {
            context,
            services,
            step(parent, child) {
              if (
                parent.type === AST_NODE_TYPES.TSNonNullExpression ||
                parent.type === AST_NODE_TYPES.TSAsExpression ||
                parent.type === AST_NODE_TYPES.TSSatisfiesExpression
              ) {
                return through;
              }
              if (!missable && checksForMissing(parent, child)) {
                return { node: parent, messageId: "checkedResult" };
              }
              return misfits(child)
                ? { node: child, messageId: "oldResult" }
                : undefined;
            },
          },
          node,
        );
        if (use !== undefined) {
          context.report({ node: use.node, messageId: use.messageId, data });
        }
      }

      function checkSource(node: TSESTree.Node | null | undefined): void {
        if (node?.type !== AST_NODE_TYPES.Literal) {
          return;
        }
        const entry =
          typeof node.value === "string"
            ? index.packages.get(node.value)
            : undefined;
        if (entry === undefined) {
          return;
        }
        const quote = node.raw[0];
        report(
          node,
          entry,
          (replacement) => (fixer) =>
            fixer.replaceText(node, `${quote}${replacement.text}${quote}`),
        );
      }

      function checkSpecifier(specifier: TSESTree.ImportSpecifier): void {
        const imported =
          specifier.imported.type === AST_NODE_TYPES.Identifier
            ? specifier.imported.name
            : specifier.imported.value;
        const entry = index.exports.get(imported);
        if (entry === undefined) {
          return;
        }
        const aliased =
          specifier.local.range[0] !== specifier.imported.range[0];
        report(specifier, entry, (replacement) => {
          const { symbol } = replacement;
          if (symbol === undefined || symbol.member !== undefined) {
            return undefined;
          }
          // The local name stays, so the file's references still resolve.
          return (fixer) =>
            aliased
              ? fixer.replaceText(specifier.imported, symbol.className)
              : fixer.replaceText(
                  specifier,
                  `${symbol.className} as ${specifier.local.name}`,
                );
        });
      }

      return {
        CallExpression: checkKept,
        ImportDeclaration(node) {
          checkSource(node.source);
          if (!index.libraryPackages.has(node.source.value)) {
            return;
          }
          for (const specifier of node.specifiers) {
            if (specifier.type === AST_NODE_TYPES.ImportSpecifier) {
              checkSpecifier(specifier);
            }
          }
        },
        ExportNamedDeclaration(node) {
          checkSource(node.source);
        },
        ExportAllDeclaration(node) {
          checkSource(node.source);
        },
        ImportExpression(node) {
          checkSource(node.source);
        },
        NewExpression(node) {
          if (index.constructors.size === 0) {
            return;
          }
          const className = libraryClassOf(
            services,
            node.callee,
            index.libraryPackages,
          );
          const entry =
            className === undefined
              ? undefined
              : index.constructors.get(className);
          if (className === undefined || entry === undefined) {
            return;
          }
          const hasParentheses =
            node.arguments.length > 0 ||
            sourceCode.getLastToken(node)?.value === ")";
          report(node, entry, (replacement) => {
            const { symbol } = replacement;
            if (symbol === undefined) {
              return undefined;
            }
            const sameClass = symbol.className === className;
            const receiver = sameClass
              ? sourceCode.getText(node.callee)
              : symbol.className;
            return (fixer) => [
              ...(sameClass ? [] : importFixes(fixer, node, symbol.className)),
              ...(symbol.member === undefined
                ? [fixer.replaceText(node.callee, receiver)]
                : [
                    fixer.replaceTextRange(
                      [node.range[0], node.callee.range[1]],
                      `${receiver}.${symbol.member}`,
                    ),
                    ...(hasParentheses
                      ? []
                      : [fixer.insertTextAfter(node, "()")]),
                  ]),
            ];
          });
        },
        MemberExpression(node) {
          if (
            node.computed ||
            node.property.type !== AST_NODE_TYPES.Identifier
          ) {
            return;
          }
          const candidates = index.members.get(node.property.name);
          if (candidates === undefined) {
            return;
          }
          const chain = libraryClassesOf(
            services,
            node.object,
            index.libraryPackages,
          );
          const found = candidates.find(({ className }) =>
            chain.includes(className),
          );
          if (found === undefined) {
            return;
          }
          const { property } = node;
          const { parent } = node;
          const assigned =
            parent.type === AST_NODE_TYPES.AssignmentExpression &&
            parent.left === node;
          const plainAssignment = assigned && parent.operator === "=";
          const written =
            assigned ||
            (parent.type === AST_NODE_TYPES.UpdateExpression &&
              parent.argument === node);
          report(property, found.entry, (replacement) => {
            const { symbol } = replacement;
            const member = symbol?.member;
            if (symbol === undefined || member === undefined) {
              return undefined;
            }
            if (found.entry.kind === "accessor") {
              // A get/set pair: the getter replaces a read, the setter a
              // plain assignment; each is a call.
              if (/^get[A-Z]/.test(member) && !written) {
                return (fixer) => fixer.replaceText(property, `${member}()`);
              }
              if (/^set[A-Z]/.test(member) && plainAssignment) {
                return (fixer) =>
                  fixer.replaceText(
                    parent,
                    `${sourceCode.getText(node.object)}.${member}(${sourceCode.getText(parent.right)})`,
                  );
              }
              if (/^[gs]et[A-Z]/.test(member)) {
                return undefined;
              }
            }
            if (chain.includes(symbol.className)) {
              return (fixer) => fixer.replaceText(property, member);
            }
            // The receiver changes (`group.getEnumUnit` is `Unit.fromEnum`):
            // the whole callee is replaced and the class imported.
            return (fixer) => [
              ...importFixes(fixer, node, symbol.className),
              fixer.replaceText(node, `${symbol.className}.${member}`),
            ];
          });
        },
      };
    },
  });
}

export default defineRuleEntry({
  name,
  severity: "error",
  requires: ["reforged-ts"],
  create: (data) => createNoLegacyW3tsNames(data.renames),
});
