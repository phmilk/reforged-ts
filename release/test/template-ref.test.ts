import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { LIBRARY_PACKAGE } from "../src/packages.js";
import { templateRef } from "../src/template-gate.js";
import { readPublishablePackages } from "../src/workspace.js";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));

/**
 * The creation CLI's source module that carries the Template ref it
 * downloads. Imported by URL: the CLI is another package, outside this
 * one's sources, and its tests type-check it.
 */
const CLI_TEMPLATE = pathToFileURL(
  fileURLToPath(
    new URL(
      "../../packages/create-reforged-map/src/template.ts",
      import.meta.url,
    ),
  ),
).href;

describe("the creation CLI's Template ref", () => {
  it("is templateRef of the library's version, so a new library major moves it", async () => {
    const library = (await readPublishablePackages(ROOT)).find(
      ({ name }) => name === LIBRARY_PACKAGE,
    );
    const cli = (await import(CLI_TEMPLATE)) as { TEMPLATE_REF: unknown };

    expect(library).toBeDefined();
    expect(cli.TEMPLATE_REF).toBe(templateRef(library?.version ?? ""));
  });
});
