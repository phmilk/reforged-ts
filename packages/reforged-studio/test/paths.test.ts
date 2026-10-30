/**
 * Seam 3, path resolution: `createPathResolver` on a synthetic storage of
 * the three art layers and a map folder the tests write in a temporary
 * folder, with no byte of Blizzard's. The tests assert where each path
 * resolves, and that a path found nowhere is reported missing.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createPathResolver,
  openStorage,
  type ArtLayer,
  type ResolvedPath,
} from "../src/index.js";
import { tempDir, writeStorage } from "./support/casc.js";

const FILES: Readonly<Record<string, string>> = {
  // A model in every layer.
  "War3.w3mod:Units/Human/Footman/Footman.mdx": "base footman",
  "War3.w3mod:_HD.w3mod:Units/Human/Footman/Footman.mdx": "hd footman",
  "War3.w3mod:_DE.w3mod:Units/Human/Footman/Footman.mdx": "de footman",
  // A model of the base layer alone.
  "War3.w3mod:Units/Critters/Sheep/Sheep.mdx": "base sheep",
  // An icon written `.blp` and stored as `.dds`, as 3.0 stores them.
  "War3.w3mod:ReplaceableTextures/CommandButtons/BTNFootman.dds": "base icon",
  "War3.w3mod:_HD.w3mod:ReplaceableTextures/CommandButtons/BTNFootman.dds":
    "hd icon",
  // A texture of the base layer still stored as `.blp`.
  "War3.w3mod:Textures/Footman.blp": "base blp",
  // A localized texture: the enUS sub-layer of a layer comes before it.
  "War3.w3mod:UI/Glues/Title.dds": "base title",
  "War3.w3mod:_Locales/enUS.w3mod:UI/Glues/Title.dds": "base enUS title",
  "War3.w3mod:_HD.w3mod:_Locales/enUS.w3mod:UI/Glues/Title.dds":
    "hd enUS title",
  // An alias, its source found nowhere.
  "War3.w3mod:Textures/GenericGlow1.dds": "glow",
  "War3.w3mod:FileAliases.json": JSON.stringify([
    {
      src: "SharedModels/GenericGlow1.blp",
      dest: "Textures/GenericGlow1.blp",
      assetType: "Texture",
    },
  ]),
};

/** A map folder with an import in each of its layers. */
async function mapFolder(): Promise<string> {
  const folder = join(await tempDir("map"), "map.w3m");
  const files: Record<string, string> = {
    "war3mapImported/Hero.mdx": "map hero",
    "_hd.w3mod/war3mapImported/Hero.mdx": "map hd hero",
    "units/human/footman/footman.mdx": "map footman",
    "war3mapImported/Note.mdx": "map note",
    "_Locales/enUS.w3mod/war3mapImported/Note.mdx": "map enUS note",
    "_hd.w3mod/_Locales/enUS.w3mod/war3mapImported/Note.mdx":
      "map hd enUS note",
  };
  for (const [path, content] of Object.entries(files)) {
    await mkdir(dirname(join(folder, path)), { recursive: true });
    await writeFile(join(folder, path), content);
  }
  return folder;
}

async function resolver(artLayer: ArtLayer, withMapFolder = false) {
  const storage = await openStorage(
    (await writeStorage({ files: FILES })).installDir,
  );
  return createPathResolver(storage, {
    artLayer,
    ...(withMapFolder && { mapFolder: await mapFolder() }),
  });
}

/** Where `path` resolves, and the text of what it reads. */
async function found(
  resolve: Awaited<ReturnType<typeof resolver>>,
  path: string,
): Promise<{ from: ResolvedPath["from"]; file: string; text: string }> {
  const result = await resolve.resolve(path);
  if (!result.found) throw new Error(`${path} is missing`);
  return {
    from: result.from,
    file: result.file,
    text: new TextDecoder().decode(await result.read()),
  };
}

