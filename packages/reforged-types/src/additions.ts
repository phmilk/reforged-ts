/**
 * What a newer vendored Patch declares that the one before it does not: the
 * list a maintainer reads to set `since` on the new Overlay entries. Patches
 * come in oldest first, as `compareBuilds` orders them.
 */
import { jassDeclaration, type Declaration, type SourceName } from "./model.js";

/** A declaration of the newer Patch that the older one lacks. */
export interface Added {
  source: SourceName;
  /** 1-based line in the newer Patch's file. */
  line: number;
  name: string;
  /** The declaration as Jass writes it: `native A takes nothing returns nothing`. */
  jass: string;
}

/** The declarations `patch` has and `previous` lacks, in source order. */
export interface Additions {
  patch: string;
  previous: string;
  declarations: Added[];
}

/**
 * For each vendored Patch after the first (`patches` oldest first), the
 * declarations it has and the Patch before it lacks. A declaration is the
 * same in both when its source file, kind (type, function, global) and name
 * match.
 */
export function additions(
  patches: readonly { patch: string; declarations: readonly Declaration[] }[]
): Additions[] {
  const result: Additions[] = [];
  for (let i = 1; i < patches.length; i++) {
    const previous = patches[i - 1]!;
    const current = patches[i]!;
    const known = new Set(previous.declarations.map(identity));
    result.push({
      patch: current.patch,
      previous: previous.patch,
      declarations: current.declarations
        .filter((declaration) => !known.has(identity(declaration)))
        .map((declaration) => ({
          source: declaration.source,
          line: declaration.line,
          name: declaration.name,
          jass: jassDeclaration(declaration),
        })),
    });
  }
  return result;
}

function identity(declaration: Declaration): string {
  const kind = declaration.kind === "native" ? "function" : declaration.kind;
  return `${declaration.source}/${kind}/${declaration.name}`;
}
