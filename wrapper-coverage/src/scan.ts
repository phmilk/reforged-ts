/**
 * The static scan of the library sources with the TypeScript compiler API:
 * which classes exist, what each extends, and which Natives each calls. A
 * call counts when its callee is a bare identifier naming a Native, and it
 * is a call by the innermost named class declaration around it, static-only
 * classes included. Calls outside any class count for none. The sources are
 * parsed, never type-checked.
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import * as ts from "typescript";
import { byCodePoint } from "./order.js";

export interface Scan {
  /** Each class declaration by name, with the name its `extends` clause gives. */
  classes: Map<string, { base: string | undefined }>;
  /** The classes calling each Native, by Native name. */
  calls: Map<string, Set<string>>;
}

/** The `.ts` files under `dir`, in code-point order of their path. */
async function sourceFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
    .map((entry) => join(entry.parentPath, entry.name))
    .sort(byCodePoint);
}

/** The name of the class an `extends` clause names, without type arguments. */
function baseName(node: ts.ClassDeclaration): string | undefined {
  const clause = node.heritageClauses?.find(
    (heritage) => heritage.token === ts.SyntaxKind.ExtendsKeyword,
  );
  const expression = clause?.types[0]?.expression;
  return expression && ts.isIdentifier(expression)
    ? expression.text
    : undefined;
}

/** Scans every `.ts` file under `sourceDir` for calls to `natives`. */
export async function scanSources(
  sourceDir: string,
  natives: ReadonlySet<string>,
): Promise<Scan> {
  const scan: Scan = { classes: new Map(), calls: new Map() };

  const visit = (node: ts.Node, owner: string | undefined) => {
    if (ts.isClassDeclaration(node) && node.name) {
      owner = node.name.text;
      scan.classes.set(owner, { base: baseName(node) });
    }
    if (
      owner !== undefined &&
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      natives.has(node.expression.text)
    ) {
      const name = node.expression.text;
      const callers = scan.calls.get(name) ?? new Set<string>();
      callers.add(owner);
      scan.calls.set(name, callers);
    }
    ts.forEachChild(node, (child) => {
      visit(child, owner);
    });
  };

  for (const file of await sourceFiles(sourceDir)) {
    const text = await readFile(file, "utf8");
    visit(ts.createSourceFile(file, text, ts.ScriptTarget.Latest), undefined);
  }
  return scan;
}
