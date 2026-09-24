/**
 * Identifier rules that keep a future Patch from breaking generation
 * silently: a parameter named after a TypeScript reserved word is renamed in
 * the declaration, a declaration named after one is an error, and a name
 * declared in two source files is emitted in both with a warning.
 */
import type { Diagnostic } from "./diagnostics.js";
import { CALLBACK_ALIASES } from "./jass-types.js";
import type { Declaration } from "./model.js";

/**
 * Words TypeScript rejects as a binding name in a declaration file: the
 * ECMAScript reserved words, the strict-mode ones, and the names strict mode
 * forbids as bindings.
 */
const RESERVED_WORDS: ReadonlySet<string> = new Set([
  // Reserved words.
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "enum",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "new",
  "null",
  "return",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  // Strict-mode reserved words.
  "implements",
  "interface",
  "let",
  "package",
  "private",
  "protected",
  "public",
  "static",
  "yield",
  "await",
  // Restricted in strict mode.
  "arguments",
  "eval",
]);

/**
 * Names a declared type cannot take: the reserved words, TypeScript's
 * predefined type names, and the names the generated prelude declares.
 */
const RESERVED_TYPE_NAMES: ReadonlySet<string> = new Set([
  ...RESERVED_WORDS,
  "any",
  "unknown",
  "never",
  "number",
  "bigint",
  "boolean",
  "string",
  "symbol",
  "object",
  "undefined",
  "handle",
  ...CALLBACK_ALIASES.map((alias) => alias.name),
]);

/** A reserved parameter name gets a trailing underscore; others are kept. */
export function parameterName(jassName: string): string {
  return RESERVED_WORDS.has(jassName) ? `${jassName}_` : jassName;
}

/**
 * Errors for declarations named after a reserved word, and one warning per
 * name that a later source file declares again. Source order.
 */
export function checkNames(declarations: readonly Declaration[]): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const firstSource = new Map<string, string>();
  const warned = new Set<string>();

  for (const declaration of declarations) {
    const { name, source, line, kind } = declaration;
    const where = `${source}:${line}`;
    const location = { file: source, line, name };

    const reserved = kind === "type" ? RESERVED_TYPE_NAMES : RESERVED_WORDS;
    if (reserved.has(name)) {
      diagnostics.push({
        severity: "error",
        kind: "reserved-name",
        ...location,
        message:
          kind === "type"
            ? `${where}: type "${name}" is a TypeScript reserved word or a name the Typings already declare, and cannot be declared`
            : `${where}: ${kind} "${name}" is a TypeScript reserved word and cannot be declared`,
      });
    }

    const first = firstSource.get(name);
    if (first === undefined) {
      firstSource.set(name, source);
    } else if (first !== source && !warned.has(`${source}/${name}`)) {
      warned.add(`${source}/${name}`);
      const merge =
        kind === "type" ? "merge into one interface" : "merge as overloads";
      diagnostics.push({
        severity: "warning",
        kind: "duplicate-name",
        ...location,
        message: `${where}: ${name} is also declared in ${first}; both are emitted and ${merge}`,
      });
    }
  }
  return diagnostics;
}
