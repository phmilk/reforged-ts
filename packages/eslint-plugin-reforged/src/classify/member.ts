// Member names in the forms the data files and the messages use:
// `Class#member` for an instance member, `Class.member` for a static one.
import * as ts from "typescript";

/**
 * The name of a member declared in a named class or interface:
 * `Class#member` (instance) or `Class.member` (static). Undefined when the
 * declaration's parent is not a named class or interface. `member` is the
 * name as the code reads it.
 */
export function memberName(
  declaration: ts.Declaration,
  member: string,
): string | undefined {
  const owner = declaration.parent;
  if (
    !(ts.isClassDeclaration(owner) || ts.isInterfaceDeclaration(owner)) ||
    owner.name === undefined
  ) {
    return undefined;
  }
  const isStatic =
    ts.getCombinedModifierFlags(declaration) & ts.ModifierFlags.Static;
  return `${owner.name.text}${isStatic ? "." : "#"}${member}`;
}
