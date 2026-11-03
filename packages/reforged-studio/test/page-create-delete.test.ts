/**
 * Seam 2 for creating and deleting objects (#835): the built page in
 * headless Chromium, driven by Playwright, over the Studio's server on its
 * own Map project. It holds the wiring: an unknown Rawcode's "Create with
 * this Rawcode", the live check naming what holds a taken Rawcode, the new
 * object selected, and the delete confirmation with its placement count.
 *
 * It needs the page built (`pnpm build`) and Chromium installed, as
 * `page.test.ts` does.
 */
import fs from "node:fs";
import path from "node:path";
import { chromium, type Browser, type Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PAGE_FOLDER } from "../src/server/page.js";
import type { Studio } from "../src/index.js";
import { unitsFile } from "./support/placements.js";
import {
  closeStudios,
  mapProject,
  removeTemporary,
  start,
} from "./support/studio.js";

// Chromium's launch and the flows' requests. Measured 6.6 s for the file,
// the launch included, with pnpm vitest run --project reforged-studio on
// Linux (WSL 2, 8 threads), 2026-10. Kept at 30 s, as page.test.ts, for the
// windows runner (#658).
const TIMEOUT = 30_000;

let browser: Browser;
let studio: Studio;

beforeAll(async () => {
  if (!fs.existsSync(path.join(PAGE_FOLDER, "index.html"))) {
    throw new Error(
      "The Studio's page is not built: run `pnpm build` before these tests.",
    );
  }
  const project = mapProject();
  fs.writeFileSync(
    path.join(project.mapFolder, "war3mapUnits.doo"),
    unitsFile([{ rawcode: "h000" }, { rawcode: "h000" }, { rawcode: "sloc" }]),
  );
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

describe("creating and deleting in the Studio's page", () => {
  it(
    "creates an object with an unknown Rawcode, checking a taken one live",
    async () => {
      const page = await open("/objects/hQ07");
      await page
        .getByRole("button", { name: "Create with this Rawcode" })
        .click();
      const dialog = page.getByRole("dialog", { name: "New object" });
      const check = dialog.getByTestId("rawcode-check");
      await expect
        .poll(() => check.textContent())
        .toBe("hQ07 is free in all seven Object kinds.");

      // A taken Rawcode: the check names what holds it, and Create waits.
      await dialog.getByRole("textbox", { name: "Rawcode" }).fill("h000");
      await expect
        .poll(() => check.textContent())
        .toContain("h000 is taken by the Custom unit");
      expect(
        await dialog.getByRole("button", { name: "Create" }).isDisabled(),
      ).toBe(true);

      await dialog.getByRole("textbox", { name: "Rawcode" }).fill("hQ07");
      await dialog.getByLabel("Based on").selectOption("hfoo");
      await expect.poll(() => check.textContent()).toContain("is free");
      await dialog.getByRole("button", { name: "Create" }).click();

      await expect
        .poll(() => page.locator(".object-header h2").textContent())
        .toContain("hQ07");
      expect(page.url()).toContain("/objects/hQ07?kind=unit");
      await expect.poll(() => unsaved(page)).toBe("1 unsaved");
      await page.close();
    },
    TIMEOUT,
  );

  it(
    "confirms a delete with the placement count, then deletes",
    async () => {
      const page = await open("/objects/h000?kind=unit");
      await page.getByRole("button", { name: "Delete" }).click();
      const dialog = page.getByRole("dialog", { name: "Delete" });
      await expect
        .poll(() => dialog.getByTestId("deletion-message").textContent())
        .toContain(
          "It is placed 2 times on the terrain, in war3mapUnits.doo. The Studio leaves those placements there: the game already skips them, and the World Editor drops them without asking at its next save.",
        );
      const before = await unsaved(page);
      await dialog.getByRole("button", { name: "Delete" }).click();

      await expect.poll(() => unsaved(page)).not.toBe(before);
      await expect.poll(() => page.url()).toMatch(/\/objects$/);
      expect(
        await page
          .getByRole("status")
          .filter({ hasText: "Deleted h000" })
          .count(),
      ).toBe(1);
      await page.close();
    },
    TIMEOUT,
  );
});
