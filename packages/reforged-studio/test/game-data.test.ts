/**
 * Seam 3, the game data model: `readGameData` on a synthetic install of
 * the seven Object kinds (`support/game.ts`), with no byte of Blizzard's.
 * The tests assert what the model gives a Game data set: the fields, the
 * base values and the World Editor's grouping.
 */
import { describe, expect, it } from "vitest";
import { openStorage, readGameData } from "../src/index.js";
import { base, writeStorage } from "./support/casc.js";
import { GAME_FILES } from "./support/game.js";

async function gameData(
  gameDataSet = "custom-fk",
  files: Readonly<Record<string, string>> = {},
) {
  const storage = await writeStorage({ files: { ...GAME_FILES, ...files } });
  return readGameData(await openStorage(storage.installDir), { gameDataSet });
}

describe("readGameData's fields", () => {
  it("gives each kind its label and its fields, with their metadata and labels", async () => {
    const data = await gameData();

    expect(data.kinds.unit.label).toBe("Units");
    expect(data.kinds.buff.label).toBe("Buffs/Effects");
    expect(data.kinds.unit.fields.get("uhpm")).toEqual({
      id: "uhpm",
      field: "HP",
      table: "UnitBalance",
      index: -1,
      repeat: 0,
      data: 0,
      appendIndex: false,
      type: "int",
      category: "stats",
      label: "Stats - Hit Points Maximum (Base)",
      sort: "",
    });
    expect(data.kinds.unit.fields.get("unam")).toMatchObject({
      table: "Profile",
      index: 0,
      label: "Text - Name",
      sort: "c1a00",
    });
    expect(data.kinds.ability.fields.get("acdn")).toMatchObject({
      repeat: 4,
      label: "Stats - Cooldown",
    });
    expect(data.kinds.ability.fields.get("Hbz1")).toMatchObject({
      data: 1,
      specific: ["AHbz"],
    });
    // No label in the editor strings: none.
    expect(data.kinds.unit.fields.get("uico")?.label).toBeUndefined();
  });

  it("gives a kind the fields of a shared metadata its use columns name", async () => {
    const data = await gameData();

    expect([...data.kinds.unit.fields.keys()]).toEqual([
      "unam",
      "uico",
      "ua1m",
      "ua2m",
      "uhpm",
      "ua1t",
    ]);
    expect([...data.kinds.item.fields.keys()]).toEqual([
      "unam",
      "uico",
      "ihpc",
    ]);
  });

  it("gives an enumeration's raw values with their labels, from the editor data", async () => {
    const data = await gameData();

    expect(data.kinds.unit.fields.get("ua1t")?.enumeration).toEqual([
      { value: "unknown" },
      { value: "normal", label: "Normal" },
      { value: "pierce", label: "Pierce" },
    ]);
    expect(data.kinds.unit.fields.get("uhpm")?.enumeration).toBeUndefined();
  });

  it("gives an enumeration no field reads by its type, the one the tree's groups are labelled from", async () => {
    const data = await gameData();

    expect(data.enumeration("unitRace")).toEqual([
      { value: "human", label: "Human" },
      { value: "other", label: "Other" },
      { value: "naga" },
    ]);
    expect(data.enumeration("noSuchType")).toBeUndefined();
  });

  it("resolves a WESTRING_ key through the editor strings, the second file's value winning", async () => {
    const data = await gameData("custom-fk", {
      [base("_Locales/enUS.w3mod:UI/WorldEditGameStrings.txt")]:
        "[WorldEditStrings]\r\nWESTRING_UEVAL_UNAM=Earlier\r\nWESTRING_DEST_TREE=Tree Wall\r\n",
    });

    expect(data.text("WESTRING_DEST_TREE")).toBe("Tree Wall");
    expect(data.text("WESTRING_UEVAL_UNAM")).toBe("Text - Name");
    expect(data.text("Footman")).toBe("Footman");
    expect(data.text("WESTRING_NOWHERE")).toBeUndefined();
  });
});

