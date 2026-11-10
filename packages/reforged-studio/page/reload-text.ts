/**
 * What the toast says after a save and after "Reload in the World Editor":
 * the files written, and whether the World Editor reloaded the map, from
 * what the reload saw rather than what it sent (#871).
 */
import type { ReloadAnswer, SaveAnswer } from "../src/server/api-types.js";
import { counted } from "./counted.js";

/** Why the Studio cannot reload the World Editor, without its executable: beside the disabled box, and after a save. */
export const NO_WORLD_EDITOR_REASON =
  "No World Editor.exe beside the game's: start the Studio with --world-editor <executable> (worldEditorExecutable) to reload the map there.";

/**
 * What the toast says of a World Editor reload: reloaded, opened, or not
 * reloaded, and then what the author does about it.
 *
 * @param reload - What the reload did; undefined for a Studio that did not say.
 * @returns The toast's sentence about the reload.
 */
export function reloadText(
  reload: ReloadAnswer["worldEditorReload"] | undefined,
): string {
  if (reload === undefined || reload.status === "reloaded") {
    return "The World Editor reloaded the map.";
  }
  if (reload.status === "opened") return "The World Editor opens the map.";
  return reload.reason === "modified" || reload.reason === "save-prompt"
    ? "The World Editor did not reload the map: it holds unsaved edits for it. Close the map there and open it again once they are saved or discarded."
    : "The World Editor did not reload the map: close it there and open it again, or its next save puts back what it loaded before.";
}

/**
 * The toast's text after a save.
 *
 * @param answer - The save's answer.
 * @returns The toast's line: the files saved, then what the World Editor did.
 */
export function savedText(
  answer: Pick<
    SaveAnswer,
    "written" | "reload" | "reloadError" | "worldEditorReload"
  >,
): string {
  if (answer.written.length === 0) {
    return "Nothing to save: the map folder already holds every edit.";
  }
  const files = `Saved ${counted(answer.written.length, "file")}: ${answer.written.join(", ")}.`;
  switch (answer.reload) {
    case "sent":
    case "not-reloaded":
      return `${files} ${reloadText(answer.worldEditorReload)}`;
    case "no-executable":
      return `${files} The World Editor holds the map folder. ${NO_WORLD_EDITOR_REASON}`;
    case "offered":
      return answer.reloadError === undefined
        ? `${files} The World Editor holds the map folder without unsaved edits.`
        : `${files} The reload failed: ${answer.reloadError}`;
    default:
      return files;
  }
}
