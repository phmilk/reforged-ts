/**
 * Where each Object kind's objects and fields are in the storage: its data
 * files, its metadata and the columns that identify an object. The
 * `reforged-builtins` generator reads the Built-in objects through them,
 * and the game data model (`./game-data.ts`) their fields and base values.
 */

/** The Object kinds of ADR 0012, as `reforged-types`' `ObjectKind` names them. */
export type ObjectKind =
  "unit" | "item" | "ability" | "buff" | "destructable" | "doodad" | "upgrade";

/** The Object kinds, in the order of the World Editor's tabs. */
export const OBJECT_KINDS: readonly ObjectKind[] = [
  "unit",
  "item",
  "ability",
  "buff",
  "destructable",
  "doodad",
  "upgrade",
];

/** Where a kind's objects and fields are, inside a layer. */
export interface KindFiles {
  kind: ObjectKind;
  /** The data file, in the base layer, that lists the kind's objects. */
  data: string;
  /** The data file's table, as the metadata's `slk` column names it. */
  table: string;
  /**
   * Every table the kind's metadata names (its `slk` column), but
   * `Profile`, by name, to its file in the base layer: `data` among them.
   */
  tables: Readonly<Record<string, string>>;
  /** The data file's column of the Rawcode. */
  idColumn: string;
  /** The data file's column of the race, for a kind that has one. */
  raceColumn?: string;
  /**
   * Whether a set leaves out an object of a later Game Data Version than its
   * own, by the data's `version` column: units, items and abilities, as the
   * Probe runs of #575 measured. A map of Reign of Chaos still creates a
   * destructable of The Frozen Throne and gives a unit its buffs, and a map
   * of The Frozen Throne a buff of Forsaken Kingdom (#622), so every set
   * holds them as its layer lists them. So it holds upgrades, of which no
   * layer has one of a later version than its sets', and doodads, which no
   * Native creates.
   */
  versioned?: boolean;
  /** The metadata file, in the base layer. */
  metaData: string;
  /**
   * The metadata's columns of which one says a field is the kind's, for the
   * metadata units and items share: `UnitMetaData.slk`'s `useItem` for
   * items, and any of `useUnit`, `useHero` and `useBuilding` for units.
   */
  use?: readonly string[];
}

/** The tables of the units' fields, in `UnitMetaData.slk`'s `slk` column. */
const UNIT_TABLES = {
  UnitData: "Units/UnitData.slk",
  UnitBalance: "Units/UnitBalance.slk",
  UnitUI: "Units/unitUI.slk",
  UnitWeapons: "Units/UnitWeapons.slk",
  UnitAbilities: "Units/UnitAbilities.slk",
};

/** Each kind's files, by kind, in the order of `OBJECT_KINDS`. */
export const KIND_FILES: Readonly<Record<ObjectKind, KindFiles>> = {
  unit: {
    kind: "unit",
    versioned: true,
    data: UNIT_TABLES.UnitData,
    table: "UnitData",
    tables: UNIT_TABLES,
    idColumn: "unitID",
    raceColumn: "race",
    metaData: "Units/UnitMetaData.slk",
    use: ["useUnit", "useHero", "useBuilding"],
  },
  item: {
    kind: "item",
    versioned: true,
    data: "Units/ItemData.slk",
    table: "ItemData",
    tables: { ItemData: "Units/ItemData.slk" },
    idColumn: "itemID",
    metaData: "Units/UnitMetaData.slk",
    use: ["useItem"],
  },
  ability: {
    kind: "ability",
    versioned: true,
    data: "Units/AbilityData.slk",
    table: "AbilityData",
    tables: { AbilityData: "Units/AbilityData.slk" },
    idColumn: "alias",
    raceColumn: "race",
    metaData: "Units/AbilityMetaData.slk",
  },
  buff: {
    kind: "buff",
    data: "Units/AbilityBuffData.slk",
    table: "AbilityBuffData",
    tables: { AbilityBuffData: "Units/AbilityBuffData.slk" },
    idColumn: "alias",
    raceColumn: "race",
    metaData: "Units/AbilityBuffMetaData.slk",
  },
  destructable: {
    kind: "destructable",
    data: "Units/DestructableData.slk",
    table: "DestructableData",
    tables: { DestructableData: "Units/DestructableData.slk" },
    idColumn: "DestructableID",
    metaData: "Units/DestructableMetaData.slk",
  },
  doodad: {
    kind: "doodad",
    data: "Doodads/Doodads.slk",
    table: "DoodadData",
    tables: { DoodadData: "Doodads/Doodads.slk" },
    idColumn: "doodID",
    metaData: "Doodads/DoodadMetaData.slk",
  },
  upgrade: {
    kind: "upgrade",
    data: "Units/UpgradeData.slk",
    table: "UpgradeData",
    tables: { UpgradeData: "Units/UpgradeData.slk" },
    idColumn: "upgradeid",
    raceColumn: "race",
    metaData: "Units/UpgradeMetaData.slk",
  },
};
