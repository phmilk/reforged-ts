/**
 * Seam 2 for bulk editing in the Studio (#836): the built page in headless
 * Chromium, driven by Playwright, over the Studio's server on a Map project
 * of each test. It holds the wiring: the Table mode with its toggles, a
 * cell edited, a column filled as one undo step, and a field multiplied on
 * the objects Ctrl+clicked in the tree.
 *
 * It needs the page built (`pnpm build`) and Chromium installed, as
 * `page.test.ts` does.
 */
import fs from "node:fs";
import path from "node:path";
import { chromium, type Browser, type Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PAGE_FOLDER } from "../src/server/page.js";
import {
  closeStudios,
  mapProject,
  removeTemporary,
  request,
  start,
} from "./support/studio.js";

// Chromium's launch and the flows' requests. Measured 3.2 s for the file,
// the launch included, with pnpm vitest run --project reforged-studio on
// Linux (WSL 2, 8 threads), 2026-11. Kept at 30 s, as page-editing.test.ts,
// for the windows runner (#658).
const TIMEOUT = 30_000;

let browser: Browser;

beforeAll(async () => {
  if (!fs.existsSync(path.join(PAGE_FOLDER, "index.html"))) {
    throw new Error(
      "The Studio's page is not built: run `pnpm build` before these tests.",
    );
  }
  browser = await chromium.launch();
}, TIMEOUT);

afterAll(async () => {
  await browser.close();
  await closeStudios();
  removeTemporary();
});

/** A new page on a path of a Studio started on a Map project of its own. */
async function open(pathname: string): Promise<Page> {
  const studio = await start(mapProject());
  const page = await browser.newPage();
  await page.goto(studio.url + pathname);
  return page;
}

/** The unsaved changes the counter shows. */
async function unsaved(page: Page): Promise<string> {
  return ((await page.getByTestId("unsaved-count").textContent()) ?? "").trim();
}

describe("bulk editing in the Studio's page", () => {
  it(
    "shows a kind as a table, edits a cell and fills a column as one undo step",
    async () => {
      const page = await open("/objects");
      await page.getByRole("button", { name: "Table mode" }).click();
      const table = page.getByRole("table", { name: "Objects as a table" });
      await table.waitFor();

      // The map's objects, and the one column they change.
      expect(
        await table
          .locator("tbody tr")
          .evaluateAll((rows) =>
            rows.map((row) => row.getAttribute("data-rawcode")),
          ),
      ).toEqual(["h000", "h001", "hfoo"]);
      expect(await table.locator("thead th[data-field]").count()).toBe(1);

      // Every field with its toggle.
      await page.getByLabel("Show every field").check();
      const hitPoints = table.locator('thead th[data-field="uhpm"]');
      await hitPoints.waitFor();

      // A cell edited on a click.
      await table
        .getByRole("button", {
          name: "Edit Stats - Hit Points Maximum (Base) of h000",
        })
        .click();
      await table
        .getByRole("textbox", {
          name: "Stats - Hit Points Maximum (Base) of h000",
        })
        .fill("600");
      await page.keyboard.press("Enter");
      await expect.poll(() => unsaved(page)).toBe("1 unsaved");
      await expect
        .poll(() =>
          table
            .locator('tr[data-rawcode="h000"] td.unsaved[data-field="uhpm"]')
            .textContent(),
        )
        .toContain("600");

      // The column filled: one step on the three rows.
      await hitPoints
        .getByRole("button", {
          name: "Fill Stats - Hit Points Maximum (Base)",
        })
        .click();
      const dialog = page.getByRole("dialog", { name: "Bulk edit" });
      await dialog.getByLabel("Value").fill("500");
      await dialog.getByRole("button", { name: "Apply" }).click();
      await expect.poll(() => unsaved(page)).toBe("3 unsaved");
      await expect
        .poll(() =>
          table
            .locator('td.unsaved[data-field="uhpm"] .display')
            .allTextContents(),
        )
        .toEqual(["500", "500", "500"]);

      // One undo takes the fill back, the cell's edit stays.
      await page.locator("body").press("Control+z");
      await expect.poll(() => unsaved(page)).toBe("1 unsaved");
      await page.close();
    },
    TIMEOUT,
  );

  it(
    "counts the table's objects and fields, one in the singular",
    async () => {
      const studio = await start(mapProject());
      // The map's Custom ability deleted: its modified Built-in one is left.
      const deleted = await request(studio, "/api/delete", {
        json: { kind: "ability", rawcode: "A000" },
      });
      expect(deleted.status).toBe(200);
      const page = await browser.newPage();
      await page.goto(studio.url + "/objects");
      await page.getByRole("button", { name: "Table mode" }).click();
      const count = page.getByTestId("table-count");
      await expect.poll(() => count.textContent()).toBe("3 objects · 1 field");

      await page.getByRole("tab", { name: "Abilities" }).click();
      await expect.poll(() => count.textContent()).toMatch(/^1 object · /);
      await page.close();
    },
    TIMEOUT,
  );

  it(
    "multiplies a field on the objects Ctrl+clicked in the tree",
    async () => {
      const page = await open("/objects");
      const tree = page.getByRole("list", { name: "Objects" });
      await tree.locator('[data-rawcode="h000"]').click({
        modifiers: ["ControlOrMeta"],
      });
      await tree.locator('[data-rawcode="hfoo"]').click({
        modifiers: ["ControlOrMeta"],
      });
      await expect
        .poll(() => page.getByTestId("bulk-bar").textContent())
        .toContain("2 selected");

      await page.getByRole("button", { name: "Edit a field…" }).click();
      const dialog = page.getByRole("dialog", { name: "Bulk edit" });
      await dialog
        .getByLabel("Field")
        .selectOption({ label: "Stats - Hit Points Maximum (Base) · uhpm" });
      await dialog.getByLabel("Multiply by").check();
      await dialog.getByLabel("Number").fill("2");
      await dialog.getByRole("button", { name: "Apply" }).click();
      await expect.poll(() => unsaved(page)).toBe("2 unsaved");
      await expect
        .poll(() => page.getByRole("status").textContent())
        .toContain("Edited 2 objects as one step");

      // The Footman's 420 doubled, in its field table.
      await tree.locator('[data-rawcode="hfoo"]').click();
      await expect
        .poll(() =>
          page
            .locator('table.fields tr[data-field="uhpm"] td.value.unsaved')
            .textContent(),
        )
        .toContain("840");
      await page.close();
    },
    TIMEOUT,
  );
});
