/**
 * Seam 2 for models (#839): the Studio's built page in headless Chromium,
 * driven by Playwright, over the Studio's server on a Map project whose map
 * folder imports a synthetic MDX 1800 model (`support/models.ts`), its
 * texture found nowhere. The tests check that a preview draws, a canvas
 * that is not blank, not what it draws pixel by pixel: the thumbnail a
 * model field shows, which the server then caches; the live preview; the
 * picker; and the art layer's switch.
 *
 * It needs the page built (`pnpm build`) and Chromium installed
 * (`pnpm --filter reforged-studio exec playwright install chromium`, which
 * CI runs). WebGL runs on Chromium's software renderer.
 */
import fs from "node:fs";
import path from "node:path";
import { chromium, type Browser, type Locator, type Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Studio } from "../src/index.js";
import { PAGE_FOLDER } from "../src/server/page.js";
import { cubeModel } from "./support/models.js";
import {
  closeStudios,
  mapProject,
  removeTemporary,
  request,
  start,
} from "./support/studio.js";

// Chromium's launch, each page's load and its software WebGL. Measured 2.0 s
// for the slowest test and 9.2 s for the file, the launch included, with
// pnpm vitest run --project reforged-studio on Linux (WSL 2, 8 threads),
// 2026-11. Kept at 30 s, the budget of a test that starts processes, for the
// windows runner (#658).
const TIMEOUT = 30_000;

/** The imported model, a cube whose one texture is found nowhere. */
const CUBE = "war3mapImported\\Cube.mdx";

let browser: Browser;
let studio: Studio;

beforeAll(async () => {
  if (!fs.existsSync(path.join(PAGE_FOLDER, "index.html"))) {
    throw new Error(
      "The Studio's page is not built: run `pnpm build` before these tests.",
    );
  }
  const project = mapProject();
  fs.mkdirSync(path.join(project.mapFolder, "war3mapImported"));
  fs.writeFileSync(
    path.join(project.mapFolder, "war3mapImported", "Cube.mdx"),
    cubeModel({ texture: "Textures\\Nowhere.blp" }),
  );
  studio = await start(project);
  // The Captain's missile is the imported cube.
  const answer = await request(studio, "/api/edits", {
    json: {
      edits: [
        {
          op: "setField",
          kind: "unit",
          rawcode: "h000",
          field: "ua1m",
          value: CUBE,
        },
      ],
    },
  });
  if (answer.status !== 200) throw new Error(answer.text);
  // Chromium's software WebGL, which a machine without a GPU needs.
  browser = await chromium.launch({ args: ["--enable-unsafe-swiftshader"] });
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

/**
 * The share of an image's or a canvas's pixels that are bright: the
 * placeholder of the cube's missing texture is white, on a dark grey.
 */
async function brightShare(element: Locator): Promise<number> {
  return element.evaluate(
    async (node: HTMLImageElement | HTMLCanvasElement) => {
      if (node instanceof HTMLImageElement) await node.decode();
      const width =
        node instanceof HTMLImageElement ? node.naturalWidth : node.width;
      const height =
        node instanceof HTMLImageElement ? node.naturalHeight : node.height;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (context === null || width === 0 || height === 0) return 0;
      context.drawImage(node, 0, 0);
      const { data } = context.getImageData(0, 0, width, height);
      let bright = 0;
      for (let i = 0; i < data.length; i += 4) {
        if ((data[i] ?? 0) > 128 && (data[i + 1] ?? 0) > 128) bright++;
      }
      return bright / (width * height);
    },
  );
}

describe("the Studio's model previews", () => {
  it(
    "shows a model field's thumbnail, drawn with a placeholder for its missing texture, and caches it",
    async () => {
      const page = await open("/objects/h000?kind=unit");
      const row = page.locator('table.fields tr[data-field="ua1m"]');
      const thumb = row.locator('.model-thumb[data-thumbnail="loaded"]');
      await thumb.waitFor({ timeout: TIMEOUT });
      expect(await brightShare(thumb.locator("img"))).toBeGreaterThan(0.05);

      const cached = await request(
        studio,
        `/api/thumbnails?path=${encodeURIComponent(CUBE)}&layer=hd`,
      );
      expect(cached.status).toBe(200);
      expect(cached.headers["content-type"]).toBe("image/png");
      await page.close();
    },
    TIMEOUT,
  );

  it(
    "draws the live preview of a model field on a click",
    async () => {
      const page = await open("/objects/h000?kind=unit");
      const row = page.locator('table.fields tr[data-field="ua1m"]');
      await row.locator(".model-thumb").first().click();
      const dialog = page.getByRole("dialog", { name: "Model preview" });
      const canvas = dialog.locator('canvas[data-state="drawn"]');
      await canvas.waitFor({ timeout: TIMEOUT });
      // A few frames of the animation.
      await page.waitForTimeout(200);
      expect(await brightShare(canvas)).toBeGreaterThan(0.05);
      await page.close();
    },
    TIMEOUT,
  );

  it(
    "finds the map's model in the picker, previews it, and sets the field to it",
    async () => {
      const page = await open("/objects/h001?kind=unit");
      const row = page.locator('table.fields tr[data-field="ua1m"]');
      await row.getByRole("button", { name: /^Choose a model for/ }).click();
      const picker = page.getByRole("dialog", { name: "Choose a model" });
      await picker.getByLabel("Search the models").fill("cube");
      const entry = picker.locator(".model-path", { hasText: "Cube.mdx" });
      await entry.waitFor();
      expect(await entry.textContent()).toContain("Imported");
      await entry.click();
      const canvas = picker.locator('canvas[data-state="drawn"]');
      await canvas.waitFor({ timeout: TIMEOUT });
      await picker.getByRole("button", { name: "Use this model" }).click();
      await row.locator("code.raw", { hasText: "Cube.mdx" }).waitFor();
      expect(await page.getByTestId("unsaved-count").textContent()).not.toBe(
        "0 unsaved",
      );
      await page.close();
    },
    TIMEOUT,
  );

  it(
    "switches the art layer for the session from the header",
    async () => {
      const page = await open("/objects/h000?kind=unit");
      const layers = page.getByRole("group", { name: "Art layer" });
      const hd = layers.getByRole("button", { name: "HD" });
      await hd.waitFor();
      expect(await hd.getAttribute("aria-pressed")).toBe("true");
      await layers.getByRole("button", { name: "SD" }).click();
      await layers
        .locator('button[aria-pressed="true"]', { hasText: "SD" })
        .waitFor();
      const session = await request(studio, "/api/session");
      expect((session.body as { artLayer: string }).artLayer).toBe("sd");
      await layers.getByRole("button", { name: "HD" }).click();
      await layers
        .locator('button[aria-pressed="true"]', { hasText: "HD" })
        .waitFor();
      await page.close();
    },
    TIMEOUT,
  );
});
