/**
 * Seam 2 for the turns with the World Editor (#837): the built page in
 * headless Chromium, driven by Playwright, over the Studio's server on a
 * Map project of each test. It holds the wiring: the banner "Reload and
 * keep my edits on top" after a change on disk under unsaved edits, the
 * conflicts dialog and a side chosen, and the banner of the fields a World
 * Editor save put back, with "Show" and "Apply them again".
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
  request,
  start,
  type Project,
} from "./support/studio.js";

// Chromium's launch, the watch's one-second polls and the flows' requests.
// Measured 4.6 s for the file, the launch included, with pnpm vitest run
// --project reforged-studio on Linux (WSL 2, 8 threads), 2026-11. Kept at
// 30 s, as page-editing.test.ts, for the windows runner (#658).
const TIMEOUT = 30_000;

/**
 * How long a poll waits for what the watch reads: its one-second interval,
 * then the read of the map folder, on a loaded runner (`expect.poll`'s
 * default, one second, misses it under the whole suite).
 */
const WATCH_TIMEOUT = 10_000;

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

/** A Studio on a Map project of its own, and a page on one of its paths. */
async function open(
  pathname: string,
): Promise<{ project: Project; studio: Studio; page: Page }> {
  const project = mapProject();
  const studio = await start(project);
  const page = await browser.newPage();
  await page.goto(studio.url + pathname);
  return { project, studio, page };
}

/** The unsaved changes the counter shows. */
async function unsaved(page: Page): Promise<string> {
  return ((await page.getByTestId("unsaved-count").textContent()) ?? "").trim();
}

/** Sets `uhpm` of `h001` through the API, as another tab of the page would. */
async function setHitPoints(studio: Studio, value: number): Promise<void> {
  const answer = await request(studio, "/api/edits", {
    json: {
      edits: [
        { op: "setField", kind: "unit", rawcode: "h001", field: "uhpm", value },
      ],
    },
  });
  expect(answer.status).toBe(200);
}

describe("turns with the World Editor in the Studio's page", () => {
  it(
    "offers to reload with the edits on top after a change on disk, and lists the conflict to choose",
    async () => {
      const { project, studio, page } = await open("/objects/h001?kind=unit");
      const row = page.locator('table.fields tr[data-field="uhpm"]');
      await row.waitFor();
      await setHitPoints(studio, 700);

      // Another editor saves the same field.
      const other = openObjectData(project.mapFolder, {
        projectRoot: project.root,
      });
      other.setField({ kind: "unit", rawcode: "h001", field: "uhpm" }, 800);
      other.save(undefined, { worldEditorCheck: false });

      const banner = page.getByTestId("disk-changed");
      await banner
        .getByRole("button", { name: "Reload and keep my edits on top" })
        .click();
      const dialog = page.getByRole("dialog", { name: "Conflicts" });
      await expect
        .poll(() => dialog.locator("tbody tr").textContent())
        .toContain("h001 uhpm");
      expect(await dialog.locator("tbody tr").textContent()).toContain("800");
      await expect
        .poll(() => page.getByTestId("conflicts").textContent())
        .toContain("1 field changed both here and on disk");

      await dialog.getByRole("radio").nth(1).check();
      await dialog.getByRole("button", { name: "Apply the choices" }).click();
      await expect.poll(() => dialog.count()).toBe(0);
      expect(await page.getByTestId("conflicts").count()).toBe(0);
      await expect
        .poll(() => row.locator("td.value").first().textContent())
        .toContain("800");
      await expect.poll(() => unsaved(page)).toBe("0 unsaved");
      // The merge's own event raised no banner of a change read quietly.
      expect(await page.getByTestId("disk-changed").count()).toBe(0);
      expect(await page.getByTestId("reloaded").count()).toBe(0);
      await page.close();
    },
    TIMEOUT,
  );

  it(
    "names the fields a World Editor save put back, shows them and applies them again",
    async () => {
      const { project, studio, page } = await open("/objects/h001?kind=unit");
      await page.locator('table.fields tr[data-field="uhpm"]').waitFor();
      const w3u = path.join(project.mapFolder, "war3map.w3u");
      const stale = fs.readFileSync(w3u);
      await setHitPoints(studio, 700);
      expect((await request(studio, "/api/save", { json: {} })).status).toBe(
        200,
      );

      // A World Editor that never reloaded saves its own war3map.w3u.
      fs.writeFileSync(w3u, stale);
      const banner = page.getByTestId("put-back");
      await expect
        .poll(() => banner.textContent(), { timeout: WATCH_TIMEOUT })
        .toContain("put back 1 field the Studio had saved: h001 uhpm");

      await banner.getByRole("button", { name: "Show" }).click();
      const dialog = page.getByRole("dialog", {
        name: "Put back by the World Editor",
      });
      expect(await dialog.locator("tbody tr").textContent()).toContain("700");
      await dialog.getByRole("button", { name: "Apply them again" }).click();
      await expect.poll(() => unsaved(page)).toBe("1 unsaved");
      expect(await banner.count()).toBe(0);
      expect(await dialog.count()).toBe(0);
      await page.close();
    },
    TIMEOUT,
  );

  it(
    "shows what a change on disk read quietly brought, from its banner",
    async () => {
      const { project, page } = await open("/objects/h001?kind=unit");
      await page.locator('table.fields tr[data-field="uhpm"]').waitFor();

      // Another editor saves with no unsaved edit in the Studio.
      const other = openObjectData(project.mapFolder, {
        projectRoot: project.root,
      });
      other.setField({ kind: "unit", rawcode: "h001", field: "uhpm" }, 800);
      other.save(undefined, { worldEditorCheck: false });

      const banner = page.getByTestId("reloaded");
      await banner
        .getByRole("button", { name: "Show what changed" })
        .click({ timeout: WATCH_TIMEOUT });
      const dialog = page.getByRole("dialog", { name: "Diff" });
      expect(
        await dialog
          .getByRole("tab", { name: "Last reload from disk" })
          .getAttribute("aria-selected"),
      ).toBe("true");
      await expect
        .poll(() => dialog.locator(".diff-file").textContent())
        .toContain("+  uhpm int = 800");
      await page.close();
    },
    TIMEOUT,
  );
});
