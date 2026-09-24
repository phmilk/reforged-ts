/**
 * The declaration model the parser builds from a Patch file: source order,
 * source file and Jass types kept verbatim.
 */

/**
 * The Patch files under their lowercase names, in output order: what the
 * vendor step stores per Patch and what the generator reads.
 */
export const SOURCES = ["common.j", "blizzard.j", "common.ai"] as const;

export type SourceName = (typeof SOURCES)[number];

/** Where a declaration comes from: its Patch file and 1-based line. */
export interface Located {
  source: SourceName;
  line: number;
}

/** `type X extends Y`. */
export interface TypeDeclaration extends Located {
  kind: "type";
  name: string;
  parent: string;
}

export interface Parameter {
  /** Jass type, verbatim. */
  type: string;
  name: string;
}

/** A `native`, `constant native` or `function` header. */
export interface FunctionDeclaration extends Located {
  kind: "native" | "function";
  constant: boolean;
  name: string;
  params: Parameter[];
  /** Jass return type, verbatim (`nothing` for none). */
  returns: string;
}

/**
 * A declaration of the `globals` block, in one of its four forms:
 * `constant <type> NAME = <expr>`, `<type> NAME = <expr>`, `<type> NAME`
 * and `<type> array NAME`.
 */
export interface GlobalDeclaration extends Located {
  kind: "global";
  constant: boolean;
  array: boolean;
  /** Jass type, verbatim (the element type of an array). */
  type: string;
  name: string;
  /** Initializer text, verbatim; for the header only, never a literal type. */
  initializer?: string;
}

export type Declaration =
  | TypeDeclaration
  | FunctionDeclaration
  | GlobalDeclaration;

/**
 * The words of a global's Jass form before its name: `constant`, the type
 * and `array`, each where it applies. `type` stands in for the Jass type
 * where a header renders it differently.
 */
export function jassGlobalForm(
  global: GlobalDeclaration,
  type: string = global.type
): string {
  const words = [
    ...(global.constant ? ["constant"] : []),
    type,
    ...(global.array ? ["array"] : []),
  ];
  return words.join(" ");
}

/** The Jass line of a global without its trailing comment. */
export function jassGlobal(global: GlobalDeclaration): string {
  const words = [
    jassGlobalForm(global),
    global.name,
    ...(global.initializer === undefined ? [] : ["=", global.initializer]),
  ];
  return words.join(" ");
}

/**
 * A declaration as the checklists print it: `type unit extends widget`,
 * `global constant integer X = 1`, `native A takes nothing returns nothing`.
 */
export function jassDeclaration(declaration: Declaration): string {
  switch (declaration.kind) {
    case "type":
      return `type ${declaration.name} extends ${declaration.parent}`;
    case "global":
      return `global ${jassGlobal(declaration)}`;
    default:
      return jassSignature(declaration);
  }
}

/** The Jass header of a function, as the failure checklist prints it. */
export function jassSignature(fn: FunctionDeclaration): string {
  const takes =
    fn.params.length === 0
      ? "nothing"
      : fn.params.map((p) => `${p.type} ${p.name}`).join(", ");
  const keyword = fn.constant ? `constant ${fn.kind}` : fn.kind;
  return `${keyword} ${fn.name} takes ${takes} returns ${fn.returns}`;
}
