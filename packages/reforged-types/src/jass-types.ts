/**
 * How a Jass type reads in the generated file: its TypeScript type in the
 * signature, and its Jass name in the header.
 */

/** The alias `code` parameters use; declared in the common.j output. */
export const CODE_ALIAS = "code";

/**
 * The alias for a callback that returns a boolean, declared next to `code`.
 * No Jass type maps to it: a parameter reaches it only through its Overlay
 * `type` override (`Condition`, `Filter`).
 */
export const BOOLEAN_CODE_ALIAS = "boolcode";

/** The callback aliases the common.j output declares, in order. */
export const CALLBACK_ALIASES: readonly { name: string; type: string }[] = [
  { name: CODE_ALIAS, type: "(this: void) => void" },
  { name: BOOLEAN_CODE_ALIAS, type: "(this: void) => boolean" },
];

const PRIMITIVES: Record<string, string> = {
  integer: "number",
  real: "number",
  boolean: "boolean",
  string: "string",
  nothing: "void",
  code: CODE_ALIAS,
};

/** `handle` and every declared type keep their name. */
export function tsType(jassType: string): string {
  return PRIMITIVES[jassType] ?? jassType;
}

/** The Jass type as the header shows it; integers carry their width (#9). */
export function docType(jassType: string): string {
  return jassType === "integer" ? "integer (32-bit)" : jassType;
}
