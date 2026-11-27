/**
 * The Template ref the Creation CLI downloads, in its build output. Its
 * source keeps `main`, the ref a local build downloads; the release's pack
 * step writes the Template ref of the release's channel into the build
 * output before packing (ADR 0031), so the packed CLI downloads the
 * Template of the branch it was released from, and the Template gate reads
 * it back from the packed tarball.
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { CREATION_PACKAGE } from "./packages.js";
import { errorMessage } from "./unknown.js";
import { readPublishablePackages } from "./workspace.js";

/** The module of the Creation CLI's build output that holds its Template ref. */
export const TEMPLATE_REF_MODULE = "dist/template.js";

/** The declaration of the Template ref, as tsc writes it from the source. */
const DECLARATION = /^export const TEMPLATE_REF = "([^"\n]*)";$/gm;

/** A Creation CLI whose Template ref cannot be read or written. */
export class TemplateRefError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "TemplateRefError";
  }
}

/**
 * The Template ref the Creation CLI's module `text`, read from `from`,
 * downloads. Throws a `TemplateRefError` when the module does not declare
 * it exactly once.
 */
export function readTemplateRef(text: string, from: string): string {
  const refs = Array.from(text.matchAll(DECLARATION), ([, ref]) => ref);
  const [ref] = refs;
  if (refs.length !== 1) {
    throw new TemplateRefError(
      `${from} does not declare \`export const TEMPLATE_REF = "…";\` once: ` +
        `it is not the build output of ${CREATION_PACKAGE}'s src/template.ts.`,
    );
  }
  return ref;
}

/**
 * Writes `ref` as the Template ref of the Creation CLI's build output in
 * the workspace at `root`, and resolves with the module it wrote. Throws a
 * `TemplateRefError` when the workspace has no Creation CLI, when it is not
 * built, or when its module does not declare the ref exactly once, writing
 * nothing.
 */
export async function writeTemplateRef(
  root: string,
  ref: string,
): Promise<string> {
  const cli = (await readPublishablePackages(root)).find(
    ({ name }) => name === CREATION_PACKAGE,
  );
  if (cli === undefined) {
    throw new TemplateRefError(`The workspace has no ${CREATION_PACKAGE}.`);
  }
  const path = join(root, cli.dir, TEMPLATE_REF_MODULE);
  let text: string;
  try {
    text = await readFile(path, "utf8");
  } catch (error) {
    throw new TemplateRefError(
      `${path} cannot be read: build ${CREATION_PACKAGE} first (pnpm build). ${errorMessage(error)}`,
      { cause: error },
    );
  }
  readTemplateRef(text, path);
  await writeFile(
    path,
    text.replace(
      DECLARATION,
      `export const TEMPLATE_REF = ${JSON.stringify(ref)};`,
    ),
  );
  return path;
}
