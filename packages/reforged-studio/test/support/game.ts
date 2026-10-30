/**
 * A synthetic install of the seven Object kinds for the game data model's
 * tests: a few objects of each kind, their metadata, the editor strings and
 * the editor data, in the layout of 3.0's storage. Every byte is the
 * tests' own.
 */
import {
  base,
  profile,
  slkTable,
  strings,
  WORLD_EDIT_GAME_STRINGS,
  WORLD_EDIT_STRINGS,
} from "./casc.js";

/** A metadata row of the columns the model reads; empty cells left out. */
export interface MetaRow {
  ID: string;
  field: string;
  slk: string;
  type: string;
  index?: string;
  repeat?: string;
  data?: string;
  appendIndex?: string;
  category?: string;
  displayName?: string;
  sort?: string;
  useSpecific?: string;
  useUnit?: string;
  useHero?: string;
  useBuilding?: string;
  useItem?: string;
}

const META_COLUMNS: readonly (keyof MetaRow)[] = [
  "ID",
  "field",
  "slk",
  "index",
  "repeat",
  "appendIndex",
  "data",
  "category",
  "displayName",
  "sort",
  "type",
  "useSpecific",
  "useUnit",
  "useHero",
  "useBuilding",
  "useItem",
];

/** A synthetic `*MetaData.slk` with the columns of 3.0's. */
export function metaData(rows: readonly MetaRow[]): string {
  return slkTable(
    META_COLUMNS,
    rows.map((row) => META_COLUMNS.map((column) => row[column])),
  );
}

/** The editor's labels of the synthetic fields, enumerations and tabs. */
export const EDITOR_STRINGS = {
  WESTRING_OBJTAB_UNITS: "Units",
  WESTRING_OBJTAB_ITEMS: "Items",
  WESTRING_OBJTAB_ABILITIES: "Abilities",
  WESTRING_OBJTAB_BUFFS: "Buffs/Effects",
  WESTRING_OBJTAB_DESTRUCTABLES: "Destructibles",
  WESTRING_OBJTAB_DOODADS: "Doodads",
  WESTRING_OBJTAB_UPGRADES: "Upgrades",
  WESTRING_UEVAL_UNAM: "Text - Name",
  WESTRING_UEVAL_UHPM: "Stats - Hit Points Maximum (Base)",
  WESTRING_UEVAL_UA1T: "Combat - Attack 1 - Attack Type",
  WESTRING_UE_ATTACKTYPE_NORMAL: "Normal",
  WESTRING_UE_ATTACKTYPE_PIERCE: "Pierce",
  WESTRING_AEVAL_ACDN: "Stats - Cooldown",
  WESTRING_UE_UNITRACE_HUMAN: "Human",
  WESTRING_UE_UNITRACE_OTHER: "Other",
  WESTRING_ITEMCLASS_PERMANENT: "Permanent",
} as const;

/** The units' metadata: a profile name and icon, a stat, an enumeration and the editor's flags. */
export const UNIT_META: readonly MetaRow[] = [
  {
    ID: "unam",
    field: "Name",
    slk: "Profile",
    index: "0",
    type: "string",
    category: "text",
    displayName: "WESTRING_UEVAL_UNAM",
    sort: "c1a00",
    useUnit: "1",
    useHero: "1",
    useBuilding: "1",
    useItem: "1",
  },
  {
    ID: "uico",
    field: "Art",
    slk: "Profile",
    index: "0",
    type: "icon",
    category: "art",
    useUnit: "1",
    useHero: "1",
    useBuilding: "1",
    useItem: "1",
  },
  {
    ID: "ua1m",
    field: "Missileart",
    slk: "Profile",
    index: "0",
    type: "model",
    category: "combat",
    useUnit: "1",
  },
  {
    ID: "ua2m",
    field: "Missileart",
    slk: "Profile",
    index: "1",
    type: "model",
    category: "combat",
    useUnit: "1",
  },
  {
    ID: "uhpm",
    field: "HP",
    slk: "UnitBalance",
    index: "-1",
    type: "int",
    category: "stats",
    displayName: "WESTRING_UEVAL_UHPM",
    useUnit: "1",
    useHero: "1",
    useBuilding: "1",
  },
  {
    ID: "ua1t",
    field: "atkType1",
    slk: "UnitWeapons",
    index: "-1",
    type: "attackType",
    category: "combat",
    displayName: "WESTRING_UEVAL_UA1T",
    useUnit: "1",
  },
  {
    ID: "ihpc",
    field: "HP",
    slk: "ItemData",
    index: "-1",
    type: "int",
    category: "stats",
    useItem: "1",
  },
];