describe("readGameData's Built-in objects", () => {
  it("gives each object's base values from its tables and the profile files, as its fields locate them", async () => {
    const { kinds } = await gameData();

    expect(kinds.unit.objects.get("hfoo")?.values).toEqual(
      new Map([
        ["unam", "Footman"],
        ["uico", "ReplaceableTextures\\CommandButtons\\BTNFootman.blp"],
        ["ua1m", "Footman1.mdl"],
        ["ua2m", "Footman2.mdl"],
        ["uhpm", "420"],
        ["ua1t", "normal"],
      ]),
    );
    expect(kinds.item.objects.get("ratf")?.values.get("ihpc")).toBe("75");
    expect(kinds.destructable.objects.get("LTlt")?.values.get("bnam")).toBe(
      "WESTRING_DEST_TREE",
    );
    expect(kinds.doodad.objects.get("YOtf")?.values.get("dnam")).toBe("Torch");
  });

  it("gives a field of levels a value per level, each column or item in order", async () => {
    const { kinds } = await gameData();

    const blizzard = kinds.ability.objects.get("AHbz")?.values;
    expect(blizzard?.get("acdn")).toEqual(["6", "6", "6"]);
    expect(blizzard?.get("Hbz1")).toEqual(["6", "8", "10"]);
    const swords = kinds.upgrade.objects.get("Rhme")?.values;
    expect(swords?.get("gnam")).toEqual([
      "Iron Forged Swords",
      "Steel Forged Swords",
      "Mithril Forged Swords",
    ]);
    expect(swords?.get("greq")).toEqual(["", "hkee", "hcas"]);
    expect(swords?.get("glvl")).toBe("3");
  });

  it("gives a field specific to other objects no value", async () => {
    const { kinds } = await gameData();

    expect(kinds.ability.objects.get("AIat")?.values.has("Hbz1")).toBe(false);
    expect(kinds.ability.objects.get("AIat")?.values.get("acdn")).toEqual([
      "0",
      "0",
      "0",
    ]);
  });

  it("groups the objects as the World Editor does", async () => {
    const { kinds } = await gameData();
    const groups = (kind: keyof typeof kinds) =>
      Object.fromEntries(
        [...kinds[kind].objects].map(([rawcode, object]) => [
          rawcode,
          object.group,
        ]),
      );

    expect(groups("unit")).toEqual({
      hfoo: ["human", "melee", "units"],
      Hpal: ["human", "melee", "heroes"],
      htow: ["human", "melee", "buildings"],
      hgry: ["human", "melee", "units"],
      nmrl: ["naga", "campaign", "units"],
      zcso: ["other", "melee", "special"],
    });
    expect(groups("item")).toEqual({ ratf: ["Permanent"] });
    expect(groups("ability")).toEqual({
      AHbz: ["human", "heroes"],
      AIat: ["other", "items"],
    });
    expect(groups("buff")).toEqual({
      BHbz: ["human", "effects"],
      Binf: ["human", "buffs"],
    });
    expect(groups("destructable")).toEqual({ LTlt: ["D"] });
    expect(groups("doodad")).toEqual({ YOtf: ["O"] });
    expect(groups("upgrade")).toEqual({ Rhme: ["human"] });
  });
});

describe("readGameData's layers of a Game data set", () => {
  const CUSTOM_TFT = "War3.w3mod:_Balance/Custom_V1.w3mod:";
  const layered = {
    [`${CUSTOM_TFT}Units/UnitBalance.slk`]: [
      "ID;PWXL;N;E",
      'C;X1;Y1;K"unitBalanceID"',
      'C;X2;K"HP"',
      'C;X3;K"isbldg"',
      'C;X1;Y2;K"hfoo"',
      'C;X2;K"999"',
      'C;X3;K"0"',
      "E",
      "",
    ].join("\r\n"),
    [`${CUSTOM_TFT}Units/HumanUnitFunc.txt`]:
      "[hfoo]\r\nMissileart=Tft.mdl\r\n",
  };

  it("reads a kind's file from the set's layer where the install has it, else from the base layer", async () => {
    const tft = await gameData("custom-tft", layered);
    const fk = await gameData("custom-fk", layered);

    expect(tft.gameDataSet.id).toBe("custom-tft");
    expect(tft.kinds.unit.objects.get("hfoo")?.values.get("uhpm")).toBe("999");
    expect(tft.kinds.unit.objects.get("hfoo")?.values.get("ua1m")).toBe(
      "Tft.mdl",
    );
    // The layer has no row of it: the layer's file replaces the base's whole.
    expect(tft.kinds.unit.objects.get("Hpal")?.values.has("uhpm")).toBe(false);
    expect(fk.kinds.unit.objects.get("hfoo")?.values.get("uhpm")).toBe("420");
    expect(fk.kinds.unit.objects.get("hfoo")?.values.get("ua1m")).toBe(
      "Footman1.mdl",
    );
  });

  it("takes a set's own value in the profile files over the shared one", async () => {
    const tft = await gameData("custom-tft");
    const fk = await gameData("custom-fk");

    expect(tft.kinds.unit.objects.get("hfoo")?.values.get("unam")).toBe(
      "Footman (TFT)",
    );
    expect(fk.kinds.unit.objects.get("hfoo")?.values.get("unam")).toBe(
      "Footman",
    );
  });

  it("leaves out the units, items and abilities of a later Game Data Version", async () => {
    const roc = await gameData("custom-roc");
    const tft = await gameData("melee-tft");

    expect([...roc.kinds.unit.objects.keys()]).toEqual([
      "hfoo",
      "Hpal",
      "htow",
      "zcso",
    ]);
    expect(tft.kinds.unit.objects.has("hgry")).toBe(true);
  });

  it("refuses a set it does not know, naming the sets", async () => {
    await expect(gameData("default-fk")).rejects.toThrow(
      "default-fk is no Game data set; the sets are custom-fk, melee-fk, custom-tft, melee-tft, custom-roc, melee-roc.",
    );
  });
});
