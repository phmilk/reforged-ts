/**
 * Seam 1: the generator's programmatic entry point. Vendored Patch folders
 * and an Overlay folder in; the output files by path, the diagnostics and the
 * declarations each Patch adds over the one before it out, or a typed failure
 * carrying the diagnostics when any of them is an error.
 *
 * Every vendored Patch generates one game-version folder and one entry. When
 * two builds of the same game version are vendored, the newest generates it
 * and the older one is only compared against. The Overlay is shared: an entry
 * is an orphan only when no vendored Patch declares it.
 */
import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { additions, compareBuilds, type Additions } from "./additions.js";
import {
  ASYNC_NATIVES_FILE,
  emitAsyncNatives,
  emitEntry,
  emitManifest,
  MANIFEST_FILE,
} from "./artefacts.js";
import { hasErrors, type Diagnostic } from "./diagnostics.js";
import { emitFile } from "./emit.js";
import { SOURCES, type Declaration } from "./model.js";
import { checkNames } from "./names.js";
import { loadOverlay } from "./overlay.js";
import { parseJass } from "./parser.js";
import {
  gameVersion,
  readPatchIdentity,
  type PatchIdentity,
} from "./provenance.js";
import { orphans, resolve, type Resolved } from "./resolve.js";

/**
 * A vendored Patch folder holds `common.j`, `blizzard.j`, `common.ai` and
 * `provenance.json`. The Overlay folder holds one folder per source file,
 * each with the kind folders `functions`, `globals` and `types`, one JSON per
 * declaration.
 */
export type GenerateInput = { overlayDir: string } & (
  | {
      /** The one vendored Patch folder. */
      patchDir: string;
    }
  | {
      /** Every vendored Patch folder, in any order. */
      patchDirs: readonly string[];
    }
);

export interface GenerateSuccess {
  ok: true;
  /** Full build of the newest Patch generated. */
  patch: string;
  /** Full build of every Patch generated, oldest first. */
  patches: string[];
  /**
   * File text by output path, `/`-separated and relative to the package
   * root: per Patch generated, oldest first, the three declaration files and
   * the manifest in the game-version folder and the entry of the game
   * version; then `async-natives.json`.
   */
  files: Map<string, string>;
  /** Warnings only. */
  diagnostics: Diagnostic[];
  /** Per vendored Patch after the oldest, what it declares that the one before it does not. */
  additions: Additions[];
}

export interface GenerateFailure {
  ok: false;
  /** At least one error, in checklist order. */
  diagnostics: Diagnostic[];
  /** As on success, from the declarations that could be read. */
  additions: Additions[];
}

export type GenerateResult = GenerateSuccess | GenerateFailure;

/** One vendored Patch as read: its identity, declarations and problems. */
interface VendoredPatch {
  /** Full build, or the folder name when the provenance file is invalid. */
  patch: string;
  identity?: PatchIdentity;
  declarations: Declaration[];
  diagnostics: Diagnostic[];
}

export async function generate(input: GenerateInput): Promise<GenerateResult> {
  const patchDirs =
    "patchDirs" in input ? [...input.patchDirs] : [input.patchDir];
  // With several Patches, a Patch file's problem names its folder.
  const prefix = patchDirs.length > 1;
  const patches: VendoredPatch[] = [];
  for (const patchDir of patchDirs) {
    patches.push(
      await readPatch(patchDir, prefix ? `${basename(patchDir)}/` : "")
    );
  }
  patches.sort((a, b) => compareBuilds(a.patch, b.patch));

  const diagnostics: Diagnostic[] = patches.flatMap((p) => p.diagnostics);
  if (patches.length === 0) {
    diagnostics.push({
      severity: "error",
      kind: "patch-invalid",
      message: "no vendored Patch: vendor a jass-history tag first",
    });
  }
  diagnostics.push(...duplicateBuilds(patches));

  const overlay = await loadOverlay(input.overlayDir);
  diagnostics.push(...overlay.diagnostics);

  // The newest build of each game version generates its folder.
  const generated = patches.filter(
    (p, i) => gameVersion(patches[i + 1]?.patch ?? "") !== gameVersion(p.patch)
  );
  const resolved = new Map<VendoredPatch, Resolved[]>();
  const reported = new Set<string>();
  for (const patch of generated) {
    const resolution = resolve(patch.declarations, overlay);
    resolved.set(patch, resolution.declarations);
    // A missing entry is one file to write, however many Patches lack it.
    for (const diagnostic of resolution.diagnostics) {
      if (reported.has(diagnostic.message)) continue;
      reported.add(diagnostic.message);
      diagnostics.push(diagnostic);
    }
  }
  if (patches.length > 0) {
    diagnostics.push(
      ...orphans(
        patches.flatMap((p) => p.declarations),
        overlay,
        patches.map((p) => p.patch)
      )
    );
  }

  const added = additions(patches);
  if (hasErrors(diagnostics) || generated.some((p) => !p.identity)) {
    return { ok: false, diagnostics, additions: added };
  }

  const files = new Map<string, string>();
  for (const patch of generated) {
    const identity = patch.identity!;
    const declarations = resolved.get(patch)!;
    const folder = gameVersion(identity.patch);
    for (const source of SOURCES) {
      const ofSource = declarations.filter((d) => d.source === source);
      files.set(
        `${folder}/${source}.d.ts`,
        emitFile(source, ofSource, identity)
      );
    }
    files.set(
      `${folder}/${MANIFEST_FILE}`,
      emitManifest(identity.patch, declarations)
    );
    files.set(`${folder}.d.ts`, emitEntry(identity));
  }
  files.set(
    ASYNC_NATIVES_FILE,
    emitAsyncNatives([...resolved.values()].flat())
  );
  return {
    ok: true,
    patch: generated.at(-1)!.patch,
    patches: generated.map((p) => p.patch),
    files,
    diagnostics,
    additions: added,
  };
}

/** Reads the provenance file and parses the three Patch files of one folder. */
async function readPatch(
  patchDir: string,
  prefix: string
): Promise<VendoredPatch> {
  const provenance = await readPatchIdentity(patchDir);
  const diagnostics: Diagnostic[] = [...provenance.diagnostics];
  const declarations: Declaration[] = [];
  for (const source of SOURCES) {
    let text: string;
    try {
      text = await readFile(join(patchDir, source), "utf8");
    } catch (error) {
      diagnostics.push({
        severity: "error",
        kind: "patch-invalid",
        file: source,
        message: `${source}: cannot read the Patch file: ${
          (error as Error).message
        }`,
      });
      continue;
    }
    const parsed = parseJass(source, text);
    declarations.push(...parsed.declarations);
    diagnostics.push(...parsed.diagnostics);
  }
  diagnostics.push(...checkNames(declarations));
  return {
    patch: provenance.identity?.patch ?? basename(patchDir),
    identity: provenance.identity,
    declarations,
    diagnostics: diagnostics.map((d) => ({
      ...d,
      message: prefix + d.message,
    })),
  };
}

/** A build vendored in two folders (one's provenance names the other's). */
function duplicateBuilds(patches: readonly VendoredPatch[]): Diagnostic[] {
  const builds = patches.map((p) => p.patch);
  const duplicates = new Set(builds.filter((b, i) => builds.indexOf(b) !== i));
  return [...duplicates].map((build) => ({
    severity: "error",
    kind: "patch-invalid",
    message: `Patch ${build} is vendored in two folders; keep one folder per build`,
  }));
}
