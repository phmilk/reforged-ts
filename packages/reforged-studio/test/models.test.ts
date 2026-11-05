/**
 * Seam 1 for models (#839): the Studio's server through its HTTP API, on a
 * Map project whose map folder is a copy of `reforged-map`'s World Editor
 * fixture and a synthetic install holding a few models. It covers the art
 * layer (the World Editor's preference, the map's Supported Modes, the
 * header's switch), the models' paths the picker searches, and the
 * thumbnail cache.
 */
import fs from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { cubeModel } from "./support/models.js";
import {
  closeStudios,
  makeTempDir,
  mapProject,
  removeTemporary,
  request,
  start,
  syntheticGame,
  type Project,
} from "./support/studio.js";

afterAll(async () => {
  await closeStudios();
  removeTemporary();
});

/** A `WorldEditPreferences.txt` whose `[Misc]` section holds `assetMode`. */
function preferences(assetMode: number): string {
  const file = path.join(makeTempDir("prefs"), "WorldEditPreferences.txt");
  fs.writeFileSync(
    file,
    `[Misc]\r\nassetMode=${String(assetMode)}\r\nhd=1\r\n`,
  );
  return file;
}

/**
 * Sets the Supported Modes of the fixture's `war3map.w3i`, stored between
 * its script language (Lua, 1) and its Game Data Version (Forsaken
 * Kingdom, 2).
 */
function setSupportedModes(project: Project, modes: number): void {
  const file = path.join(project.mapFolder, "war3map.w3i");
  const bytes = fs.readFileSync(file);
  const at = bytes.indexOf(Buffer.from([1, 0, 0, 0, 3, 0, 0, 0, 2, 0, 0, 0]));
  if (at === -1) throw new Error("The fixture's Supported Modes moved.");
  bytes.writeInt32LE(modes, at + 4);
  fs.writeFileSync(file, bytes);
}

/** A PNG's bytes: its signature, then anything. */
const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.from("a thumbnail"),
]);

/** The models of the synthetic install: the Footman in its base and HD layers, a DE-only model, an HD texture. */
const INSTALL_MODELS = {
  "War3.w3mod:Units/Human/Footman/Footman.mdx": cubeModel(),
  "War3.w3mod:_HD.w3mod:Units/Human/Footman/Footman.mdx": cubeModel({
    hd: true,
  }),
  "War3.w3mod:_DE.w3mod:Units/Human/Scarlet/Scarlet.mdx": cubeModel(),
  "War3.w3mod:_HD.w3mod:Textures/Cube.dds": "not a model",
};

describe("the art layer", () => {
  it("defaults to the World Editor's Asset Mode preference, which the session names with the layers the map allows", async () => {
    const project = mapProject();
    setSupportedModes(project, 7);
    const studio = await start(project, {
      worldEditorPreferences: preferences(2),
    });
    const session = await request(studio, "/api/session");
    expect(session.body).toMatchObject({
      artLayer: "de",
      artLayers: ["sd", "hd", "de"],
    });
  });

  it("leaves DE out of a map with the World Editor's default Supported Modes, SD and HD", async () => {
    const studio = await start(mapProject(), {
      worldEditorPreferences: preferences(2),
    });
    const session = await request(studio, "/api/session");
    expect(session.body).toMatchObject({
      artLayer: "sd",
      artLayers: ["sd", "hd"],
    });
  });

  it("is HD when the preference cannot be read", async () => {
    const studio = await start(mapProject());
    const session = await request(studio, "/api/session");
    expect(session.body).toMatchObject({ artLayer: "hd" });
  });

  it("is limited by the map's Supported Modes", async () => {
    const project = mapProject();
    setSupportedModes(project, 2);
    const studio = await start(project, {
      worldEditorPreferences: preferences(0),
    });
    const session = await request(studio, "/api/session");
    expect(session.body).toMatchObject({ artLayer: "hd", artLayers: ["hd"] });

    const refused = await request(studio, "/api/art-layer", {
      json: { artLayer: "sd" },
    });
    expect(refused.status).toBe(409);
    expect(refused.body).toMatchObject({ error: { reason: "not-supported" } });
    const file = await request(
      studio,
      "/api/files?path=ReplaceableTextures/CommandButtons/BTNFootman.blp&layer=sd",
    );
    expect(file.status).toBe(400);
  });

  it("changes for the session, and the files are read in it", async () => {
    const studio = await start(mapProject());
    const icon =
      "/api/files?path=ReplaceableTextures/CommandButtons/BTNFootman.blp";
    // The synthetic install holds the Footman's icon in its HD layer only.
    expect((await request(studio, icon)).status).toBe(200);

    const switched = await request(studio, "/api/art-layer", {
      json: { artLayer: "sd" },
    });
    expect(switched.status).toBe(200);
    expect(switched.body).toEqual({ artLayer: "sd" });
    const session = await request(studio, "/api/session");
    expect(session.body).toMatchObject({ artLayer: "sd" });
    expect((await request(studio, icon)).status).toBe(404);
    expect((await request(studio, `${icon}&layer=hd`)).status).toBe(200);

    const bad = await request(studio, "/api/art-layer", {
      json: { artLayer: "4k" },
    });
    expect(bad.status).toBe(400);
  });
});

