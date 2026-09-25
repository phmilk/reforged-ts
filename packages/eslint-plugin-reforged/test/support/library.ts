// The reforged-ts library as the workspace has it: every callable member of
// its classes, by allowlist name (`Class#member` for an instance method or
// accessor with a setter, `Class.member` for a static one). Read from the
// library's sources (syntax only), for the consistency test of
// data/local-safe.json.
import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import * as ts from "typescript";

let members: ReadonlySet<string> | undefined;

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return sourceFiles(file);
    }
    return entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")
      ? [file]
      : [];
  });
}

/** Every method and setter of the library's classes, by allowlist name (read once). */
export function libraryMembers(): ReadonlySet<string> {
  if (members === undefined) {
    const root = path.dirname(
      createRequire(import.meta.url).resolve("reforged-ts/package.json"),
    );
    const found = new Set<string>();
    for (const file of sourceFiles(path.join(root, "src"))) {
      const source = ts.createSourceFile(
        file,
        readFileSync(file, "utf8"),
        ts.ScriptTarget.Latest,
        true,
      );
      for (const statement of source.statements) {
        if (!ts.isClassDeclaration(statement) || statement.name === undefined) {
          continue;
        }
        for (const member of statement.members) {
          if (
            !(
              ts.isMethodDeclaration(member) ||
              ts.isSetAccessorDeclaration(member)
            ) ||
            !ts.isIdentifier(member.name)
          ) {
            continue;
          }
          const isStatic =
            ts.getCombinedModifierFlags(member) & ts.ModifierFlags.Static;
          found.add(
            `${statement.name.text}${isStatic ? "." : "#"}${member.name.text}`,
          );
        }
      }
    }
    members = found;
  }
  return members;
}
