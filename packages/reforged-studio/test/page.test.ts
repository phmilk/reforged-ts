/**
 * Seam 2, the Studio's page in a browser, end to end (#832): the page the
 * package's build writes, in headless Chromium driven by Playwright, over
 * the Studio's server on a Map project whose map folder is a copy of
 * `reforged-map`'s World Editor fixture, with a synthetic install. The
 * tests hold the wiring of the Objects area to the API, not every rule
 * seam 1 covers: what an author sees after opening a link, a click or a
 * key.
 *
 * It needs the page built (`pnpm build`) and Chromium installed
 * (`pnpm --filter reforged-studio exec playwright install chromium`, which
 * CI runs).
 */
import fs from "node:fs";
import path from "node:path";
import { chromium, type Browser, type Locator, type Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PAGE_FOLDER } from "../src/server/page.js";
import type { Studio } from "../src/index.js";
import { IMPORTED_ICON } from "./support/images.js";
import {
  closeStudios,
  mapProject,
  removeTemporary,
  request,
  start,
} from "./support/studio.js";

// Chromium's launch and each page's load. Measured 0.9 s for the slowest
// test and 4.2 s for the file, the launch included, with pnpm vitest run
// --project reforged-studio on Linux (WSL 2, 8 threads), 2026-10. Kept at
// 30 s, the budget of a test that starts processes, for the windows runner
// (#658).
const TIMEOUT = 30_000;

let browser: Browser;
let studio: Studio;

