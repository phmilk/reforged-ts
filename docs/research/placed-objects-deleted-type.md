# What the World Editor and the game do with placed objects whose type was deleted

Research for [#482](https://github.com/phmilk/reforged-ts/issues/482), part of the wayfinder map [#457](https://github.com/phmilk/reforged-ts/issues/457). It was observed on 2026-10-05 on the maintainer's Windows 11 machine (OS locale pt-BR, game enUS), on Patch 3.0.0.24268: the World Editor (`World Editor.exe`) and the game client both of that Build. Everything ran on a throwaway copy of the Template's map folder, with the method of [#461](https://github.com/phmilk/reforged-ts/blob/research/world-editor-open-object/docs/research/world-editor-open-object.md) and [#475](https://github.com/phmilk/reforged-ts/blob/research/world-editor-foreign-object-data/docs/research/world-editor-foreign-object-data.md):

- the editor started with `-launch -loadfile`;
- driven by `WM_COMMAND` and mouse window messages;
- reloaded with a second `-launch -loadfile`;
- captured with `PrintWindow`.

The game's side was a Probe run (`pnpm probe:run`). Terms are from `CONTEXT.md`: Rawcode, Object data, Custom object, Built-in object, Object Editor, Studio, Probe, Probe run, Result file.

"Placed" means an object on the terrain: a unit or an item in `war3mapUnits.doo`, a destructable or a doodad in `war3map.doo`. "Deleted" means another tool removed the Custom object from Object data (`war3map.w3*`, `war3mapSkin.w3*` and its `war3map.wts` strings), as the Studio's delete would, and left the placements and `war3map.lua` alone.

## Answer

**The World Editor drops the placements silently.** Loading such a map shows no dialog, no message and no `*` in the title. The placements are simply not there: not drawn on the terrain, and not in the Object Editor. This held for all four kinds: unit `h000`, item `I000`, destructable `B000` and doodad `D000`.

**Its next save writes the map without them:**

- their records go from `war3mapUnits.doo` and `war3map.doo`;
- their `BlzCreateUnitWithSkin`/`BlzCreateItemWithSkin` calls go from `war3map.lua`;
- the pathing map and minimap are recomputed.

Every other placement is kept byte for byte, its creation number included (nothing is renumbered). A second save is byte-identical. Since the map is not marked modified, the files on disk keep the dead placements until the next save, and the next save made for any reason drops them.

**The game loads such a map, and the placements are simply absent at map start.** Built from the map exactly as the other tool left it (Object data gone; `war3mapUnits.doo`, `war3map.doo` and the editor's stale `war3map.lua` still naming the Rawcodes), the map:

- loaded;
- ran its whole `main`, melee initialisation included;
- finished a Probe run without an error.

At map start the world held every Built-in placement (`hfoo`, `ratc`, `LTlt`, and the doodad `LOtr` on screen) and none of the deleted ones. The script's creators return `nil` for a deleted Rawcode, with no error:

- `BlzCreateUnitWithSkin(..., FourCC("h000"), ...)`
- `BlzCreateItemWithSkin(FourCC("I000"), ...)`
- `BlzCreateDestructableWithSkin` for `B000` and `D000`

The editor's next line, `SetItemColor(i, ...)` on that `nil`, raised nothing either. The doodad `D000`, which no Native can list, was not drawn: no placeholder model, nothing at its spot (see [The game](#the-game)).

**For comparison, the World Editor's own delete asks first.** Deleting a Custom object that is placed on the terrain, from the Object Editor, opens a `Warning` box with Yes/No:

- "The map still contains one instance of this custom unit. Continue and delete it?" The same "custom unit" wording appears for an item.
- "… of this custom destructible.", "… of this custom doodad."
- With several placements: "The map still contains %d instances of this custom unit. Continue and delete them?"

Yes deletes the placements with the object, and the save that follows equals the external delete followed by a World Editor save. The only differences are the order of the remaining records and the save counter in `war3map.w3i`.

So the Studio's confirmation can say what is true:

> Deleting `h000` also removes its 1 placement on the terrain. The game skips it already, and the World Editor drops it without asking the next time it saves the map.

That is the same choice the World Editor offers, minus the "No".

## What it means for the Studio

- **The confirmation lists placements by kind**, the way the World Editor's warning does:
  - units and items in `war3mapUnits.doo` (version 13, sub-version 9 on 3.0);
  - destructables and doodads in `war3map.doo` (version 13, sub-version 11).
  - A count needs the type id of each record, the first 4 bytes. On 3.0 a record is not of fixed length: the 115 and 74 bytes seen here are for placements with no inventory, abilities, item drops or random settings, and wc3libs keeps the v13 units file opaque for that reason ([Primary sources](#primary-sources)). So counting needs a reader of the v13 layouts, which `reforged-map` would own.
- **The Studio may leave the placements on disk or remove them; either way the result after the next World Editor save is the same.**
  - Removing them itself (records out of both doo files) makes the files match what the editor would write. It is a write the World Editor never questions: placement records it reads, keeps and writes back as they are.
  - Leaving them is harmless to the game, as observed.
  - In both cases `war3map.lua` keeps the stale `BlzCreate*WithSkin(FourCC("h000"), ...)` lines until the World Editor regenerates the script. The Studio does not write the script.
- **A Rawcode reused before the next World Editor save brings the placements back as the new object.** This is an inference, not run: the editor drops a placement only when its type is unknown at load, and the game creates whatever the script names. #475 saw the editor suggest a removed Rawcode for a new Custom unit, so `h000` deleted and a new `h000` created soon after is likely. The Studio can avoid it by removing the placements when it deletes, or by never suggesting a Rawcode that still has placements.
- **HiveWE behaves differently** ([Primary sources](#primary-sources)). It keeps such placements, and files an unknown unit as an item. It draws them with its "invalid model" placeholder and writes them back on save. Its own object delete removes the placements without asking. A map edited in HiveWE between the Studio's delete and a World Editor save can therefore carry the dead placements further, still harmless to the game.

## What was observed

### Setup: placements of Custom objects made in the editor

- **The copy:** the Template's map folder `reforged-ts-template.w3m` (no Object data, one start location `sloc` in `war3mapUnits.doo`, an empty `war3map.doo`) copied to a scratch folder, with a pristine copy beside it.
- **Four Custom objects** created in the Object Editor with the window messages of #461 (Find 260, New Custom … 8, the name in `Edit` id 12, the Rawcode in the `Object ID` box):
  - `h000` "Deleted Footman" from `hfoo`;
  - `I000` "Deleted Claws" from `ratc`;
  - `B000` "Deleted Tree" from `LTlt`;
  - `D000` "Deleted Doodad" from `LOtr`.
- **Placing an object** worked by selecting it with the Object Editor's Edit > Select In Tool Palette (command 259), then posting `WM_LBUTTONDOWN`/`WM_LBUTTONUP` to the main window (`OsWindow`):
  - The editor places at its last known mouse point, shown in the status bar as `Point: (-699.6, 870.4, 0.0)`, not at the message's coordinates, so every placement landed on that one point.
  - Each kind was placed and saved alone, then the placement undone (Edit > Undo, 256), which gave one canonical record of each kind.
  - One placement of each Custom object and of each base Built-in object (`hfoo`, `ratc`, `LTlt`, `LOtr`) was then composed into both doo files, each at its own position, from the editor's records. The map was reloaded, and a no-edit save made **saved-A**: 5 records in `war3mapUnits.doo` (with `sloc`), 4 in `war3map.doo`. The editor drew all 8 placements.
- **What a save writes for placements, on 3.0:**
  - `war3mapUnits.doo` is `W3do`, version 13, sub-version 9, with 115-byte records for these placements. The record holds the type id, variation, position, angle, scale, then the skin id (equal to the type id) and the creation number at offset 99.
  - `war3map.doo` is version 13, sub-version 11, with 74-byte records, then 8 zero bytes: the special doodads' version and count.
  - Doodad positions are snapped to the grid on save (`-300` became `-320`, `600` became `608`).
  - `war3map.lua` gains `CreateAllItems` (`BlzCreateItemWithSkin(FourCC("I000"), -500.0, 870.0, FourCC("I000"))`, then `SetItemColor(i, ConvertPlayerColor(24))` for `I000`), and `CreateUnitsForPlayer0` (`BlzCreateUnitWithSkin(p, FourCC("h000"), ...)`), called from `main`.
  - **Destructables and doodads get no line in the script**: the game reads them from `war3map.doo`.
  - Doodad `D000`'s name stays in the base `war3map.w3d` (`dnam`, `TRIGSTR_010`), and `war3mapSkin.w3d` lists it with zero modifications; the other kinds put the name in their Skin file, as #461 saw for units.

### The external delete, then the World Editor

**planted-B** was made from saved-A:

- deleted `war3map.w3u/.w3t/.w3b/.w3d` and their `war3mapSkin.*`, each of which held only the deleted object (a map with no Object data has none of these files, as the Template shows);
- removed `STRING 7` to `10`, the four names, from `war3map.wts`;
- left the doo files, `war3map.lua` and every other file as they were.

It was written into the open map folder while the map was unmodified, then reloaded with a second `-launch -loadfile`:

- **No dialog** appeared within 30 seconds of the reload (all top-level windows of the editor were watched). The main window's title had **no `*`**.
- **The terrain** showed `hfoo`, `ratc`, `LTlt` and `LOtr`, and **nothing** at the four other placements.
- **The Object Editor**: Find `h000:` selected nothing.
- **The editor's log** (`Documents\Warcraft III\Logs\War3EditorLog.txt`) is rewritten by every new process, the reloading one included, so it held only that short-lived process's start-up and shut-down, nothing about the running editor's load.

A no-edit save (command 4) made **saved-B**:

| File                                 | After the save                                                                                                                |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `war3mapUnits.doo`                   | 3 records: `sloc`, `hfoo`, `ratc`; `h000` and `I000` gone. The kept records are byte-identical, creation numbers 3 and 4 kept |
| `war3map.doo`                        | 2 records: `LTlt`, `LOtr`; `B000` and `D000` gone. Kept records byte-identical; trailer unchanged                             |
| `war3map.lua`                        | The `I000` creation and its `SetItemColor` line, and the `h000` creation, removed; nothing else changed                       |
| `war3map.wpm`, `war3mapMap.blp`      | Rewritten: the pathing of tree `B000` and the minimap dots of the dropped placements gone                                     |
| `war3map.w3i`                        | Unchanged: the save counter #475 found did not move. The editor did not count this as a save with changes                     |
| Object data, `war3map.wts`, the rest | Byte-identical to planted-B                                                                                                   |

A second no-edit save, **saved-B2**, was byte-identical to saved-B.

### The World Editor's own delete, for comparison

saved-A was written back into the map folder and reloaded. In the Object Editor, each Custom object was selected with Find and deleted with File > Delete Custom … (command 10):

| Kind         | `Warning` box (buttons `&Sim` id 6, `&Não` id 7: Yes, No)                                |
| ------------ | ---------------------------------------------------------------------------------------- |
| Unit         | The map still contains one instance of this custom unit. Continue and delete it?         |
| Item         | The map still contains one instance of this custom unit. Continue and delete it?         |
| Destructable | The map still contains one instance of this custom destructible. Continue and delete it? |
| Doodad       | The map still contains one instance of this custom doodad. Continue and delete it?       |

The texts are the editor's strings `WESTRING_WARNING_CUSTOMUNITSEXIST_ONE`, `…DESTSEXIST_ONE` and `…DOODSEXIST_ONE`. Their plural forms, "The map still contains %d instances of this custom unit. Continue and delete them?" and the same for destructible and doodad, are in [WorldEditStrings.txt](https://github.com/wurstscript/WurstScript/blob/f2d043899e9233a7953e25163ee0775ec7355ca6/HelperScripts/WorldEditStrings.txt#L2084-L2089). That copy dates from before Reforged, and the 3.0 editor showed the same singular text. No item-specific string exists, so an item gets the unit's.

Yes on each removed the placements at once, and the title showed `*`. The save, **saved-C**, compared with saved-B:

- **Object data:** the same. The four Object data pairs were deleted, since the editor writes no file for a kind with no object, and the four strings were removed from `war3map.wts`.
- **Placements:** the same records, but **in another order** (`sloc`, `ratc`, `hfoo` and `LOtr`, `LTlt`). The delete reorders the remaining records.
- **`war3map.w3i`:** its save counter moved (7 to 8).
- **Everything else:** byte-identical.

### The game

The Probe runner's map folder, `probe/probe.w3m` (the Template's), was overwritten locally with planted-B's files: the map exactly as the external delete left it. The scratch Probe `placed-deleted-type` was then run with `pnpm probe:run placed-deleted-type`. Neither the map change nor the Probe was committed: both were reverted after the run, and the Probe's code is [below](#the-probe).

- The first run waited for a **Battle.net login**, which the maintainer gave. Its records were lost to a bug in the Probe: a mask of `0xffffffff` does not fit the game's 32-bit integers. The bug raised inside the enumeration callbacks, where the game swallows errors. Its calls and the screen matched the second run.
- The second run, `90a5a143-00f7-455f-b01e-27b19ae15569`, on client Build 3.0.0.24268, **finished** (`END status=ok`, 14 records). The map loaded, and `BEGIN` came during loading as usual.

Its records:

```text
unit owner=0 type=hfoo x=-700 y=600
unit owner=0 type=unpl x=-1408 y=1728
unit owner=0 type=ugho x=-1312 y=1504
unit owner=0 type=uaco x=-1504 y=1504
unit owner=0 type=uaco x=-1440 y=1504
unit owner=0 type=uaco x=-1376 y=1504
item type=ratc x=-500 y=600
destructable type=LTlt x=-128 y=896
count units=6
call label="BlzCreateUnitWithSkin h000" ok=true result=nil
call label="BlzCreateItemWithSkin I000" ok=true result=nil
call label="BlzCreateDestructableWithSkin B000" ok=true result=nil
call label="BlzCreateDestructableWithSkin D000" ok=true result=nil
name h000="Default string" hfoo=Footman
```

- **Units:** the placed `hfoo`, plus the melee starting units (Undead, the random race) at the start location; no `h000`.
- **Items:** `ratc` only, no `I000`. The script's `SetItemColor(i, ConvertPlayerColor(24))` after the `nil` `I000` raised nothing, since `main` went on to create the units and run the melee initialisation.
- **Destructables:** `LTlt` only, no `B000`.
- **Creators:** each returns `nil` for a deleted Rawcode, without raising.
- **The deleted Rawcode's name** reads `"Default string"`, the game's text for a missing string.
- **Doodads:** no Native lists them. A capture of the game window, the camera on the placements, showed:
  - the tree `LTlt` and the crate `LOtr`;
  - the footman and the item on the row of `hfoo`/`ratc`;
  - nothing at the spots of `h000`, `I000`, `B000` and `D000`: no model, no placeholder.

  The agent read this from the capture. It is the only evidence for `D000`; a human can confirm it by opening `placed-deleted-type` on such a map.

## Primary sources

These support the observation and cover what was not run:

- **The doo formats on 3.0.**
  - [wc3libs, `docs/warcraft-iii-3.0-map-formats.md`](https://github.com/inwc3/wc3libs/blob/0542c4140012dfb872ac01513ff68f5cbef98658/docs/warcraft-iii-3.0-map-formats.md#L13-L14) lists `war3map.doo` as "13 (`0x0D`), sub-version 11 | Structured read/write". It lists `war3mapUnits.doo` as "13 (`0x0D`), sub-versions 9 and 11 observed | Opaque read/write …", because "populated loot/ability/random subrecords diverge from v8. Bytes are preserved rather than partially decoded." On version 13 doodads it says they "require a skin ID, then add one dword before the flags/life bytes. After the legacy editor ID they add four dwords" ([L62-L67](https://github.com/inwc3/wc3libs/blob/0542c4140012dfb872ac01513ff68f5cbef98658/docs/warcraft-iii-3.0-map-formats.md#L62-L67)). That matches the 74-byte records seen here.
  - War3Net names v13 the "2.0.4.23919 format" ([`MapWidgetsFormatVersion.cs`](https://github.com/Drake53/War3Net/blob/18e88f0e1f67e6b16870dcbcd827740275fe2173/src/War3Net.Build.Core/Widget/MapWidgetsFormatVersion.cs#L21-L25)).
  - Neither library checks a placement's type id against Object data; both read it as 4 bytes.
- **HiveWE keeps placements of unknown types.**
  - A unit-file record whose id is not in its unit table is filed as an item: `if (units_slk.row_headers.contains(i.id) || i.id == "sloc" || ...) units.push_back(i); else items.push_back(i);` ([`units.ixx` L243-L248](https://github.com/stijnherfst/HiveWE/blob/cbfd6b32d4dcaa5583c9f360d59617cb12531d10/src/base/units.ixx#L243-L248)).
  - A missing model logs `Missing model file for {}` and loads `Objects/Invalidmodel/Invalidmodel.mdx` ([L499-L509](https://github.com/stijnherfst/HiveWE/blob/cbfd6b32d4dcaa5583c9f360d59617cb12531d10/src/base/units.ixx#L499-L509)). Doodads do the same ([`doodads.ixx` L515-L568](https://github.com/stijnherfst/HiveWE/blob/cbfd6b32d4dcaa5583c9f360d59617cb12531d10/src/base/doodads.ixx#L515-L568)).
  - Its save writes every entry back, at doo version 8 (#471).
  - Deleting an object in its table erases its placements with no prompt (`std::erase_if(units.units, ...)`, [`map.ixx` L543-L553](https://github.com/stijnherfst/HiveWE/blob/cbfd6b32d4dcaa5583c9f360d59617cb12531d10/src/base/map/map.ixx#L543-L553)).
- **Who creates what at map start.** The World Editor converts `war3mapUnits.doo` into `CreateAllUnits` in the script, and map protection deletes `war3mapUnits.doo` while the map still runs ([WC3MapDeprotector help](https://github.com/speige/WC3MapDeprotector/blob/main/help_doc.md)). So the game creates units and items from the script, not from that file. Doodads and destructables come from `war3map.doo`: a map with crates both in the script and in `war3map.doo` got two copies ([wc3edit forum, 2022-08-24](https://forum.wc3edit.net/viewtopic.php?t=38662)). The scripts observed here agree: no line for `B000`, `D000`, `LTlt` or `LOtr`.
- **The editor's strings** ([WorldEditStrings.txt](https://github.com/wurstscript/WurstScript/blob/f2d043899e9233a7953e25163ee0775ec7355ca6/HelperScripts/WorldEditStrings.txt), pre-Reforged copy) also hold "Delete &Invalid Objects" (`WESTRING_MENU_DELINVALIDOBJS`, L2442) and "Debug - Remove Invalid Objects" (L7544). Neither is in the 3.0 editor's menus read here; given what a load does, there would be nothing left for them to remove.
- **The World Editor's own delete removing placements, before Reforged:** "Delete the unit type in the unit editor, this will cause all preplaced units of that type to be deleted." ([Hive Workshop, 2013-01-23](https://www.hiveworkshop.com/threads/world-editor-crash-upon-deleting-unit.229112/)).

No source found described the World Editor's or the game's handling of an unknown placed type; the observation above is the only evidence for both.

## Not determined

- **A Rawcode reused before the World Editor saves** (the third point of [What it means for the Studio](#what-it-means-for-the-studio)) was not run. It is inferred from the drop happening at load only.
- **Placements with inventory, abilities, item drops or random settings**, and a doodad file with special doodads, were not planted. They change the record lengths, not, as far as anything suggests, the drop.
- **A Custom object deleted while a placement of it is linked elsewhere** was not tried: a trigger's `gg_unit_h000_0001` variable, a region or a camera. This ticket puts code out of scope, but the World Editor's trigger data (`war3map.wtg`) can name a placed unit, and what the editor does to such a trigger on load was not observed.
- **The doodad `D000` in game** rests on one capture read by the agent, not on a record.

## Method, step by step

1. Copied the Template's map folder to `scratchpad/we-deleted/maps/`, kept a pristine copy, started the editor on it with `World Editor.exe -launch -loadfile "<folder>"`.
2. Re-invoked Module > Object Editor (`WM_COMMAND` 1795 to the main window), as #461 notes that Find is ignored after a reload until then. Then, per kind:
   - chose the tab (`TCM_SETCURFOCUS` 0 to 3) and Found the base (`hfoo (`, `ratc (`, `LTlt (`, `LOtr (`);
   - created the Custom object (command 8, name, Rawcode);
   - selected it in the Tool Palette (command 259), posted a left click to the main window, and saved (command 4);
   - kept a copy of the folder, then undid the placement (command 256).
3. Composed both doo files from the editor's own records with a Node script, giving each placement its own position and creation number. Wrote them into the map folder and reloaded with a second `-launch -loadfile`. Saved with no edit: saved-A.
4. Deleted the Object data files and strings with a Node script into a copy (planted-B), applied the same deletion to the open folder, reloaded, watched for top-level windows for 30 s, captured the main window, then saved twice (saved-B, saved-B2).
5. Diffed folders with `diff -rq` and printed the doo records with a Node script.
6. Wrote saved-A back, reloaded, deleted each Custom object with command 10, read the `Warning` box's static text and buttons, answered Yes (id 6), and saved (saved-C).
7. Closed the editor with `WM_CLOSE` on an unmodified map.
8. Copied planted-B's files over `probe/probe.w3m` locally, ran `pnpm probe:run placed-deleted-type` (waiting for it to exit), and captured the game window during the Probe's 20-second hold. Restored `probe/probe.w3m` with `git checkout` and removed the Probe.

### The Probe

```ts
// Abridged: the scratch Probe as run, its comments shortened.
import type { ProbeContext } from "../game/probe";

function rawcode(id: number): string {
  // Arithmetic, not shifts: the game's integers are 32-bit (a Rawcode is below 2^31).
  return string.char(
    Math.floor(id / 16777216) % 256,
    Math.floor(id / 65536) % 256,
    Math.floor(id / 256) % 256,
    id % 256,
  );
}

export function run(p: ProbeContext): void {
  p.hold();
  const world = GetWorldBounds()!;
  const g = CreateGroup()!;
  GroupEnumUnitsInRect(g, world, undefined);
  ForGroup(g, () => {
    const [ok, err] = pcall(() => {
      const u = GetEnumUnit()!;
      p.record("unit", {
        type: rawcode(GetUnitTypeId(u)),
        owner: GetPlayerId(GetOwningPlayer(u)!),
        x: Math.floor(GetUnitX(u)),
        y: Math.floor(GetUnitY(u)),
      });
    });
    if (!ok) p.record("error", { message: tostring(err) });
  });
  // EnumItemsInRect and EnumDestructablesInRect the same way, recording "item" and "destructable".
  p.record("count", { units: BlzGroupGetSize(g) });
  p.checkpoint();
  const calls: [string, () => unknown][] = [
    [
      "BlzCreateUnitWithSkin h000",
      () =>
        BlzCreateUnitWithSkin(
          Player(0)!,
          FourCC("h000"),
          0,
          0,
          0,
          FourCC("h000"),
        ),
    ],
    [
      "BlzCreateItemWithSkin I000",
      () => BlzCreateItemWithSkin(FourCC("I000"), 0, 0, FourCC("I000")),
    ],
    [
      "BlzCreateDestructableWithSkin B000",
      () =>
        BlzCreateDestructableWithSkin(
          FourCC("B000"),
          0,
          0,
          270,
          1,
          0,
          FourCC("B000"),
        ),
    ],
    [
      "BlzCreateDestructableWithSkin D000",
      () =>
        BlzCreateDestructableWithSkin(
          FourCC("D000"),
          0,
          0,
          270,
          1,
          0,
          FourCC("D000"),
        ),
    ],
  ];
  for (const [label, call] of calls) {
    p.pending(label);
    p.checkpoint();
    const [ok, result] = pcall(call);
    p.record("call", { label, ok, result: tostring(result) });
  }
  p.record("name", {
    h000: tostring(GetObjectName(FourCC("h000"))),
    hfoo: tostring(GetObjectName(FourCC("hfoo"))),
  });
  p.checkpoint();
  SetCameraPosition(-400, 750);
  p.after(20, () => p.finish());
}
```

## Sources

- Observation on the maintainer's machine, as listed above (Patch 3.0.0.24268).
- [#461 findings](https://github.com/phmilk/reforged-ts/blob/research/world-editor-open-object/docs/research/world-editor-open-object.md) and [#475 findings](https://github.com/phmilk/reforged-ts/blob/research/world-editor-foreign-object-data/docs/research/world-editor-foreign-object-data.md): the method (launch, reload, command ids, Find), the save's canonical form, Rawcodes reused by the editor.
- [#471 findings](https://github.com/phmilk/reforged-ts/blob/research/hivewe-compatibility-and-features/docs/research/hivewe-compatibility-and-features.md): HiveWE writes doo version 8.
- [`probe/README.md`](../../probe/README.md): the Probe runner, the Battle.net login step.
- wc3libs [`docs/warcraft-iii-3.0-map-formats.md`](https://github.com/inwc3/wc3libs/blob/0542c4140012dfb872ac01513ff68f5cbef98658/docs/warcraft-iii-3.0-map-formats.md), War3Net [`MapWidgetsFormatVersion.cs`](https://github.com/Drake53/War3Net/blob/18e88f0e1f67e6b16870dcbcd827740275fe2173/src/War3Net.Build.Core/Widget/MapWidgetsFormatVersion.cs), HiveWE [`units.ixx`](https://github.com/stijnherfst/HiveWE/blob/cbfd6b32d4dcaa5583c9f360d59617cb12531d10/src/base/units.ixx), [`doodads.ixx`](https://github.com/stijnherfst/HiveWE/blob/cbfd6b32d4dcaa5583c9f360d59617cb12531d10/src/base/doodads.ixx), [`map.ixx`](https://github.com/stijnherfst/HiveWE/blob/cbfd6b32d4dcaa5583c9f360d59617cb12531d10/src/base/map/map.ixx): the doo formats and HiveWE's loader.
- [WorldEditStrings.txt](https://github.com/wurstscript/WurstScript/blob/f2d043899e9233a7953e25163ee0775ec7355ca6/HelperScripts/WorldEditStrings.txt) (pre-Reforged copy in the WurstScript repository): the editor's warning strings.
- [WC3MapDeprotector help](https://github.com/speige/WC3MapDeprotector/blob/main/help_doc.md), [wc3edit forum thread](https://forum.wc3edit.net/viewtopic.php?t=38662), [Hive Workshop thread](https://www.hiveworkshop.com/threads/world-editor-crash-upon-deleting-unit.229112/): which file the game creates what from, and the editor's delete before Reforged.
