// The scripted edits of the World Editor contract fixture (#640,
// test/fixtures/editor-contract.md): applied by the Object data editor to a
// copy of test/fixtures/editor-objects.w3m, whose result the 3.0 World
// Editor then loaded and saved as test/fixtures/editor-contract.w3m. The
// test applies them again and compares the bytes. This file imports nothing
// at run time, so that the run that made the fixture loaded it with Node's
// type stripping beside the built package.

import fs from "node:fs";
import path from "node:path";
import type { ObjectDataEditor } from "../../src/index.js";

/**
 * The foreign literal name, the one input the writer cannot make: the
 * Custom unit `h001` gets `unam` "Chevalier" as literal text in its entry of
 * `war3map.w3u`, as a tool other than the World Editor writes a name, beside
 * the `TRIGSTR` its Skin entry holds. A byte patch of the entry, which holds
 * no modification in editor-objects.w3m, so that the input is not made by
 * the code under test.
 */
export function seedForeignLiteral(mapFolder: string): void {
  const file = path.join(mapFolder, "war3map.w3u");
  const bytes = fs.readFileSync(file);
  const uint32 = (value: number): Buffer => {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32LE(value);
    return buffer;
  };
  // Original, Custom Rawcode, one set, flag 0, no modification.
  const entry = Buffer.concat([
    Buffer.from("hknih001", "latin1"),
    uint32(1),
    uint32(0),
    uint32(0),
  ]);
  const at = bytes.indexOf(entry);
  if (at < 0 || bytes.indexOf(entry, at + 1) >= 0) {
    throw new Error("war3map.w3u holds no single empty entry of h001");
  }
  const modification = Buffer.concat([
    Buffer.from("unam", "latin1"),
    uint32(3),
    Buffer.from("Chevalier\0", "utf8"),
    Buffer.from("h001", "latin1"),
  ]);
  fs.writeFileSync(
    file,
    Buffer.concat([
      bytes.subarray(0, at),
      entry.subarray(0, entry.length - 4),
      uint32(1),
      modification,
      bytes.subarray(at + entry.length),
    ]),
  );
}

/**
 * The edits, in order: for each Object kind a Custom object added with a
 * localizable and a non-localizable string and a field of a Built-in object
 * changed; multi-level ability fields, one at a data column; a rename; the
 * foreign literal set; a Custom object removed.
 */