beforeAll(async () => {
  if (!fs.existsSync(path.join(PAGE_FOLDER, "index.html"))) {
    throw new Error(
      "The Studio's page is not built: run `pnpm build` before these tests.",
    );
  }
  const project = mapProject({
    "src/objects/units.ts": `import { defineUnit } from "reforged-map/objects";

export const Sergeant = defineUnit({
  rawcode: "h002",
  base: FourCC("hfoo"),
  fields: { unam: "Sergeant", uhpm: 500 },
});
`,
  });
  fs.mkdirSync(path.join(project.mapFolder, "war3mapImported"));
  fs.writeFileSync(
    path.join(project.mapFolder, "war3mapImported", "BTNCaptain.blp"),
    IMPORTED_ICON,
  );
  studio = await start(project);
  // The Captain's icon is the map's import; the Chevalier's is found nowhere.
  const answer = await request(studio, "/api/edits", {
    json: {
      edits: [
        {
          op: "setField",
          kind: "unit",
          rawcode: "h000",
          field: "uico",
          value: "war3mapImported\\BTNCaptain.blp",
        },
        {
          op: "setField",
          kind: "unit",
          rawcode: "h001",
          field: "uico",
          value: "war3mapImported\\BTNNowhere.blp",
        },
      ],
    },
  });
  if (answer.status !== 200) throw new Error(answer.text);
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

/** A locator's text, once it is shown, its spaces collapsed: what it says, whatever its case is drawn in. */
async function textOf(locator: Locator): Promise<string> {
  await locator.waitFor();
  return ((await locator.textContent()) ?? "").replace(/\s+/g, " ").trim();
}

/** The colour of an icon's top-left pixel, `[red, green, blue]`, once it is drawn. */
async function pixelOf(icon: Locator): Promise<number[]> {
  const image = icon.locator("img");
  await image.waitFor();
  return image.evaluate(async (element: HTMLImageElement) => {
    await element.decode();
    const canvas = document.createElement("canvas");
    canvas.width = element.naturalWidth;
    canvas.height = element.naturalHeight;
    const context = canvas.getContext("2d");
    if (context === null) return [];
    context.drawImage(element, 0, 0);
    return [...context.getImageData(0, 0, 1, 1).data.slice(0, 3)];
  });
}

describe("the Studio's page, /objects/<rawcode>", () => {
  it(
    "selects the object in its tab, with its origin chip, its field table of ids, display and raw values, and what differs from its base",
    async () => {
      const page = await open("/objects/hfoo");

      const tab = page.getByRole("tab", { name: "Units" });
      await tab.waitFor();
      expect(await tab.getAttribute("aria-selected")).toBe("true");
      const selected = page.locator('.tree [aria-current="true"]');
      expect(await textOf(selected)).toContain("Militia");
      expect(await selected.getAttribute("data-rawcode")).toBe("hfoo");

      const header = page.locator(".object-header");
      expect(await textOf(header)).toContain("Militia");
      expect(await textOf(header.locator(".chip.modified"))).toBe(
        "Modified Built-in",
      );

      const name = page.locator('table.fields tr[data-field="unam"]');
      const nameText = await textOf(name);
      expect(nameText).toContain("Text - Name");
      expect(nameText).toContain("unam");
      expect(nameText).toContain("Militia");
      expect(nameText).toMatch(/TRIGSTR_\d+/);
      const attack = await textOf(
        page.locator('table.fields tr[data-field="ua1t"]'),
      );
      expect(attack).toContain("ua1t");
      expect(attack).toContain("Normal");
      expect(attack).toContain("normal");

      const differs = page.getByRole("region", { name: "Differs from base" });
      expect(await textOf(differs.locator("h3"))).toBe(
        "Differs from Footman (hfoo) (1)",
      );
      const changed = await textOf(differs.locator('tr[data-field="unam"]'));
      expect(changed).toContain("Militia");
      expect(changed).toContain("was Footman");
      await page.close();
    },
    TIMEOUT,
  );

  it(
    "groups the tree by origin, then the Built-in objects by the World Editor's grouping",
    async () => {
      const page = await open("/objects/hfoo");

      const headings = page.locator(".tree > .group > .group-heading");
      await headings.first().waitFor();
      const texts = await headings.allTextContents();
      expect(texts.map((text) => text.replace(/^. | \(\d+\)$/g, ""))).toEqual([
        "Custom objects",
        "Object definitions",
        "Modified Built-in objects",
        "Built-in objects",
      ]);
      expect(
        await page.locator(".tree .item").allInnerTexts(),
      ).not.toContainEqual(expect.stringContaining("Paladin"));

      for (const group of ["Human", "Melee", "Heroes"]) {
        await page
          .locator(".group-heading", { hasText: new RegExp(`^. ${group} `) })
          .click();
      }
      expect(
        await textOf(page.locator('.tree .item[data-rawcode="Hpal"]')),
      ).toContain("Paladin");
      await page.close();
    },
    TIMEOUT,
  );

  it(
    "shows an Object definition read-only, with its lock and its file",
    async () => {
      const page = await open("/objects/h002");

      const chip = page.locator(".object-header .chip.definition");
      expect(await textOf(chip)).toBe(
        "🔒 Object definition · src/objects/units.ts",
      );
      expect(await textOf(page.locator(".object-header"))).toContain(
        "Read-only: defined in src/objects/units.ts, line 4.",
      );
      expect(
        await textOf(page.locator('.tree .item[data-rawcode="h002"]')),
      ).toContain("🔒");
      await page.close();
    },
    TIMEOUT,
  );

  it(
    "searches all seven Object kinds by name or Rawcode with Ctrl+K",
    async () => {
      const page = await open("/objects/hfoo");
      await page.locator(".object-header").waitFor();

      await page.keyboard.press("Control+K");
      const search = page.getByRole("dialog", { name: "Search" });
      await search.locator("input").fill("captain");
      await search.locator('[data-rawcode="D000"]').waitFor();
      const kinds = await search
        .locator(".results button")
        .evaluateAll((buttons) =>
          buttons
            .filter((button) => !button.textContent.includes("Built-in"))
            .map(
              (button) =>
                `${button.getAttribute("data-kind") ?? ""} ${button.getAttribute("data-rawcode") ?? ""}`,
            ),
        );
      expect(kinds).toEqual(["unit h000", "item I000", "doodad D000"]);

      await search.locator('[data-rawcode="I000"]').click();
      expect(await textOf(page.locator(".object-header h2"))).toContain(
        "Captain's Claws",
      );
      expect(
        await page
          .getByRole("tab", { name: "Items" })
          .getAttribute("aria-selected"),
      ).toBe("true");

      await page.keyboard.press("Control+K");
      await search.locator("input").fill("B000");
      await search.locator('[data-kind="destructable"]').waitFor();
      expect(await search.locator('[data-rawcode="B000"]').count()).toBe(2);
      await page.keyboard.press("Enter");
      expect(await textOf(page.locator(".object-header h2"))).toContain(
        "Holy Fire",
      );
      expect(await textOf(page.locator(".object-header .chip.warn"))).toContain(
        "B000 is also a destructable",
      );
      await page.close();
    },
    TIMEOUT,
  );

  it(
    "groups the rows of a field of levels, collapsible",
    async () => {
      const page = await open("/objects/A000");

      const group = page.locator('tr.levels[data-field="acdn"]');
      expect(await textOf(group)).toContain("3 levels");
      const levels = page.locator('tr.level[data-field="acdn"]');
      expect(await levels.allInnerTexts()).toEqual([
        expect.stringContaining("Level 1"),
        expect.stringContaining("Level 2"),
        expect.stringContaining("Level 3"),
      ]);

      await group.getByRole("button").click();
      expect(await levels.count()).toBe(0);
      await group.getByRole("button").click();
      expect(await levels.count()).toBe(3);
      await page.close();
    },
    TIMEOUT,
  );

  it(
    "compares objects of the same kind as extra columns, and hides the fields at their base's value",
    async () => {
      const page = await open("/objects/h000");
      await page.getByRole("button", { name: "Compare" }).click();
      await page.locator('.tree .item[data-rawcode="hfoo"]').click();

      const columns = page.locator("table.fields thead th");
      await page
        .locator("table.fields thead th", { hasText: "h000" })
        .waitFor();
      expect(await columns.allInnerTexts()).toEqual([
        "Field",
        "Id",
        "Value",
        expect.stringContaining("Captain h000"),
      ]);
      const name = await page
        .locator('table.fields tr[data-field="unam"] td.value')
        .allInnerTexts();
      expect(name).toEqual([
        expect.stringContaining("Militia"),
        expect.stringContaining("Captain"),
      ]);

      const hitPoints = page.locator('table.fields tr[data-field="uhpm"]');
      expect(await hitPoints.count()).toBe(1);
      await page.getByLabel("Hide fields at their base's value").check();
      expect(await hitPoints.count()).toBe(0);
      expect(
        await page.locator('table.fields tr[data-field="unam"]').count(),
      ).toBe(1);

      await page.getByRole("button", { name: "Stop comparing h000" }).click();
      await page
        .locator("table.fields thead th", { hasText: "h000" })
        .waitFor({ state: "detached" });
      await page.close();
    },
    TIMEOUT,
  );

  it(
    "names the map's Game data set, hides the objects outside it, and shows them marked on request",
    async () => {
      const page = await open("/objects/Asa2");

      expect(await textOf(page.locator(".game-data-set"))).toContain(
        "Melee (Forsaken Kingdom)",
      );
      await page.locator(".object-header").waitFor();
      expect(
        await page.locator('.tree .item[data-rawcode="Asa2"]').count(),
      ).toBe(0);

      await page.getByLabel("Show objects outside it").check();
      const pillage = page.locator('.tree .item[data-rawcode="Asa2"]');
      expect(await textOf(pillage)).toContain(
        "not in this map's Game data set",
      );
      await page.close();
    },
    TIMEOUT,
  );

  it(
    "shows icons from the install and from the map's imports, and a placeholder for a missing one",
    async () => {
      const page = await open("/objects/hfoo");

      // The Footman's icon is the install's DDS, red; the Captain's the map's BLP, blue.
      const header = page.locator(".object-header .icon");
      expect(await pixelOf(header)).toEqual([255, 0, 0]);
      expect(
        await pixelOf(page.locator('table.fields tr[data-field="uico"] .icon')),
      ).toEqual([255, 0, 0]);
      expect(
        await pixelOf(page.locator('.tree .item[data-rawcode="h000"] .icon')),
      ).toEqual([0, 0, 255]);

      const missing = page.locator(
        '.tree .item[data-rawcode="h001"] .icon[data-icon="missing"]',
      );
      await missing.waitFor();
      expect(await missing.innerText()).not.toBe("");
      expect(await missing.locator("img").count()).toBe(0);
      await page.close();
    },
    TIMEOUT,
  );

  it(
    "asks which object a Rawcode two kinds share names, saying FourCC has no typed overload for it",
    async () => {
      const page = await open("/objects/B000");

      const notice = await textOf(page.locator(".notice"));
      expect(notice).toContain("B000 names an object of 2 Object kinds");
      expect(notice).toContain('FourCC("B000") has no typed overload');
      const choices = page.locator(".choices button");
      expect(await choices.allInnerTexts()).toEqual([
        expect.stringContaining("a buff"),
        expect.stringContaining("a destructable"),
      ]);

      await choices.nth(1).click();
      expect(await textOf(page.locator(".object-header h2"))).toContain("Gate");
      expect(new URL(page.url()).search).toBe("?kind=destructable");
      await page.close();
    },
    TIMEOUT,
  );

  it(
    "says an unknown Rawcode is neither in this map nor Built-in, with the lint rule's suggestions",
    async () => {
      const page = await open("/objects/h00Z");

      expect(await textOf(page.locator(".notice"))).toContain(
        "h00Z is neither in this map nor Built-in.",
      );
      const captain = page.locator(".choices button", { hasText: "h000" });
      expect(await textOf(captain)).toContain("Captain");
      await captain.click();
      expect(await textOf(page.locator(".object-header h2"))).toContain(
        "Captain",
      );
      await page.close();
    },
    TIMEOUT,
  );
});
