// The fixture project: a Map project with type information (real Typings,
// stub library) that every rule test lints. See fixture-project/tsconfig.json.
import path from "node:path";
import { fileURLToPath } from "node:url";

export const fixtureProjectRoot = fileURLToPath(
  new URL("../fixture-project", import.meta.url),
);

/** A file of the fixture project by its path relative to the project root. */
export function fixtureFile(relative: string): string {
  return path.join(fixtureProjectRoot, relative);
}