export function applyContractEdits(editor: ObjectDataEditor): void {
  // Units: unsf and ushr settle the file of the two fields whose netsafe is 11.
  editor.addObject({ kind: "unit", rawcode: "h002", base: "hpea" });
  const h002 = { kind: "unit", rawcode: "h002" } as const;
  editor.setField({ ...h002, field: "unam" }, "Sergeant");
  editor.setField({ ...h002, field: "unsf" }, "(contract)");
  editor.setField(
    { ...h002, field: "umdl" },
    "units\\human\\Footman\\Footman.mdl",
  );
  editor.setField({ ...h002, field: "ushr" }, 0);
  editor.setField({ ...h002, field: "uhpm" }, 350);
  editor.setField({ kind: "unit", rawcode: "hkni", field: "uhpm" }, 900);
  editor.setField({ kind: "unit", rawcode: "h000", field: "unam" }, "Major");
  editor.setField(
    { kind: "unit", rawcode: "h001", field: "unam" },
    "Chevalier Noir",
  );

  // Items.
  editor.addObject({ kind: "item", rawcode: "I001", base: "rat6" });
  const i001 = { kind: "item", rawcode: "I001" } as const;
  editor.setField({ ...i001, field: "unam" }, "Sergeant's Claws");
  editor.setField(
    { ...i001, field: "ifil" },
    "Objects\\InventoryItems\\PotofGold\\PotofGold.mdl",
  );
  editor.setField({ ...i001, field: "igol" }, 150);
  editor.setField({ kind: "item", rawcode: "ckng", field: "igol" }, 900);

  // Abilities: atp1 settles the comment of a levelled localizable field.
  editor.addObject({ kind: "ability", rawcode: "A001", base: "AHhb" });
  const a001 = { kind: "ability", rawcode: "A001" } as const;
  editor.setField({ ...a001, field: "anam" }, "Greater Light");
  editor.setField(
    { ...a001, field: "aart" },
    "ReplaceableTextures\\CommandButtons\\BTNStarfall.blp",
  );
  editor.setField({ ...a001, field: "atp1", level: 2 }, "Greater Light II");
  editor.setField({ ...a001, field: "amcs", level: 1 }, 50);
  editor.setField(
    { kind: "ability", rawcode: "A000", field: "Hbz1", level: 2 },
    9,
  );
  editor.setField(
    { kind: "ability", rawcode: "A000", field: "amcs", level: 3 },
    130,
  );
  editor.setField(
    { kind: "ability", rawcode: "AHbz", field: "amcs", level: 1 },
    60,
  );

  // Buffs: fnam names a buff in the World Editor's comments.
  editor.addObject({ kind: "buff", rawcode: "B001", base: "Bslo" });
  const b001 = { kind: "buff", rawcode: "B001" } as const;
  editor.setField({ ...b001, field: "fnam" }, "Weakness");
  editor.setField({ ...b001, field: "ftip" }, "Weakened");
  editor.setField(
    { ...b001, field: "fart" },
    "ReplaceableTextures\\CommandButtons\\BTNCripple.blp",
  );
  editor.setField({ kind: "buff", rawcode: "Bslo", field: "ftip" }, "Slowed");
  // No editor name: named by its base's, BHbz's "Blizzard (Caster)" (#654).
  editor.addObject({ kind: "buff", rawcode: "B003", base: "BHbz" });
  editor.setField({ kind: "buff", rawcode: "B003", field: "ftip" }, "Frozen");

  // Destructables.
  editor.addObject({ kind: "destructable", rawcode: "B002", base: "LTbr" });
  const b002 = { kind: "destructable", rawcode: "B002" } as const;
  editor.setField({ ...b002, field: "bnam" }, "Supply Barrel");
  editor.setField(
    { ...b002, field: "bfil" },
    "Doodads\\LordaeronSummer\\Props\\Barrel\\Barrel.mdl",
  );
  editor.setField(
    { kind: "destructable", rawcode: "LTbr", field: "bhps" },
    120,
  );

  // Doodads.
  editor.addObject({ kind: "doodad", rawcode: "D001", base: "AOgs" });
  const d001 = { kind: "doodad", rawcode: "D001" } as const;
  editor.setField({ ...d001, field: "dnam" }, "Statue of the Sergeant");
  editor.setField(
    { ...d001, field: "dfil" },
    "Doodads\\Outland\\Props\\Statue\\Statue.mdl",
  );
  editor.setField({ ...d001, field: "dmas" }, 1.5);
  editor.setField({ kind: "doodad", rawcode: "AOks", field: "dmas" }, 2);

  // Upgrades: gnam has levels, the World Editor naming an upgrade by level 0.
  editor.addObject({ kind: "upgrade", rawcode: "R001", base: "Rhra" });
  const r001 = { kind: "upgrade", rawcode: "R001" } as const;
  editor.setField({ ...r001, field: "gnam", level: 0 }, "Sharper Powder");
  editor.setField(
    { ...r001, field: "gar1", level: 1 },
    "ReplaceableTextures\\CommandButtons\\BTNDwarvenLongRifle.blp",
  );
  editor.setField({ ...r001, field: "gglb" }, 150);
  editor.setField({ kind: "upgrade", rawcode: "Rhme", field: "gtib" }, 30);
  // No name at level 0: named by its base's names of every level (#654).
  editor.addObject({ kind: "upgrade", rawcode: "R002", base: "Rhra" });
  editor.setField(
    { kind: "upgrade", rawcode: "R002", field: "gnam", level: 1 },
    "Finer Powder",
  );
  editor.removeObject({ kind: "upgrade", rawcode: "R000" });
}
