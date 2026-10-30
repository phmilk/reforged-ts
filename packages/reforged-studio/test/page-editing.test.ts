/**
 * Seam 2 for editing in the Studio (#834): the built page in headless
 * Chromium, driven by Playwright, over the Studio's server on its own Map
 * project, so that its edits and saves leave the other page tests' alone.
 * It holds the wiring: an inline edit and its unsaved bar, a refusal shown
 * on its field, a select, Ctrl+S and the counter, undo, and the diff.
 *
 * It needs the page built (`pnpm build`) and Chromium installed, as
 * `page.test.ts` does.
 */
import fs from "node:fs";
import path from "node:path";
import { openObjectData } from "reforged-map";
import { chromium, type Browser, type Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PAGE_FOLDER } from "../src/server/page.js";
import type { Studio } from "../src/index.js";
import {
  closeStudios,
  mapProject,
  removeTemporary,
  start,
  type Project,
} from "./support/studio.js";

// Chromium's launch and each page's load, as page.test.ts budgets them.
const TIMEOUT = 30_000;

let browser: Browser;
let studio: Studio;
let project: Project;

beforeAll(async () => {
  if (!fs.existsSync(path.join(PAGE_FOLDER, "index.html"))) {
    throw new Error(
      "The Studio's page is not built: run `pnpm build` before these tests.",
    );
  }
  project = mapProject();
  studio = await start(project);
  browser = await chromium.launch();
}, TIMEOUT);

afterAll(async () => {
  await browser.close();
  await closeStudios();
  removeTemporary();
});

/** A new page on a path of the Studio. */
async function open(pathname: string): Promise<Page> {
  const page = await browser.newPage();
  await page.goto(studio.url + pathname);
  return page;
}

/** The unsaved changes the counter shows. */
async function unsaved(page: Page): Promise<string> {
  return ((await page.getByTestId("unsaved-count").textContent()) ?? "").trim();
}

/** A unit's value in the map folder on disk. */
function onDisk(rawcode: string, field: string): number | string | undefined {
  return openObjectData(project.mapFolder, { projectRoot: project.root })
    .objects("unit")
    .find((object) => object.rawcode === rawcode)
    ?.modifications.find((modification) => modification.field === field)?.value;
}

describe("editing in the Studio's page", () => {
  it(
    "edits a field inline, shows a refusal on it, saves with Ctrl+S, undoes and shows the diff",
    async () => {
      const page = await open("/objects/h001?kind=unit");
      const row = page.locator('table.fields tr[data-field="uhpm"]');
      await row.waitFor();
      await expect.poll(() => unsaved(page)).toBe("0 unsaved");

      // A value the writer refuses: its reason on the field, nothing changed.
      await row
        .getByRole("button", { name: "Edit Stats - Hit Points Maximum (Base)" })
        .click();
      await row.getByRole("textbox").fill("lots");
      await row.getByRole("textbox").press("Enter");
      await expect
        .poll(() => row.getByRole("alert").textContent())
        .toContain("invalid-value");

      // A number: the field shows it with the unsaved bar, the counter counts it.
      await row
        .getByRole("button", { name: "Edit Stats - Hit Points Maximum (Base)" })
        .click();
      await row.getByRole("textbox").fill("777");
      await row.getByRole("textbox").press("Enter");
      await expect.poll(() => unsaved(page)).toBe("1 unsaved");
      await expect
        .poll(() => row.locator("td.value.unsaved").textContent())
        .toContain("777");
      expect(await row.getByRole("alert").count()).toBe(0);

      // An enumeration, as a select of its labels and raw values.
      const attack = page.locator('table.fields tr[data-field="ua1t"] select');
      expect(await attack.locator("option").allTextContents()).toContain(
        "Pierce (pierce)",
      );
      await attack.selectOption("pierce");
      await expect.poll(() => unsaved(page)).toBe("2 unsaved");

      // The diff of the unsaved changes, in the textconv text.
      await page.getByRole("button", { name: "Diff" }).click();
      const dialog = page.getByRole("dialog", { name: "Diff" });
      await expect
        .poll(() => dialog.locator("pre").textContent())
        .toContain("+  uhpm int = 777");
      await dialog.getByRole("button", { name: "Close" }).click();

      // Ctrl+S saves: the map folder holds the edits, the counter is 0.
      await page.locator("body").press("Control+s");
      await expect.poll(() => unsaved(page)).toBe("0 unsaved");
      await expect
        .poll(() => page.getByRole("status").textContent())
        .toContain("Saved 1 file");
      expect(onDisk("h001", "uhpm")).toBe(777);

      // Undo after the save makes the map dirty again.
      await page.locator("body").press("Control+z");
      await expect.poll(() => unsaved(page)).toBe("1 unsaved");
      await expect.poll(() => attack.inputValue()).not.toBe("pierce");
      await page.close();
    },
    TIMEOUT,
  );
});
