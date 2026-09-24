import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

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
  params: { name: string; nullable: boolean }[];
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

export interface FixtureOptions {
  /** Raw Overlay files, by path relative to the Overlay folder. */
  rawOverlay?: Record<string, string>;
  /** The provenance file's content; `null` leaves the file out. */
  provenance?: unknown;
}

/** Writes a Patch folder and an Overlay folder to a fresh temporary directory. */
export async function writeFixture(
  patch: PatchFiles,
  overlay: OverlayEntryFixture[] = [],
  options: FixtureOptions = {}
): Promise<{ patchDir: string; overlayDir: string }> {
  const root = await mkdtemp(join(tmpdir(), "reforged-types-"));
  const patchDir = join(root, "patch");
  const overlayDir = join(root, "overlay");
  await mkdir(patchDir);
  await mkdir(overlayDir);
  for (const file of ["common.j", "blizzard.j", "common.ai"] as const) {
    await writeFile(join(patchDir, file), patch[file] ?? "");
  }
  const provenanceFile =
    options.provenance === undefined ? provenance : options.provenance;
  if (provenanceFile !== null) {
    await writeFile(
      join(patchDir, "provenance.json"),
      JSON.stringify(provenanceFile, null, 2) + "\n"
    );
  }
  for (const item of overlay) {
    await mkdir(join(overlayDir, item.source), { recursive: true });
    await writeFile(
      join(overlayDir, item.source, `${item.name}.json`),
      JSON.stringify(item, null, 2) + "\n"
    );
  }
  for (const [path, text] of Object.entries(options.rawOverlay ?? {})) {
    const [folder] = path.split("/");
    await mkdir(join(overlayDir, folder!), { recursive: true });
    await writeFile(join(overlayDir, path), text);
  }
  return { patchDir, overlayDir };
}
