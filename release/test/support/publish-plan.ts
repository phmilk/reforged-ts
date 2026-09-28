/**
 * Fixture publish plans for the release scripts that read one without
 * installing its tarballs: entries whose tarball is named but never written.
 */
import { tempDir, writeText } from "./workspace.js";

/** A publish entry as `changeset pack` writes it, its tarball not written. */
export function publishEntry(name: string, version: string, tag = "alpha") {
  return {
    kind: "publish",
    name,
    version,
    access: "public",
    tag,
    tarball: {
      path: `packages/${name}-${version}.tgz`,
      integrity: "sha256-AAAA",
    },
  };
}

/** A plan as `changeset pack` writes it, in dependency-ordered chunks. */
export function publishPlan(...chunks: unknown[][]) {
  return { version: 1, plan: chunks };
}

/** A new `changeset pack` output folder holding `plan`; resolves with it. */
export async function writePackDir(plan: unknown): Promise<string> {
  const dir = await tempDir("pack");
  await writeText(dir, "publish-plan.json", JSON.stringify(plan));
  return dir;
}
