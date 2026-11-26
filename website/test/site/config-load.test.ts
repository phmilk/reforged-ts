// The site's configuration files as Docusaurus loads them: through
// `loadFreshModule` of @docusaurus/utils, which runs jiti and evaluates each
// imported module as CommonJS. A module of the import graph that Node runs as
// an ES module but jiti cannot (an `await` at the top level, #979's first CI
// run) fails here, under `pnpm test`, not only in the site build.
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { SITE } from "./compile";

/** `loadFreshModule` of the @docusaurus/utils that @docusaurus/core loads. */
async function loadFreshModule(): Promise<(path: string) => Promise<unknown>> {
  const core = createRequire(join(SITE, "package.json")).resolve(
    "@docusaurus/core/package.json",
  );
  const utils = createRequire(core).resolve("@docusaurus/utils");
  const module = (await import(pathToFileURL(utils).href)) as {
    loadFreshModule: (path: string) => Promise<unknown>;
  };
  return module.loadFreshModule;
}

describe("the site's configuration files", () => {
  for (const file of ["docusaurus.config.ts", "docusaurus.check.config.ts"]) {
    it(`load as Docusaurus loads ${file}`, async () => {
      const load = await loadFreshModule();

      await expect(load(join(SITE, file))).resolves.toMatchObject({
        title: "reforged-ts",
      });
    });
  }
});
