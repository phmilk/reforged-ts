# The World Editor's previews, imports and missing art

The four screen checks [#481](https://github.com/phmilk/reforged-ts/issues/481) left to a person, done for [#842](https://github.com/phmilk/reforged-ts/issues/842) beside the Asset Mode and Supported Modes checks of [`world-editor-asset-mode.md`](world-editor-asset-mode.md). Each claim is marked **Observed** (seen at the screen or read back from a file in the runs below) or **Inferred** (follows from them, not observed).

## TL;DR

- **The editor's previewer shows a model only while the model dialog is open** (Observed), and it follows the dialog's choice live, before OK. It animates the `Stand` sequence, in Player 1's red. Selecting an object in the Object Editor shows no preview (Observed). The Studio's previews already animate `Stand` in red (Inferred, from its README), so they stay as they are.
- **An import marked DE is written under `_DE.w3mod/` of the map folder, and one marked HD under `_HD.w3mod/`** (Observed). `war3map.imp` lists the same full paths. The Studio reads `_hd.w3mod/` in DE (Inferred, from `src/paths.ts`): [#866](https://github.com/phmilk/reforged-ts/issues/866) corrects it.
- **A model that exists only in DE shows nothing in the game in SD or HD** (Observed): in SD only the unit's shadow, in HD not even that. In DE it is drawn. The editor draws a green-and-black checkered cube in its place. The Studio reports such a model as missing in SD and HD (Inferred, from its path resolution), which matches the game.
- **A texture missing at its path is not found in the model's own folder** (Observed), neither by the editor nor by the game: the model is drawn white. The Studio's resolution order, which does not look there (Inferred, from its README), stays.

## The runs

2026-11-04, Build 3.0.1.24371. Screen checks, which stay for a human ([`probe/README.md`](../../probe/README.md#what-stays-for-a-human)): one person at the World Editor and the game, the files read back from disk; no Probe runs. The game was started from the Battle.net app's Play button or with `-loadfile <map>.w3x -launch`, its graphics mode chosen in Options, Graphics.

### The editor's previewer

- The Object Editor has no preview pane, and its View menu has no previewer: selecting an object there shows nothing.
- The previewer is the main window's left panel, under the minimap: the model's name, Animation, Distance, Rotate and Lighting, each with ◂ ▸ buttons.
- A double-click on Art - Model File opens Edit Unit Value - Model, which offers Preset (category, filter, list), Import and Custom. While it is open, the panel shows the model: the Footman, swaying in `Stand`, in red. Choosing Fel Orc Grunt in the list, without OK, shows `ChaosGrunt` at once, and Distance moves from 400 to 500.
- The dialog is modal, so the panel's buttons cannot be clicked while it is open. Once it closes, the panel is empty.

### Imports by mode

- The Asset Manager (Module, F12) lists each import with its Mode. Import Files writes each one to `war3mapImported\` as SD. Modify File Properties only renames it, and a click on the Mode cell offers SD, HD and DE.
- Three text files imported, one set to each mode, and the map saved as a folder:

| Mode | Full Path in the Asset Manager          | On disk                                 |
| ---- | --------------------------------------- | --------------------------------------- |
| SD   | `war3mapImported\test-sd.txt`           | `war3mapImported/test-sd.txt`           |
| HD   | `_HD.w3mod\war3mapImported\test-hd.txt` | `_HD.w3mod/war3mapImported/test-hd.txt` |
| DE   | `_DE.w3mod\war3mapImported\test-de.txt` | `_DE.w3mod/war3mapImported/test-de.txt` |

- `war3map.imp`, format 1, holds three entries, each flagged `0x15` and naming the full path above.

### Models only in DE

- Of the Built-in objects of the Game data set `custom-fk`, 535 name a model the storage holds in `_DE` alone (Observed): 41 units, 34 destructables, 133 doodads and 327 items, 231 models in all. That is their model field (`umdl`, `bfil`, `dfil`, `ifil`) read through the Studio's path resolution (`createPathResolver`) in each art layer, found in DE and not in SD or HD. #481 counted 170 of the models Built-in objects name; this count reads more fields and every object, so the two differ.
- One map with a Footman (`hfoo`), an Inquisitor (`sinq`, `ScarletInvoker`) and a Deathguard (`fdtg`), its Supported Modes 7, played in each graphics mode. `War3Preferences.txt` `[Misc] hd` read 0, 1 and 2:

| Graphics mode      | Footman | Inquisitor and Deathguard  |
| ------------------ | ------- | -------------------------- |
| Classic            | drawn   | their shadow only          |
| Reforged           | drawn   | nothing, not even a shadow |
| Definitive Edition | drawn   | drawn                      |

- In the editor, running in SD, both are checkered cubes, with "Could not load file: units\human\ScarletInvoker\ScarletInvoker.mdl" in the status bar.

### A texture missing at its path

- Two copies of `War3.w3mod:Doodads/LordaeronSummer/Props/WheelBarrel/WheelBarrel.mdx`, an SD model with one texture. In one copy the texture path became `war3mapImported\Check842.dds`, in the other `Missing842\Check842.dds`. `Check842.dds` is `ReplaceableTextures/TeamColor/TeamColor00.dds`, solid red.
- All three were imported to `war3mapImported\`, the models' own folder, where the texture sits. The control model went on the Footman and the test model on the Inquisitor.
- The editor's previewer draws the control red and the test white. In the game, in Classic, the Footman is a red wheelbarrow and the Inquisitor a white one.

## Not settled here

- Whether a DE-only model shows in the game when its map's Supported Modes leave DE out.
- Whether the editor's Variation and team colour controls exist in this Build: the panel showed none.
