import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

/** The Jass files of a fixture Patch; a file left out is written empty. */
export interface PatchFiles {
  "common.j"?: string;
  "blizzard.j"?: string;
  "common.ai"?: string;
}

/** An Overlay entry exactly as its JSON file holds it. */
export interface OverlayEntryFixture {
  name: string;
  source: string;
  returns: { nullable: boolean };
  params: { name: string; nullable: boolean; type?: string }[];
  async?: boolean;
  deprecated?: string;
  notes?: string;
  since?: string;
  origin?: string;
}

export const provenance = {
  patch: "3.0.0.24268",
  tag: "Reforged-v3.0.0.24268-w3-3a9d8f2",
  commit: "a392fc3d5e6c37980accbfc560b28387fc7d01bc",
  upstream: "https://github.com/Luashine/jass-history",
  path: "timeline/scripts",
  downloaded: "2026-09-24",
  files: {},
};

/**
 * An Overlay entry for `name` in `source`. A parameter written `name?` is
 * nullable; `returnsNullable` sets `returns.nullable`.
 */
export function entry(
  source: string,
  name: string,
  params: string[] = [],
  returnsNullable = false
): OverlayEntryFixture {
  return {
    name,
    source,
    returns: { nullable: returnsNullable },
    params: params.map((param) =>
      param.endsWith("?")
        ? { name: param.slice(0, -1), nullable: true }
        : { name: param, nullable: false }
    ),
  };
}

/** A global's Overlay entry exactly as its JSON file holds it. */
export interface GlobalEntryFixture {
  name: string;
  source: string;
  nullable: boolean;
  deprecated?: string;
  notes?: string;
  since?: string;
  origin?: string;
}

/** A global's Overlay entry; `facts` adds the optional fields. */
export function globalEntry(
  source: string,
  name: string,
  nullable = false,
  facts: Omit<GlobalEntryFixture, "name" | "source" | "nullable"> = {}
): GlobalEntryFixture {
  return { name, source, nullable, ...facts };
}

/** A type's optional Overlay entry exactly as its JSON file holds it. */
export interface TypeEntryFixture {
  name: string;
  source: string;
  deprecated?: string;
  notes?: string;
}

export function typeEntry(
  source: string,
  name: string,
  facts: Omit<TypeEntryFixture, "name" | "source"> = {}
): TypeEntryFixture {
  return { name, source, ...facts };
}

/** Any Overlay entry: every entry file has a name and a source. */
export type AnyEntryFixture =
  | OverlayEntryFixture
  | GlobalEntryFixture
  | TypeEntryFixture;

export interface FixtureOptions {
  /** Raw Overlay files, by path relative to the Overlay folder. */
  rawOverlay?: Record<string, string>;
  /** The provenance file's content; `null` leaves the file out. */
  provenance?: unknown;
}

/**
 * Writes a vendor folder holding one Patch folder, named after its Build, and
 * an Overlay folder to a fresh temporary directory.
 */
export async function writeFixture(
  patch: PatchFiles,
  overlay: AnyEntryFixture[] = [],
  options: FixtureOptions = {}
): Promise<{ patchDir: string; overlayDir: string; vendorDir: string }> {
  const root = await mkdtemp(join(tmpdir(), "reforged-types-"));
  const vendorDir = join(root, "vendor");
  const overlayDir = join(root, "overlay");
  await mkdir(overlayDir);
  const provenanceFile =
    options.provenance === undefined ? provenance : options.provenance;
  const patchDir = await writePatch(vendorDir, patch, provenanceFile);
  await writeOverlay(overlayDir, overlay, options.rawOverlay);
  return { patchDir, overlayDir, vendorDir };
}

/**
 * Writes one Patch folder into `vendorDir`, named after the Build its
 * provenance names (`patch` when it names none); `null` leaves the provenance
 * file out. Returns the folder.
 */
export async function writePatch(
  vendorDir: string,
  patch: PatchFiles,
  provenanceFile: unknown = provenance
): Promise<string> {
  const build = (provenanceFile as { patch?: unknown } | null)?.patch;
  const patchDir = join(
    vendorDir,
    typeof build === "string" && /^[\w.]+$/.test(build) ? build : "patch"
  );
  await mkdir(patchDir, { recursive: true });
  for (const file of ["common.j", "blizzard.j", "common.ai"] as const) {
    await writeFile(join(patchDir, file), patch[file] ?? "");
  }
  if (provenanceFile !== null) {
    await writeFile(
      join(patchDir, "provenance.json"),
      JSON.stringify(provenanceFile, null, 2) + "\n"
    );
  }
  return patchDir;
}

/** Writes the Overlay entries and the raw Overlay files into `overlayDir`. */
export async function writeOverlay(
  overlayDir: string,
  overlay: AnyEntryFixture[],
  rawOverlay: Record<string, string> = {}
): Promise<void> {
  for (const item of overlay) {
    const folder = join(overlayDir, item.source, kindFolder(item));
    await mkdir(folder, { recursive: true });
    await writeFile(
      join(folder, `${item.name}.json`),
      JSON.stringify(item, null, 2) + "\n"
    );
  }
  for (const [path, text] of Object.entries(rawOverlay)) {
    await mkdir(dirname(join(overlayDir, path)), { recursive: true });
    await writeFile(join(overlayDir, path), text);
  }
}

/**
 * The kind folder an entry built by the helpers above belongs in. Only the
 * fixture infers it; the generator takes the kind from the folder. Use
 * `rawOverlay` to put a file anywhere else.
 */
function kindFolder(item: AnyEntryFixture): string {
  if ("returns" in item || "params" in item) return "functions";
  return "nullable" in item ? "globals" : "types";
}