/** The units: a footman, a hero, a building, a campaign unit and a special one; `hgry` is of The Frozen Throne. */
export const UNIT_FILES: Readonly<Record<string, string>> = {
  [base("Units/UnitMetaData.slk")]: metaData(UNIT_META),
  [base("Units/UnitData.slk")]: slkTable(
    ["unitID", "race", "version"],
    [
      ["hfoo", "human", "0"],
      ["Hpal", "human", "0"],
      ["htow", "human", "0"],
      ["hgry", "human", "1"],
      ["nmrl", "naga", "1"],
      ["zcso", "other", "0"],
    ],
  ),
  [base("Units/UnitBalance.slk")]: slkTable(
    ["unitBalanceID", "HP", "isbldg"],
    [
      ["hfoo", "420", "0"],
      ["Hpal", "650", "0"],
      ["htow", "1500", "1"],
      ["hgry", "875", "0"],
      ["nmrl", "200", "0"],
      ["zcso", "100", "0"],
    ],
  ),
  [base("Units/unitUI.slk")]: slkTable(
    ["unitUIID", "special", "campaign"],
    [
      ["hfoo", "0", "0"],
      ["Hpal", "0", "0"],
      ["htow", "0", "0"],
      ["hgry", "0", "0"],
      ["nmrl", "0", "1"],
      ["zcso", "1", "0"],
    ],
  ),
  [base("Units/UnitWeapons.slk")]: slkTable(
    ["unitWeaponID", "atkType1"],
    [
      ["hfoo", "normal"],
      ["hgry", "pierce"],
    ],
  ),
  [base("Units/UnitAbilities.slk")]: slkTable(["unitAbilID", "abilList"], []),
  [base("Units/HumanUnitFunc.txt")]: profile({
    hfoo: { Missileart: "Footman1.mdl,Footman2.mdl" },
  }),
  [base("Units/UnitSkin.txt")]: profile({
    hfoo: { Art: "ReplaceableTextures\\CommandButtons\\BTNFootman.blp" },
  }),
  [strings("HumanUnitStrings.txt")]: profile({
    hfoo: { Name: "Footman", "Name:custom,V1": "Footman (TFT)" },
    Hpal: { Name: "Paladin" },
    htow: { Name: "Town Hall" },
    hgry: { Name: "Gryphon Rider" },
  }),
};

/** The abilities: one hero ability with three levels of cooldown and a data field, and one item ability. */
export const ABILITY_FILES: Readonly<Record<string, string>> = {
  [base("Units/AbilityMetaData.slk")]: metaData([
    {
      ID: "anam",
      field: "Name",
      slk: "Profile",
      index: "0",
      type: "string",
      category: "text",
    },
    {
      ID: "acdn",
      field: "Cool",
      slk: "AbilityData",
      index: "-1",
      repeat: "4",
      type: "unreal",
      category: "stats",
      displayName: "WESTRING_AEVAL_ACDN",
    },
    {
      ID: "Hbz1",
      field: "Data",
      slk: "AbilityData",
      index: "-1",
      repeat: "4",
      data: "1",
      type: "int",
      category: "data",
      useSpecific: "AHbz",
    },
  ]),
  [base("Units/AbilityData.slk")]: slkTable(
    [
      "alias",
      "race",
      "hero",
      "item",
      "version",
      "Cool1",
      "DataA1",
      "Cool2",
      "DataA2",
      "Cool3",
      "DataA3",
    ],
    [
      ["AHbz", "human", "1", "0", "0", "6", "6", "6", "8", "6", "10"],
      ["AIat", "other", "0", "1", "0", "0", "-", "0", "-", "0", "-"],
    ],
  ),
  [strings("HumanAbilityStrings.txt")]: profile({
    AHbz: { Name: "Blizzard" },
  }),
};

