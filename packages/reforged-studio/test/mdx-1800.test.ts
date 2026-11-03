/**
 * The patch of `mdx-m3-viewer-th`'s parser for MDX 1800 (#839,
 * `page/mdx-1800.ts`), in Node, on the synthetic models of
 * `support/models.ts`: what the viewer gets of a 3.0 model's material, its
 * layers and its textures. That it reads every model of a real install is
 * checked on a machine with the game, as the pull request reports.
 */
import ModelModule from "mdx-m3-viewer-th/dist/cjs/parsers/mdlx/model.js";
import { beforeAll, describe, expect, it } from "vitest";
import { defaultOf, HD_SHADER, patchMdxParser } from "../page/mdx-1800.js";
import { cubeModel } from "./support/models.js";

const Model = defaultOf(ModelModule);
type Model = InstanceType<typeof Model>;

beforeAll(() => {
  patchMdxParser();
});

/** A model read by the patched parser. */
function read(bytes: Uint8Array): Model {
  const model = new Model();
  model.load(bytes);
  return model;
}

describe("the parser patched for MDX 1800", () => {
  it("reads a model of version 1800", () => {
    const model = read(cubeModel({ texture: "Textures\\Crate.blp" }));
    expect(model.version).toBe(1800);
    expect(model.sequences.map((sequence) => sequence.name)).toEqual(["Stand"]);
    expect(model.geosets[0]?.vertices.length).toBe(24);
    expect(model.textures.map((texture) => texture.path)).toEqual([
      "Textures\\Crate.blp",
    ]);
  });

  it("gives an SD layer the texture of its slot 0, with no shader name", () => {
    const [material] = read(cubeModel()).materials;
    expect(material?.shader).toBe("");
    expect(material?.layers.map((layer) => layer.textureId)).toEqual([0]);
  });

  it("gives an HD layer's six textures as the six layers the viewer draws as HD", () => {
    const [material] = read(cubeModel({ hd: true })).materials;
    expect(material?.shader).toBe(HD_SHADER);
    expect(material?.layers.map((layer) => layer.textureId)).toEqual([
      0, 1, 2, 3, 4, 5,
    ]);
  });

  it("patches once, however many times it is asked", () => {
    patchMdxParser();
    expect(read(cubeModel()).materials[0]?.layers).toHaveLength(1);
  });
});