describe("the models' paths, /api/models", () => {
  /** A Studio over the synthetic install's models, its map folder importing two. */
  async function modelsStudio() {
    const project = mapProject();
    setSupportedModes(project, 7);
    fs.mkdirSync(path.join(project.mapFolder, "war3mapImported"));
    fs.writeFileSync(
      path.join(project.mapFolder, "war3mapImported", "Cube.mdx"),
      cubeModel(),
    );
    fs.mkdirSync(path.join(project.mapFolder, "_hd.w3mod", "war3mapImported"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(project.mapFolder, "_hd.w3mod", "war3mapImported", "Sharp.mdx"),
      cubeModel({ hd: true }),
    );
    return start(project, {
      gameExecutable: await syntheticGame(INSTALL_MODELS),
    });
  }

  it("lists the map's imports first, then the install's models in the art layer and the base layer, each once", async () => {
    const studio = await modelsStudio();
    const answer = await request(studio, "/api/models");
    expect(answer.status).toBe(200);
    expect(answer.body).toEqual({
      query: "",
      models: [
        { path: "war3mapImported\\Cube.mdx", from: "map" },
        { path: "war3mapImported\\Sharp.mdx", from: "map" },
        { path: "Units\\Human\\Footman\\Footman.mdx", from: "install" },
      ],
      total: 3,
    });
    const de = await request(studio, "/api/models?layer=de");
    expect(
      (de.body as { models: { path: string }[] }).models.map(
        (model) => model.path,
      ),
    ).toContain("Units\\Human\\Scarlet\\Scarlet.mdx");
  });

  it("lists a DE import of the map folder by the path beneath _DE.w3mod/", async () => {
    // #842 saw the World Editor write a DE import there:
    // docs/research/world-editor-screen-checks.md.
    const project = mapProject();
    fs.mkdirSync(path.join(project.mapFolder, "_DE.w3mod", "war3mapImported"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(project.mapFolder, "_DE.w3mod", "war3mapImported", "Red.mdx"),
      cubeModel(),
    );
    const studio = await start(project, {
      gameExecutable: await syntheticGame(INSTALL_MODELS),
    });
    const answer = await request(studio, "/api/models?q=Red.mdx");
    expect(answer.body).toMatchObject({
      models: [{ path: "war3mapImported\\Red.mdx", from: "map" }],
    });
  });

  it("keeps the paths that hold the text, without regard to case or separators, up to the limit", async () => {
    const studio = await modelsStudio();
    const found = await request(studio, "/api/models?q=human/FOOTMAN");
    expect(found.body).toMatchObject({
      query: "human/FOOTMAN",
      models: [{ path: "Units\\Human\\Footman\\Footman.mdx" }],
      total: 1,
    });
    const limited = await request(studio, "/api/models?limit=1");
    expect(limited.body).toMatchObject({
      models: [{ path: "war3mapImported\\Cube.mdx" }],
      total: 3,
    });
    expect((await request(studio, "/api/models?limit=0")).status).toBe(400);
  });
});

describe("the thumbnail cache, /api/thumbnails", () => {
  it("keeps the PNG the page drew, by Build, art layer and path, under the cache folder", async () => {
    const cacheFolder = makeTempDir("thumbnails");
    const studio = await start(mapProject(), {
      gameExecutable: await syntheticGame(INSTALL_MODELS),
      cacheFolder,
    });
    const footman = `/api/thumbnails?path=${encodeURIComponent("units\\human\\Footman\\Footman")}`;
    const before = await request(studio, footman);
    expect(before.status).toBe(404);
    expect(before.body).toMatchObject({ error: { reason: "not-cached" } });

    const kept = await request(studio, footman, { method: "PUT", body: PNG });
    expect(kept.status).toBe(200);
    const after = await request(studio, footman);
    expect(after.status).toBe(200);
    expect(after.headers["content-type"]).toBe("image/png");
    expect(after.bytes.equals(PNG)).toBe(true);
    // The other art layers have none yet.
    expect((await request(studio, `${footman}&layer=sd`)).status).toBe(404);

    const session = (await request(studio, "/api/session")).body as {
      build: string;
    };
    const files = fs.readdirSync(path.join(cacheFolder, session.build, "hd"));
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/^[0-9a-f]{40}\.png$/);
  });

  it("refuses what is not a PNG, a write from another origin, and a model found nowhere", async () => {
    const studio = await start(mapProject(), {
      gameExecutable: await syntheticGame(INSTALL_MODELS),
    });
    const footman = `/api/thumbnails?path=${encodeURIComponent("Units\\Human\\Footman\\Footman.mdx")}`;
    const notPng = await request(studio, footman, {
      method: "PUT",
      body: Buffer.from("not a PNG"),
    });
    expect(notPng.status).toBe(400);
    const foreign = await request(studio, footman, {
      method: "PUT",
      body: PNG,
      headers: { origin: "http://example.com" },
    });
    expect(foreign.status).toBe(403);
    const nowhere = await request(
      studio,
      "/api/thumbnails?path=Units/Nowhere/Nowhere.mdx",
    );
    expect(nowhere.status).toBe(404);
    expect(nowhere.body).toMatchObject({ error: { reason: "not-found" } });
  });

  it("draws a map's import again once its file changed", async () => {
    const project = mapProject();
    fs.mkdirSync(path.join(project.mapFolder, "war3mapImported"));
    const file = path.join(project.mapFolder, "war3mapImported", "Cube.mdx");
    fs.writeFileSync(file, cubeModel());
    const studio = await start(project);
    const cube = `/api/thumbnails?path=${encodeURIComponent("war3mapImported\\Cube.mdx")}`;
    await request(studio, cube, { method: "PUT", body: PNG });
    expect((await request(studio, cube)).status).toBe(200);
    fs.writeFileSync(file, cubeModel({ size: 80 }));
    expect((await request(studio, cube)).status).toBe(404);
  });
});
