// The Object definitions of the World Editor contract of Object sync (#713,
// test/fixtures/editor-sync.md): synced into a copy of
// test/fixtures/editor-objects.w3m in two runs, whose result the 3.0 World
// Editor then loaded and saved as test/fixtures/editor-sync.w3m. The test
// syncs them again and compares the bytes. This file imports nothing at run
// time, so that the run that made the fixture loaded it with Node's type
// stripping beside the built package.

/** The import line of every definition file. */
const IMPORT = `import { defineAbility, defineBuff, defineItem, defineUnit, localized } from "reforged-map/objects";\n`;

/**
 * The definitions both runs sync, by path under the Map project's root: a
 * Custom object of four kinds, a Built-in change, a multi-level ability, a
 * localizable string and a localized value. Every value differs from its
 * base's, since the World Editor drops some modifications equal to their
 * base's value (test/fixtures/editor-contract.md).
 */
export const SYNCED_DEFINITIONS: Readonly<Record<string, string>> = {
  "src/objects/units.ts": `${IMPORT}
export const Sergeant = defineUnit({
  rawcode: "h002",
  base: FourCC("hfoo"),
  fields: {
    unam: localized("Sergeant", { deDE: "Feldwebel", ptBR: "Sargento" }),
    utip: "Train a Sergeant",
    uhpm: 520,
    uabi: [FourCC("A001")],
  },
});

export const Knight = defineUnit({ rawcode: "hkni", fields: { uhpm: 900 } });
`,
  "src/objects/abilities.ts": `${IMPORT}
export const FrostRain = defineAbility({
  rawcode: "A001",
  base: FourCC("AHbz"),
  fields: {
    anam: "Frost Rain",
    atp1: { 1: "Frost Rain - [Level 1]", 2: "Frost Rain - [Level 2]", 3: "Frost Rain - [Level 3]" },
    amcs: { 1: 77, 2: 99, 3: 121 },
    Hbz1: { 1: 7, 2: 9, 3: 11 },
    Hbz2: { 1: 33, 2: 44, 3: 55.5 },
  },
});
`,
  "src/objects/buffs.ts": `${IMPORT}
export const Frozen = defineBuff({
  rawcode: "B001",
  base: FourCC("BHbz"),
  fields: { fnam: "Frozen", ftip: "Frozen" },
});
`,
};

/**
 * The definition only the first run syncs: the second run finds it gone,
 * and Object sync removes its Custom item from the map folder.
 */
export const REMOVED_DEFINITIONS: Readonly<Record<string, string>> = {
  "src/objects/items.ts": `${IMPORT}
export const OldClaws = defineItem({
  rawcode: "I001",
  base: FourCC("ratc"),
  fields: { unam: "Old Claws", igol: 450 },
});
`,
};