describe("createPathResolver", () => {
  it("resolves from the chosen art layer, then the base layer", async () => {
    const hd = await resolver("hd");
    const de = await resolver("de");
    const sd = await resolver("sd");

    expect(await found(hd, "Units\\Human\\Footman\\Footman.mdx")).toEqual({
      from: "storage",
      file: "War3.w3mod:_HD.w3mod:Units/Human/Footman/Footman.mdx",
      text: "hd footman",
    });
    expect((await found(de, "Units/Human/Footman/Footman.mdx")).text).toBe(
      "de footman",
    );
    expect((await found(sd, "Units/Human/Footman/Footman.mdx")).text).toBe(
      "base footman",
    );
    expect((await found(hd, "Units/Critters/Sheep/Sheep.mdx")).file).toBe(
      "War3.w3mod:Units/Critters/Sheep/Sheep.mdx",
    );
  });

  it("reads a model written .mdl, or with no extension, as its .mdx", async () => {
    const sd = await resolver("sd");

    expect((await found(sd, "Units\\Critters\\Sheep\\Sheep.mdl")).text).toBe(
      "base sheep",
    );
    expect((await found(sd, "units\\critters\\sheep\\sheep")).text).toBe(
      "base sheep",
    );
  });

  it("falls back from .blp and .tif to .dds in each layer, the art layer first", async () => {
    const hd = await resolver("hd");
    const sd = await resolver("sd");

    const icon = "ReplaceableTextures\\CommandButtons\\BTNFootman.blp";
    expect((await found(hd, icon)).file).toBe(
      "War3.w3mod:_HD.w3mod:ReplaceableTextures/CommandButtons/BTNFootman.dds",
    );
    expect((await found(sd, icon)).text).toBe("base icon");
    expect(
      (await found(sd, "ReplaceableTextures/CommandButtons/BTNFootman.tif"))
        .text,
    ).toBe("base icon");
    // A .blp the layer holds is read as it is.
    expect((await found(hd, "Textures/Footman.blp")).text).toBe("base blp");
  });

  it("applies FileAliases.json to a path found nowhere, then resolves its destination", async () => {
    const hd = await resolver("hd");

    expect(await found(hd, "SharedModels\\GenericGlow1.blp")).toEqual({
      from: "storage",
      file: "War3.w3mod:Textures/GenericGlow1.dds",
      text: "glow",
    });
  });

  it("resolves from the map folder first, layered like the game", async () => {
    const hd = await resolver("hd", true);
    const sd = await resolver("sd", true);

    const hero = await found(hd, "war3mapImported\\Hero.mdx");
    expect(hero.from).toBe("map");
    expect(hero.text).toBe("map hd hero");
    expect((await found(sd, "war3mapImported\\Hero.mdx")).text).toBe(
      "map hero",
    );
    // Matched without regard to case, before the storage.
    expect((await found(hd, "Units\\Human\\Footman\\Footman.mdx")).text).toBe(
      "map footman",
    );
  });

  it("reads a layer's enUS sub-layer before it, in the map folder and the storage", async () => {
    const hd = await resolver("hd", true);
    const sd = await resolver("sd", true);

    expect((await found(hd, "war3mapImported\\Note.mdx")).text).toBe(
      "map hd enUS note",
    );
    expect((await found(sd, "war3mapImported\\Note.mdx")).text).toBe(
      "map enUS note",
    );
    expect((await found(hd, "UI\\Glues\\Title.blp")).text).toBe(
      "hd enUS title",
    );
    expect((await found(sd, "UI\\Glues\\Title.blp")).text).toBe(
      "base enUS title",
    );
  });

  it("reports a path found nowhere as missing, without throwing", async () => {
    const hd = await resolver("hd", true);

    expect(await hd.resolve("Units\\Nobody\\Nobody.mdx")).toEqual({
      found: false,
      path: "Units/Nobody/Nobody.mdx",
    });
    expect(await hd.resolve("")).toEqual({ found: false, path: "" });
  });
});
