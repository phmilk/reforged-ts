// docs:version <label>: cuts the docs version of a library release (#40), the
// only way a version is created. It runs docs:collect, then Docusaurus' own
// version command, which loads the site, and with it the reference plugins,
// which regenerate both API references before it copies the docs tree, so
// the guides, the collected pages and the references are frozen together.
// Then it applies the retention rule, as docs:prune does, so that a local cut
// ends as the one CI makes. Exit code 0 when cut, 1 when a step fails or the
// label cannot be cut, 2 on arguments.
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { main as collect, type Output, PROCESS_OUTPUT } from "./collect.mts";
import { pruneAndReport, SITE } from "./prune.mts";
import {
  isLabel,
  readVersions,
  retain,
  versionsFile,
  VersionsError,
} from "./versions.mts";

/** What a cut runs, apart from the retention rule. */
export interface CutSteps {
  /** The site folder, where Docusaurus keeps its versions. */
  readonly site: string;
  /** docs:collect; resolves to its exit code. */
  collect(output: Output): Promise<number>;
  /** `docusaurus docs:version <label>` in the site; resolves to its exit code. */
  docusaurusVersion(label: string): Promise<number>;
}

const USAGE =
  "Usage: docs:version <label>, where the label is the library's major.minor (1.0)\n";

export const SITE_STEPS: CutSteps = {
  site: SITE,
  collect: (output) => collect([], output),
  docusaurusVersion: (label) =>
    new Promise((done, fail) => {
      const docusaurus = createRequire(import.meta.url).resolve(
        "@docusaurus/core/bin/docusaurus.mjs",
      );
      spawn(process.execPath, [docusaurus, "docs:version", label], {
        cwd: SITE,
        stdio: "inherit",
      })
        .on("error", fail)
        .on("exit", (code) => {
          done(code ?? 1);
        });
    }),
};

export async function main(
  args: readonly string[],
  output: Output,
  steps: CutSteps = SITE_STEPS,
): Promise<number> {
  const [label, ...rest] = args;
  if (label === undefined || rest.length > 0) {
    output.stderr(USAGE);
    return 2;
  }
  if (!isLabel(label)) {
    output.stderr(
      `docs:version: \`${label}\` is not a docs version label: a label is the library's major.minor, such as 1.0 (for reforged-ts 1.0.3 too).\n${USAGE}`,
    );
    return 2;
  }
  try {
    const versions = await readVersions(steps.site);
    if (versions.includes(label)) {
      output.stderr(
        `docs:version: ${label} is cut already (${versionsFile(steps.site)}).\n`,
      );
      return 1;
    }
    const { kept } = retain([label, ...versions]);
    if (!kept.includes(label)) {
      output.stderr(
        `docs:version: ${label} would be removed at once: the site keeps the last three minors of each major, and ${kept.filter((each) => each.split(".")[0] === label.split(".")[0]).join(", ")} are newer.\n`,
      );
      return 1;
    }
  } catch (error) {
    if (!(error instanceof VersionsError)) throw error;
    output.stderr(`docs:version failed: ${error.message}\n`);
    return 1;
  }
  const collected = await steps.collect(output);
  if (collected !== 0) return collected;
  const cut = await steps.docusaurusVersion(label);
  if (cut !== 0) {
    output.stderr(`docs:version: Docusaurus could not cut ${label}.\n`);
    return 1;
  }
  return pruneAndReport(steps.site, output);
}

const script = process.argv.at(1);
if (
  script !== undefined &&
  pathToFileURL(resolve(script)).href === import.meta.url
) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