/** A buff, an effect, a destructable, a doodad and an upgrade with names of every level. */
export const OTHER_FILES: Readonly<Record<string, string>> = {
  [base("Units/ItemData.slk")]: slkTable(
    ["itemID", "class", "HP", "version"],
    [["ratf", "Permanent", "75", "0"]],
  ),
  [base("Units/AbilityBuffMetaData.slk")]: metaData([
    { ID: "fnam", field: "EditorName", slk: "Profile", type: "string" },
  ]),
  [base("Units/AbilityBuffData.slk")]: slkTable(
    ["alias", "race", "isEffect"],
    [
      ["BHbz", "human", "1"],
      ["Binf", "human", "0"],
    ],
  ),
  [base("Units/DestructableMetaData.slk")]: metaData([
    { ID: "bnam", field: "Name", slk: "DestructableData", type: "string" },
  ]),
  [base("Units/DestructableData.slk")]: slkTable(
    ["DestructableID", "category", "Name"],
    [["LTlt", "D", "WESTRING_DEST_TREE"]],
  ),
  [base("Doodads/DoodadMetaData.slk")]: metaData([
    { ID: "dnam", field: "Name", slk: "DoodadData", type: "string" },
  ]),
  [base("Doodads/Doodads.slk")]: slkTable(
    ["doodID", "category", "Name"],
    [["YOtf", "O", "Torch"]],
  ),
  [base("Units/UpgradeMetaData.slk")]: metaData([
    {
      ID: "gnam",
      field: "Name",
      slk: "Profile",
      index: "0",
      repeat: "1",
      type: "string",
    },
    {
      ID: "greq",
      field: "Requires",
      slk: "Profile",
      index: "-1",
      repeat: "1",
      appendIndex: "1",
      type: "techList",
    },
    {
      ID: "glvl",
      field: "maxlevel",
      slk: "UpgradeData",
      index: "-1",
      type: "int",
    },
  ]),
  [base("Units/UpgradeData.slk")]: slkTable(
    ["upgradeid", "race", "maxlevel"],
    [["Rhme", "human", "3"]],
  ),
  [base("Units/HumanUpgradeFunc.txt")]: profile({
    Rhme: { Requires: "", Requires1: "hkee", Requires2: "hcas" },
  }),
  [strings("HumanUpgradeStrings.txt")]: profile({
    Rhme: {
      Name: '"Iron Forged Swords","Steel Forged Swords","Mithril Forged Swords"',
    },
  }),
};

/** The editor's strings and data: labels and four enumerations, two the fields read and two the World Editor's tree groups by. */
export const EDITOR_FILES: Readonly<Record<string, string>> = {
  [WORLD_EDIT_GAME_STRINGS]: profile({
    WorldEditStrings: { WESTRING_DEST_TREE: "Lordaeron Summer Tree Wall" },
  }),
  [WORLD_EDIT_STRINGS]: profile({ WorldEditStrings: EDITOR_STRINGS }),
  [base("UI/UnitEditorData.txt")]: profile({
    attackType: {
      NumValues: "3",
      "00": "unknown,WESTRING_NONE",
      "01": "normal,WESTRING_UE_ATTACKTYPE_NORMAL",
      "02": "pierce,WESTRING_UE_ATTACKTYPE_PIERCE",
    },
    unitRace: {
      Sort: "1",
      "00": "human,WESTRING_UE_UNITRACE_HUMAN",
      "01": "other,WESTRING_UE_UNITRACE_OTHER",
      "02": "naga,WESTRING_UE_UNITRACE_NAGA,1",
      NumValues: "3",
    },
    itemClass: {
      "00": "Permanent,WESTRING_ITEMCLASS_PERMANENT",
      NumValues: "1",
    },
  }),
};

/** Every file of the synthetic install. */
export const GAME_FILES: Readonly<Record<string, string>> = {
  ...UNIT_FILES,
  ...ABILITY_FILES,
  ...OTHER_FILES,
  ...EDITOR_FILES,
};
