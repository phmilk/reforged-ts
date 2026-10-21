import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { LIBRARY_PACKAGE } from "../src/packages.js";
import { TEMPLATE_REPOSITORY } from "../src/template-clone.js";
import { templateRef } from "../src/template-gate.js";
import { readPublishablePackages } from "../src/workspace.js";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));

/**
 * The Creation CLI's source module that carries the Template ref it
 * downloads and the Template's repository. Imported by URL: the CLI is
 * another package, outside this one's sources, and its tests type-check it.
 */
const CLI_TEMPLATE = pathToFileURL(
  fileURLToPath(
    new URL(
      "../../packages/create-reforged-map/src/template.ts",
      import.meta.url,
    ),
  ),
).href;

/** The constants of the CLI's source module. */
const cliTemplate = () =>
  import(CLI_TEMPLATE) as Promise<{
    TEMPLATE_REF: unknown;
    TEMPLATE_REPOSITORY: unknown;
  }>;

describe("the Creation CLI's Template", () => {
  it("is at templateRef of the library's version, so a new library major moves it", async () => {
    const library = (await readPublishablePackages(ROOT)).find(
      ({ name }) => name === LIBRARY_PACKAGE,
    );
    const cli = await cliTemplate();

    expect(library).toBeDefined();
    expect(cli.TEMPLATE_REF).toBe(templateRef(library?.version ?? ""));
  });

  it("is the repository the Template gate clones", async () => {
    expect((await cliTemplate()).TEMPLATE_REPOSITORY).toBe(TEMPLATE_REPOSITORY);
  });
});
