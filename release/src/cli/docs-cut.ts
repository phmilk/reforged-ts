/**
 * `release:docs-cut <tag>`: whether the tag (`reforged-ts@1.1.0`) cuts a
 * docs version, for `docs-cut.yml`'s `cut-version` job. Prints the decision as
 * one JSON object: `{"cut":true,"version":"1.1.0","label":"1.1"}`, or
 * `{"cut":false,"reason":"…"}`. Exit codes: 0 the decision, cut or not,
 * 2 usage.
 */
import { docsCut } from "../docs-cut.js";
import { invokedDirectly, PROCESS_OUTPUT, type Output } from "./common.js";

const USAGE = "Usage: release:docs-cut <tag>, such as reforged-ts@1.1.0\n";

export function main(args: readonly string[], output: Output): number {
  const [tag] = args;
  if (args.length !== 1 || tag === "") {
    output.stderr(USAGE);
    return 2;
  }
  output.stdout(`${JSON.stringify(docsCut(tag))}\n`);
  return 0;
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2), PROCESS_OUTPUT);
}
