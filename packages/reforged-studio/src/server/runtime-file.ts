/**
 * The Studio's side of its runtime file (#833, settling #468):
 * `.reforged-studio.json` at the Map project's root, one per Map project,
 * written once the server listens and removed on a clean stop. Its format
 * and the rule for a live one are `reforged-map`'s (`readLiveStudio`),
 * which the hover of its TypeScript plugin reads with, so that the two
 * apply one rule.
 */
import fs from "node:fs";
import path from "node:path";
import { STUDIO_RUNTIME_FILE, type StudioRuntimeFile } from "reforged-map";

/**
 * Writes the runtime file of a running Studio, replacing the one there.
 *
 * @param projectRoot - The Map project's root.
 * @param record - What it holds.
 */
export function writeRuntimeFile(
  projectRoot: string,
  record: StudioRuntimeFile,
): void {
  fs.writeFileSync(
    path.join(projectRoot, STUDIO_RUNTIME_FILE),
    `${JSON.stringify(record, null, 2)}\n`,
    "utf8",
  );
}

/**
 * Removes the runtime file of a Studio that stops, when it is still that
 * Studio's: a Studio started on another map folder since then replaced it,
 * and keeps it.
 *
 * @param projectRoot - The Map project's root.
 * @param record - What the stopping Studio wrote.
 */
export function removeRuntimeFile(
  projectRoot: string,
  record: StudioRuntimeFile,
): void {
  const file = path.join(projectRoot, STUDIO_RUNTIME_FILE);
  try {
    const current = JSON.parse(fs.readFileSync(file, "utf8")) as Partial<
      Record<keyof StudioRuntimeFile, unknown>
    >;
    if (current.pid !== record.pid || current.url !== record.url) return;
    fs.rmSync(file, { force: true });
  } catch {
    // No file, or one that is not this Studio's record: nothing to remove.
  }
}
