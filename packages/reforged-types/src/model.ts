/**
 * The declaration model the parser builds from a Patch file: source order,
 * source file and Jass types kept verbatim.
 */

/** The Patch files the generator reads, in output order. */
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

export type Declaration = TypeDeclaration | FunctionDeclaration;

/** The Jass header of a function, as the failure checklist prints it. */
export function jassSignature(fn: FunctionDeclaration): string {
  const takes =
    fn.params.length === 0
      ? "nothing"
      : fn.params.map((p) => `${p.type} ${p.name}`).join(", ");
  const keyword = fn.constant ? `constant ${fn.kind}` : fn.kind;
  return `${keyword} ${fn.name} takes ${takes} returns ${fn.returns}`;
}
