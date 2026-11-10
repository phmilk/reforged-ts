/**
 * The toast's text after a save and after "Reload in the World Editor"
 * (#871): it says the World Editor reloaded the map only when the reload
 * saw it do so, and otherwise what the author does about it.
 */
import { describe, expect, it } from "vitest";
import { reloadText, savedText } from "../page/reload-text.js";

const SAVED = "Saved 1 file: war3map.w3u.";
const CLOSE_AND_OPEN =
  "The World Editor did not reload the map: close it there and open it again, or its next save puts back what it loaded before.";
const UNSAVED =
  "The World Editor did not reload the map: it holds unsaved edits for it. Close the map there and open it again once they are saved or discarded.";

describe("the toast after a save", () => {
  it("says the World Editor reloaded the map when the reload saw it", () => {
    expect(
      savedText({
        written: ["war3map.w3u"],
        reload: "sent",
        worldEditorReload: { status: "reloaded" },
      }),
    ).toBe(`${SAVED} The World Editor reloaded the map.`);
  });

  it("never says the map reloaded when the World Editor answered with a Warning", () => {
    const text = savedText({
      written: ["war3map.w3u"],
      reload: "not-reloaded",
      worldEditorReload: {
        status: "not-reloaded",
        reason: "warning",
        message: "The World Editor answered -loadfile with a Warning.",
      },
    });

    expect(text).toBe(`${SAVED} ${CLOSE_AND_OPEN}`);
    expect(text).not.toContain("reloads the map");
  });

  it.each(["not-closed", "not-loaded", "dialog-open"] as const)(
    "tells the author to close and open the map again after %s",
    (reason) => {
      expect(reloadText({ status: "not-reloaded", reason, message: "" })).toBe(
        CLOSE_AND_OPEN,
      );
    },
  );

  it.each(["modified", "save-prompt"] as const)(
    "says the World Editor holds unsaved edits after %s",
    (reason) => {
      expect(reloadText({ status: "not-reloaded", reason, message: "" })).toBe(
        UNSAVED,
      );
    },
  );

  it("says the World Editor opens a map no window held", () => {
    expect(reloadText({ status: "opened" })).toBe(
      "The World Editor opens the map.",
    );
  });

  it("names a reload that threw, offered again", () => {
    expect(
      savedText({
        written: ["war3map.w3u"],
        reload: "offered",
        reloadError: "powershell.exe could not run",
      }),
    ).toBe(`${SAVED} The reload failed: powershell.exe could not run`);
  });
});
