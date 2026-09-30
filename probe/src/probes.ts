/**
 * Probe names: the kebab-case ASCII name of the Probe's file, safe as a
 * `Preload` path and as a command argument.
 */
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { AuthorError } from "./errors.js";

const PROBE_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Fails with an AuthorError unless `name` is kebab-case ASCII. */
export function checkProbeName(name: string): void {
  if (!PROBE_NAME.test(name)) {
    throw new AuthorError(
      `${JSON.stringify(name)} is not a Probe name: a Probe is named after its file, in kebab-case ASCII (lowercase letters and digits, words joined by single hyphens), such as "hello".`,
    );
  }
}

/** The file of the Probe `name` in `folder`; an AuthorError when the name is bad or the file missing. */
export function probeFile(folder: string, name: string): string {
  checkProbeName(name);
  const file = join(folder, `${name}.ts`);
  if (!statSync(file, { throwIfNoEntry: false })?.isFile()) {
    throw new AuthorError(`No Probe ${name}: ${file} does not exist.`);
  }
  return file;
}

/** The Probes of `folder`, sorted: every TypeScript file directly in it. */
export function listProbes(folder: string): string[] {
  return readdirSync(folder, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith(".ts") &&
        !entry.name.endsWith(".d.ts"),
    )
    .map((entry) => entry.name.slice(0, -".ts".length))
    .sort();
}
