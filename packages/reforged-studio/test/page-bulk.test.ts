/**
 * Seam 2 for bulk editing in the Studio (#836): the built page in headless
 * Chromium, driven by Playwright, over the Studio's server on a Map project
 * of each test. It holds the wiring: the Table mode with its toggles, a
 * cell edited, a column filled as one undo step, and a field multiplied on
 * the objects Ctrl+clicked in the tree, the open object among them (#891).
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

/**
 * A new page on a path of a Studio started on a Map project of its own,
 * `files` under its root.
 */
async function open(
  pathname: string,
  files: Readonly<Record<string, string>> = {},
): Promise<Page> {
  const studio = await start(mapProject(files));
  const page = await browser.newPage();
  await page.goto(studio.url + pathname);
  return page;
}

/** The unsaved changes the counter shows. */
async function unsaved(page: Page): Promise<string> {
  return ((await page.getByTestId("unsaved-count").textContent()) ?? "").trim();
}

/** Ctrl+clicks (Cmd+clicks) an object of the tree. */
async function ctrlClick(page: Page, rawcode: string): Promise<void> {
  await page
    .getByRole("list", { name: "Objects" })
    .locator(`[data-rawcode="${rawcode}"]`)
    .click({ modifiers: ["ControlOrMeta"] });
}

/** Waits until the bulk bar reads `count` selected. */
async function expectSelected(page: Page, count: number): Promise<void> {
  await expect
    .poll(() => page.getByTestId("bulk-bar").textContent())
    .toContain(`${String(count)} selected`);
}

/** Whether a tree item shows as marked, by its `aria-pressed`. */
async function pressed(page: Page, rawcode: string): Promise<string | null> {
  return page
    .getByRole("list", { name: "Objects" })
    .locator(`[data-rawcode="${rawcode}"]`)
    .getAttribute("aria-pressed");
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
      await ctrlClick(page, "h000");
      await ctrlClick(page, "hfoo");
      await expectSelected(page, 2);

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

  it(
    "marks the open object with the first object Ctrl+clicked, and unmarks it alone",
    async () => {
      const page = await open("/objects/h000");
      await page.locator(".object-header").waitFor();
      await ctrlClick(page, "hfoo");
      await expectSelected(page, 2);
      expect(await pressed(page, "h000")).toBe("true");
      expect(await pressed(page, "hfoo")).toBe("true");

      // A Ctrl+click on the open object, marked, unmarks it only.
      await ctrlClick(page, "h000");
      await expectSelected(page, 1);
      expect(await pressed(page, "h000")).toBe("false");
      expect(await pressed(page, "hfoo")).toBe("true");

      // Cleared, a Ctrl+click on the open object marks it alone.
      await page.getByRole("button", { name: "Clear" }).click();
      await ctrlClick(page, "h000");
      await expectSelected(page, 1);
      expect(await pressed(page, "h000")).toBe("true");
      expect(await pressed(page, "hfoo")).toBe("false");
      await page.close();
    },
    TIMEOUT,
  );

  it(
    "edits the open object and the one Ctrl+clicked as one undo step",
    async () => {
      const page = await open("/objects/h000");
      await page.locator(".object-header").waitFor();
      await ctrlClick(page, "hfoo");
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

      // One undo takes both back.
      await page.locator("body").press("Control+z");
      await expect.poll(() => unsaved(page)).toBe("0 unsaved");
      await page.close();
    },
    TIMEOUT,
  );

  it(
    "leaves an open Object definition out of the marks",
    async () => {
      const page = await open("/objects/h002", {
        "src/objects/units.ts": `import { defineUnit } from "reforged-map/objects";

export const Sergeant = defineUnit({
  rawcode: "h002",
  base: FourCC("hfoo"),
  fields: { unam: "Sergeant", uhpm: 500 },
});
`,
      });
      await page.locator(".object-header .chip.definition").waitFor();
      await ctrlClick(page, "hfoo");
      await expectSelected(page, 1);
      expect(await pressed(page, "hfoo")).toBe("true");
      expect(await pressed(page, "h002")).toBeNull();
      await page.close();
    },
    TIMEOUT,
  );
});
