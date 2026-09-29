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
// a result used as the old one was: passed, or assigned to an annotated
// variable, where the new type is not taken, or checked for a missing value
// when its type where it is checked cannot be missing. A check is explicit
// (`=== undefined`, `== null`, `typeof x === "undefined"`, `??`, `?.`) or,
// for an object only, a truthiness test (`!x`, `x && y`, `x || y`, a
// condition): a number or a string is also falsy at 0 or "". Code on the new
// signature compiles, so it is never reported; an entry with no such use (a
// parameter made optional, a setter that now returns its Wrapper) reports
// nothing.
import {
  AST_NODE_TYPES,
  ASTUtils,
  ESLintUtils,
  type TSESLint,
  type TSESTree,
} from "@typescript-eslint/utils";

import { libraryClassesOf, libraryClassOf } from "../classify/library-class.js";
import {
  isObjectTyped,
  mayBeMissing,
  misfitsContext,
} from "../classify/result-type.js";
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

/** Where the result of a member that kept its name shows the w3ts use. */
interface KeptUse {
  readonly node: TSESTree.Node;
  readonly messageId: "oldResult" | "checkedResult";
}

/** The message data every report of `entry` carries. */
function dataOf(entry: RenameEntry) {
  return {
    old: entry.old.text,
    from: entry.versions.from,
    to: entry.versions.to,
    note: entry.note,
  };
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

function isMissingLiteral(node: TSESTree.Node): boolean {
  return (
    (node.type === AST_NODE_TYPES.Identifier && node.name === "undefined") ||
    (node.type === AST_NODE_TYPES.Literal && node.value === null)
  );
}

const equalities: ReadonlySet<string> = new Set(["==", "!=", "===", "!=="]);

/** The other operand of an equality `node` is an operand of, or undefined. */
function comparedWith(node: TSESTree.Node): TSESTree.Node | undefined {
  const { parent } = node;
  if (
    parent?.type !== AST_NODE_TYPES.BinaryExpression ||
    !equalities.has(parent.operator)
  ) {
    return undefined;
  }
  return parent.left === node ? parent.right : parent.left;
}

/**
 * How `parent` checks its child `child` for a missing value: `explicit`
 * (`=== undefined`, `== null`, `typeof x === "undefined"`, `??`, `?.`), a
 * truthiness test (`!x`, `x && y`, `x || y`, a condition), which is a
 * missing-value check only for an object, or not at all.
 */
function missingCheckOf(
  parent: TSESTree.Node,
  child: TSESTree.Node,
): "explicit" | "truthiness" | undefined {
  switch (parent.type) {
    case AST_NODE_TYPES.BinaryExpression: {
      const other = comparedWith(child);
      return other !== undefined && isMissingLiteral(other)
        ? "explicit"
        : undefined;
    }
    case AST_NODE_TYPES.UnaryExpression: {
      if (parent.operator === "!") {
        return "truthiness";
      }
      const other =
        parent.operator === "typeof" ? comparedWith(parent) : undefined;
      return other?.type === AST_NODE_TYPES.Literal &&
        other.value === "undefined"
        ? "explicit"
        : undefined;
    }
    case AST_NODE_TYPES.LogicalExpression:
      if (parent.left !== child) {
        return undefined;
      }
      return parent.operator === "??" ? "explicit" : "truthiness";
    case AST_NODE_TYPES.IfStatement:
    case AST_NODE_TYPES.WhileStatement:
    case AST_NODE_TYPES.DoWhileStatement:
    case AST_NODE_TYPES.ForStatement:
    case AST_NODE_TYPES.ConditionalExpression:
      return parent.test === child ? "truthiness" : undefined;
    case AST_NODE_TYPES.MemberExpression:
      return parent.optional && parent.object === child
        ? "explicit"
        : undefined;
    case AST_NODE_TYPES.CallExpression:
      return parent.optional && parent.callee === child
        ? "explicit"
        : undefined;
    default:
      return undefined;
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
          ...dataOf(entry),
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

      /**
       * The entry of `candidates` for the library class (or a class it
       * extends) that `object` stands for, with that class chain.
       */
      function findEntry(
        candidates: readonly MemberEntry[] | undefined,
        object: TSESTree.Node,
      ): { entry: RenameEntry; chain: readonly string[] } | undefined {
        if (candidates === undefined) {
          return undefined;
        }
        const chain = libraryClassesOf(services, object, index.libraryPackages);
        const found = candidates.find(({ className }) =>
          chain.includes(className),
        );
        return found === undefined ? undefined : { entry: found.entry, chain };
      }

      const misfits = (node: TSESTree.Node) => misfitsContext(services, node);

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
        const found = findEntry(
          index.kept.get(callee.property.name),
          callee.object,
        );
        if (found === undefined) {
          return;
        }
        const data = dataOf(found.entry);
        const argument = node.arguments.find(
          (each) => each.type !== AST_NODE_TYPES.SpreadElement && misfits(each),
        );
        if (argument !== undefined) {
          context.report({ node: argument, messageId: "oldArgument", data });
          return;
        }
        const use = walkValueFlow<KeptUse>(
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
              // The type where the value is checked: a cast to a type that
              // can be missing makes the check deliberate.
              const check = missingCheckOf(parent, child);
              if (
                (check === "explicit" ||
                  (check === "truthiness" && isObjectTyped(services, child))) &&
                !mayBeMissing(services, child)
              ) {
                return { node: child, messageId: "checkedResult" };
              }
              return misfits(child)
                ? { node: child, messageId: "oldResult" }
                : undefined;
            },
            declared(declarator) {
              // `const u: unit = cache.restoreUnit(...)`: the annotation is
              // the old type.
              return declarator.id.typeAnnotation !== undefined &&
                declarator.init !== null &&
                misfits(declarator.init)
                ? { node: declarator.init, messageId: "oldResult" }
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
          const found = findEntry(
            index.members.get(node.property.name),
            node.object,
          );
          if (found === undefined) {
            return;
          }
          const { chain } = found;
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
