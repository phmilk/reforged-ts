// A docs page compiled as the build compiles it: Docusaurus' MDX loader
// under the site's validated `markdown` config of `docs:check`, its
// preprocessor (the include marker) included.
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { validateConfig } from "@docusaurus/core/lib/server/configValidation.js";
import mdxLoader, { type Options } from "@docusaurus/mdx-loader";
import { siteConfig } from "../../config";

/** The site folder. */
export const SITE = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

/** The loader's options, as the docs plugin gives them, under `docs:check`. */
const OPTIONS: Options = {
  markdownConfig: validateConfig(
    siteConfig({ strict: true }),
    "docusaurus.check.config.ts",
  ).markdown,
  admonitions: true,
  staticDirs: [],
  siteDir: SITE,
};

/** The compiled JavaScript of the page at `filePath`, as a build gets it. */
export function compile(
  filePath: string,
  fileContent: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const context = {
      _compiler: { name: "client" },
      resource: filePath,
      resourcePath: filePath,
      getOptions: () => OPTIONS,
      addDependency: () => undefined,
      async: () => (error: Error | null, result?: string) => {
        if (error) reject(error);
        else resolve(result ?? "");
      },
    };
    void mdxLoader.call(
      context as unknown as ThisParameterType<typeof mdxLoader>,
      fileContent,
    );
  });
}
