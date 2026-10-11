// The Object data reader keeps every modification as read (#585): the
// levels of a multi-level ability and the variations of a doodad, with
// their data pointers, which the writer of ADR 0015 serializes.

import { afterAll, describe, expect, it } from "vitest";
import { createModel } from "../src/model.js";
import { readObjectData } from "../src/object-data.js";
import { mapFolder, removeTemporary } from "./support/map-folder.js";
import { buildObjectData } from "./support/object-data.js";

afterAll(removeTemporary);

describe("readObjectData", () => {
  it("keeps every level of a multi-level ability and every variation of a doodad, in file order", () => {
    const ability = [
      { field: "anam", value: "Frost Storm" },
      { field: "Hbz1", level: 1, dataPointer: 1, value: 5 },
      { field: "Hbz1", level: 2, dataPointer: 1, value: 8 },
      { field: "Hbz2", level: 3, dataPointer: 2, type: 2, value: 1.5 },
    ];
    const doodad = [
      { field: "dvr1", level: 0, value: 255 },
      { field: "dvr1", level: 1, value: 128 },
    ];
    const model = createModel();

    readObjectData(
      mapFolder({
        "war3map.w3a": buildObjectData({
          levels: true,
          custom: [
            { original: "AHbz", custom: "A000", modifications: ability },
          ],
        }),
        "war3map.w3d": buildObjectData({
          levels: true,
          custom: [{ original: "LObr", custom: "D000", modifications: doodad }],
        }),
      }),
      ["ability", "doodad"],
      model,
    );

    expect(model.warnings).toEqual([]);
    expect(
      model.objectData.map((file) => [
        file.name,
        file.custom[0]?.sets[0]?.modifications,
      ]),
    ).toEqual([
      [
        "war3map.w3a",
        [
          {
            field: "anam",
            type: "string",
            level: 0,
            dataPointer: 0,
            value: "Frost Storm",
            end: "A000",
          },
          {
            field: "Hbz1",
            type: "int",
            level: 1,
            dataPointer: 1,
            value: 5,
            end: "A000",
          },
          {
            field: "Hbz1",
            type: "int",
            level: 2,
            dataPointer: 1,
            value: 8,
            end: "A000",
          },
          {
            field: "Hbz2",
            type: "unreal",
            level: 3,
            dataPointer: 2,
            value: 1.5,
            end: "A000",
          },
        ],
      ],
      [
        "war3map.w3d",
        [
          {
            field: "dvr1",
            type: "int",
            level: 0,
            dataPointer: 0,
            value: 255,
            end: "D000",
          },
          {
            field: "dvr1",
            type: "int",
            level: 1,
            dataPointer: 0,
            value: 128,
            end: "D000",
          },
        ],
      ],
    ]);
  });
});
