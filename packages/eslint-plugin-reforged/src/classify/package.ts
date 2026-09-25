// Which package a declaration comes from. Classification by package is what
// separates a Native (declared in reforged-types) or a Wrapper (reforged-ts)
// from a project symbol of the same name. The package is the `name` of the
// nearest package.json above the declaring file, so the answer is the same
// in a Map project's node_modules, in pnpm's store and in this workspace,
// where the checker sees symlinked packages by their real path.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import type * as ts from "typescript";

/** The packages whose declarations the rules classify by. */
export type ReforgedPackage = "reforged-types" | "reforged-ts";

const packageOfDirectory = new Map<string, string | undefined>();

function readPackageName(directory: string): string | undefined {
  const file = path.join(directory, "package.json");
  if (!existsSync(file)) {
    return undefined;
  }
  try {
    const { name } = JSON.parse(readFileSync(file, "utf8")) as {
      name?: unknown;
    };
    return typeof name === "string" ? name : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The name of the package that owns a file: the `name` of the nearest
 * package.json above it (a package.json without a name is skipped, as Node
 * does for nested type-only manifests). Cached per directory.
 */
export function packageNameOf(fileName: string): string | undefined {
  const visited: string[] = [];
  let directory = path.dirname(path.resolve(fileName));
  let name: string | undefined;
  for (;;) {
    if (packageOfDirectory.has(directory)) {
      name = packageOfDirectory.get(directory);
      break;
    }
    visited.push(directory);
    name = readPackageName(directory);
    const parent = path.dirname(directory);
    if (name !== undefined || parent === directory) {
      break;
    }
    directory = parent;
  }
  for (const each of visited) {
    packageOfDirectory.set(each, name);
  }
  return name;
}

/** Whether a declaration's source file belongs to the given package. */
export function isDeclaredIn(
  declaration: ts.Declaration,
  packageName: ReforgedPackage,
): boolean {
  return packageNameOf(declaration.getSourceFile().fileName) === packageName;
}
