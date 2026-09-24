/**
 * Seam 1: the generator's programmatic entry point. A Patch folder and an
 * Overlay folder in; the output files by path plus the diagnostics out, or a
 * typed failure carrying the diagnostics when any of them is an error.
 */
import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { hasErrors, type Diagnostic } from "./diagnostics.js";
import { emitFile } from "./emit.js";
import { SOURCES, type Declaration } from "./model.js";
import { checkNames } from "./names.js";
import { loadOverlay } from "./overlay.js";
import { parseJass } from "./parser.js";
import { gameVersion, readPatchIdentity } from "./provenance.js";
import { resolve } from "./resolve.js";

export interface GenerateInput {
  /** A vendored Patch folder: `common.j`, `blizzard.j`, `common.ai`, `provenance.json`. */
  patchDir: string;
  /**
   * The Overlay folder: one folder per source file, holding the kind folders
   * `functions`, `globals` and `types`, one JSON per declaration.
   */
  overlayDir: string;
}

export interface GenerateSuccess {
  ok: true;
  /** Full build of the Patch the files describe. */
  patch: string;
  /** File text by output path, `/`-separated and relative to the package root. */
  files: Map<string, string>;
  /** Warnings only. */
  diagnostics: Diagnostic[];
}

export interface GenerateFailure {
  ok: false;
  /** At least one error, in checklist order. */
  diagnostics: Diagnostic[];
}

export type GenerateResult = GenerateSuccess | GenerateFailure;

export async function generate(input: GenerateInput): Promise<GenerateResult> {
  const provenance = await readPatchIdentity(input.patchDir);
  const diagnostics: Diagnostic[] = [...provenance.diagnostics];

  const declarations: Declaration[] = [];
  for (const source of SOURCES) {
    let text: string;
    try {
      text = await readFile(join(input.patchDir, source), "utf8");
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

  const overlay = await loadOverlay(input.overlayDir);
  diagnostics.push(...overlay.diagnostics);

  const patch = provenance.identity?.patch ?? basename(input.patchDir);
  const resolution = resolve(declarations, overlay, patch);
  diagnostics.push(...resolution.diagnostics);

  if (!provenance.identity || hasErrors(diagnostics)) {
    return { ok: false, diagnostics };
  }

  const folder = gameVersion(patch);
  const files = new Map<string, string>();
  for (const source of SOURCES) {
    const ofSource = resolution.declarations.filter((d) => d.source === source);
    files.set(
      `${folder}/${source}.d.ts`,
      emitFile(source, ofSource, provenance.identity)
    );
  }
  return { ok: true, patch, files, diagnostics };
}
