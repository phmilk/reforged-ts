/**
 * The workspace as the release scripts see it: the packages it publishes.
 * They are found the way Changesets finds them (`@manypkg/get-packages` over
 * `pnpm-workspace.yaml`) and a package is publishable when it is not private,
 * so no list of packages is written down. The few packages a script treats
 * apart (the library, the Typings, ...) are named once, in `packages.ts`.
 */
import { getPackages, type Package } from "@manypkg/get-packages";
import { posix, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { byCodePoint } from "./order.js";

/** The repository root, from `src/` in tests and `build/` when built. */
export const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));

/** A package's `package.json`, with the fields the scripts do not type. */
export type PackageManifest = Package["packageJson"] &
  Readonly<Record<string, unknown>>;

export interface PublishablePackage {
  name: string;
  version: string;
  /**
   * The package's folder relative to the workspace root, `/`-separated,
   * as git names paths (`packages/reforged-ts`).
   */
  dir: string;
  /** The package's folder, absolute. */
  absoluteDir: string;
  manifest: PackageManifest;
}

/**
 * Every package of the workspace at `root` that is not private, in
 * code-point order of its name.
 */
export async function readPublishablePackages(
  root: string,
): Promise<PublishablePackage[]> {
  const { packages } = await getPackages(root);
  return packages
    .filter(({ packageJson }) => packageJson.private !== true)
    .map(({ packageJson, dir, relativeDir }) => ({
      name: packageJson.name,
      version: packageJson.version,
      dir: relativeDir.split(sep).join(posix.sep),
      absoluteDir: dir,
      // The whole parsed file: manypkg types only the fields it reads.
      manifest: packageJson as PackageManifest,
    }))
    .sort((a, b) => byCodePoint(a.name, b.name));
}

/**
 * The package that owns the file at the `/`-separated, root-relative
 * `path`: the one with the deepest folder holding it, if any.
 */
export function owningPackage<P extends Pick<PublishablePackage, "dir">>(
  packages: readonly P[],
  path: string,
): P | undefined {
  let owner: P | undefined;
  for (const pkg of packages) {
    const holds = pkg.dir === "." || path.startsWith(`${pkg.dir}/`);
    if (holds && (owner === undefined || pkg.dir.length > owner.dir.length)) {
      owner = pkg;
    }
  }
  return owner;
}
