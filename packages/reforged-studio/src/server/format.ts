/**
 * The formatting of the definition files an Object adoption wrote, with the
 * Map project's own Prettier, as `pnpm objects:adopt` formats them:
 * `reforged-map` writes them valid but unformatted, for the caller to
 * format. The Studio does not depend on Prettier: it uses the one the Map
 * project installs, and leaves the files as written when there is none.
 */
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

/** What the Studio uses of Prettier's API. */
interface Prettier {
  resolveConfig(file: string): Promise<Record<string, unknown> | null>;
  format(text: string, options: Record<string, unknown>): Promise<string>;
}

/** The Map project's Prettier, resolved from its root; undefined when it installs none. */
async function projectPrettier(
  projectRoot: string,
): Promise<Prettier | undefined> {
  let resolved: string;
  try {
    resolved = createRequire(path.join(projectRoot, "package.json")).resolve(
      "prettier",
    );
  } catch {
    return undefined;
  }
  const module = (await import(pathToFileURL(resolved).href)) as Prettier & {
    default?: Prettier;
  };
  return typeof module.format === "function"
    ? module
    : (module.default ?? undefined);
}

/** What {@link formatDefinitionFiles} did. */
export interface Formatting {
  /** Whether the Map project has a Prettier, which formatted the files. */
  readonly formatted: boolean;
  /** A file Prettier could not format, each one line: it stays as adoption wrote it. */
  readonly warnings: readonly string[];
}

/**
 * Formats files in place with the Map project's Prettier and the
 * configuration that applies to each, as `pnpm objects:adopt` does.
 *
 * @param projectRoot - The Map project's root, from which Prettier is resolved.
 * @param files - The files, absolute paths.
 * @returns Whether they were formatted, and the warnings of those that could not be.
 */
export async function formatDefinitionFiles(
  projectRoot: string,
  files: readonly string[],
): Promise<Formatting> {
  const prettier = await projectPrettier(projectRoot);
  if (prettier === undefined) return { formatted: false, warnings: [] };
  const warnings: string[] = [];
  for (const file of files) {
    try {
      const text = fs.readFileSync(file, "utf8");
      const options = (await prettier.resolveConfig(file)) ?? {};
      const formatted = await prettier.format(text, {
        ...options,
        filepath: file,
      });
      if (formatted !== text) fs.writeFileSync(file, formatted);
    } catch (error) {
      warnings.push(
        `${path.relative(projectRoot, file).split(path.sep).join("/")}: Prettier could not format it (${error instanceof Error ? error.message : String(error)}); it stays as adoption wrote it.`,
      );
    }
  }
  return { formatted: true, warnings };
}
