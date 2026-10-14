// The Object data reader keeps every modification as read (#585): the
// levels of a multi-level ability and the variations of a doodad, with
// their data pointers, which the writer of ADR 0015 serializes. It reads
// format versions 1, 2 and 3 (#587), from encoder-built files and from
// wc3libs' fixtures (test/fixtures/wc3libs, Apache-2.0).

import fs from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { createModel, type ObjectKind } from "../src/model.js";
import { readObjectData } from "../src/object-data.js";
import {
  fixtureMap,
  mapFolder,
  removeTemporary,
} from "./support/map-folder.js";
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

/** The model of a map folder holding wc3libs' fixture `fixture` as `name`. */
function readWc3libs(fixture: string, name: string, kind: ObjectKind) {
  const model = createModel();
  readObjectData(
    mapFolder({
      [name]: fs.readFileSync(path.join(fixtureMap("wc3libs"), fixture)),
    }),
    [kind],
    model,
  );
  return model;
}

describe("the format versions", () => {
  it.each([1, 2])(
    "reads format version %i, whose objects have no set, levelled or not",
    (version) => {
      const model = createModel();

      readObjectData(
        mapFolder({
          "war3map.w3u": buildObjectData({
            version,
            original: [
              {
                original: "hfoo",
                modifications: [{ field: "umvs", type: 0, value: 300 }],
              },
            ],
            custom: [
              {
                original: "hfoo",
                custom: "h000",
                modifications: [{ field: "unam", value: "Captain" }],
              },
            ],
          }),
          "war3map.w3a": buildObjectData({
            version,
            levels: true,
            custom: [
              {
                original: "AHbz",
                custom: "A000",
                modifications: [
                  { field: "Hbz1", level: 2, dataPointer: 1, value: 8 },
                ],
              },
            ],
          }),
        }),
        ["unit", "ability"],
        model,
      );

      expect(model.warnings).toEqual([]);
      expect(model.objectData).toEqual([
        {
          name: "war3map.w3u",
          kind: "unit",
          skin: false,
          version,
          original: [
            {
              original: "hfoo",
              sets: [
                {
                  modifications: [
                    { field: "umvs", type: "int", value: 300, end: "hfoo" },
                  ],
                },
              ],
            },
          ],
          custom: [
            {
              original: "hfoo",
              custom: "h000",
              sets: [
                {
                  modifications: [
                    {
                      field: "unam",
                      type: "string",
                      value: "Captain",
                      end: "h000",
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: "war3map.w3a",
          kind: "ability",
          skin: false,
          version,
          original: [],
          custom: [
            {
              original: "AHbz",
              custom: "A000",
              sets: [
                {
                  modifications: [
                    {
                      field: "Hbz1",
                      type: "int",
                      level: 2,
                      dataPointer: 1,
                      value: 8,
                      end: "A000",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]);
    },
  );

  it("reads wc3libs' abilities file of format version 2, every modification typed before its level", () => {
    const model = readWc3libs("war3map.w3a", "war3map.w3a", "ability");

    expect(model.warnings).toEqual([]);
    const [file] = model.objectData;
    expect(file.version).toBe(2);
    expect(file.original).toHaveLength(117);
    expect(file.custom).toEqual([]);
    expect(file.original[0].original).toBe("ADaA");
    expect(file.original[0].sets[0].modifications.slice(0, 3)).toEqual([
      {
        field: "aare",
        type: "unreal",
        level: 5,
        dataPointer: 0,
        value: 0,
        end: "\0\0\0\0",
      },
      {
        field: "aare",
        type: "unreal",
        level: 6,
        dataPointer: 0,
        value: 0,
        end: "\0\0\0\0",
      },
      {
        field: "amcs",
        type: "int",
        level: 5,
        dataPointer: 0,
        value: 0,
        end: "\0\0\0\0",
      },
    ]);
  });

  it("reads wc3libs' abilities file of format version 3, each object's set flag kept", () => {
    const model = readWc3libs("war3map_format3.w3a", "war3map.w3a", "ability");

    expect(model.warnings).toEqual([]);
    const [file] = model.objectData;
    expect(file.version).toBe(3);
    expect(file.original).toEqual([
      {
        original: "Ahrp",
        sets: [
          {
            flag: 0,
            modifications: [
              {
                field: "aran",
                type: "unreal",
                level: 1,
                dataPointer: 0,
                value: 5,
                end: "Ahrp",
              },
            ],
          },
        ],
      },
    ]);
    expect(file.custom).toHaveLength(45);
    expect(file.custom[0]).toEqual({
      original: "Ahar",
      custom: "A000",
      sets: [
        {
          flag: 0,
          modifications: [
            {
              field: "Har2",
              type: "int",
              level: 1,
              dataPointer: 2,
              value: 3,
              end: "Ahar",
            },
          ],
        },
      ],
    });
  });

  it.each([
    ["war3map.w3u", "unit"],
    ["war3map.w3t", "item"],
    ["war3map.w3b", "destructable"],
    ["war3map.w3d", "doodad"],
    ["war3map.w3h", "buff"],
    ["war3map.w3q", "upgrade"],
  ] as const)("reads wc3libs' empty %s of format version 2", (name, kind) => {
    const model = readWc3libs(name, name, kind);

    expect(model.warnings).toEqual([]);
    expect(model.objectData).toEqual([
      { name, kind, skin: false, version: 2, original: [], custom: [] },
    ]);
  });
});
