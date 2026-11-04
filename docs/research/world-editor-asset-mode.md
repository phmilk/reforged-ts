# The World Editor's Asset Mode

What the World Editor's Asset Mode preference and a map's Supported Modes mean, checked at the screen for [#842](https://github.com/phmilk/reforged-ts/issues/842), the first of its checks. The Studio's art layer (`packages/reforged-studio/src/art-layer.ts`, #845) reads `[Misc] assetMode` of `Documents\Warcraft III\WorldEditPreferences.txt` as 0 SD, 1 HD and 2 DE; it read -1 (Default) as the same section's `hd` until [#860](https://github.com/phmilk/reforged-ts/issues/860) made it SD. Each claim is marked **Observed** (seen at the screen or read back from the file in the runs below) or **Inferred** (follows from them, not observed).

## TL;DR

- **Choosing SD, HD and DE in General, Asset Mode writes `[Misc] assetMode` 0, 1 and 2** (Observed), and the editor reopened on 0 runs in SD (Observed, run 4). That 1 and 2 run the editor in HD and DE is the list's order, not seen after a reopen (Inferred). The art layer reads them so.
- **-1 is Default, and the editor runs in SD under it** (Observed through the star rule of runs 3 and 4, below), whatever the editor's `[Misc] hd`, the game's graphics mode and the Test Map's Asset Mode. The art layer read -1 as `[Misc] hd`, 1 in every file seen, so it previewed in HD where the editor shows SD, until [#860](https://github.com/phmilk/reforged-ts/issues/860) made it SD.
- **The list stars the choices of the asset family the editor has not loaded** (Observed): it starred SD while the terrain showed HD art (run 3), and HD and DE once the editor reopened with Classic terrain (run 4). The star marks the choices that need a restart (Inferred).
- **The list cannot choose Default** (Observed): it holds SD, HD and DE only, and shows an empty box when the file holds -1. The editor writes -1 before the first choice: a copy of the file from 2026-10-29 holds `assetMode=-1`.
- **`[Misc] hd` of the editor's file does not move** (Observed): it stayed 1 through every choice of General and Test Map and both graphics modes of the game.
- **The Test Map's Asset Mode is `[Test Map] hd`, a separate value** (Observed): Default wrote 0 and HD 2. It does not change the editor's mode.
- **The game's graphics mode is `[Misc] hd` of `War3Preferences.txt`** (Observed): 0 with Classic chosen, 1 with Reforged.
- **A map's Supported Modes are a bit mask, 1 SD, 2 HD, 4 DE** (Observed, [below](#the-maps-supported-modes)): the Supported Modes are three boxes set each on its own, and four saves wrote 1, 4, 6 and 7. The World Editor's default, 3, is then SD and HD without DE (Inferred from the mask). The art layer reads 3 as All Modes and has no entry for 5, 6 or 7: [#864](https://github.com/phmilk/reforged-ts/issues/864) corrects it.

## The runs

2026-11-04, Build 3.0.1.24371. A screen check, which stays for a human ([`probe/README.md`](../../probe/README.md#what-stays-for-a-human)): one person chose each value at the screen and the files were read back after the editor closed; no Probe runs. Runs 4 to 7 each open the editor anew. The star rule comes from runs 3 and 4, where the terrain was seen: the list stars SD while HD art is loaded and HD and DE while Classic art is; runs 5 to 7 read the editor's mode from the stars alone.

| Run | Change                                                                     | `assetMode` | Editor's `[Misc] hd` | Editor's mode                    |
| --- | -------------------------------------------------------------------------- | ----------- | -------------------- | -------------------------------- |
| 1   | General, Asset Mode: SD                                                    | 0           | 1                    | Not read: no reopen              |
| 2   | General, Asset Mode: HD                                                    | 1           | 1                    | Not read: no reopen              |
| 3   | General, Asset Mode: DE                                                    | 2           | 1                    | HD art loaded (SD starred)       |
| 4   | General, Asset Mode: SD, then reopen                                       | 0           | 1                    | SD (Classic art; HD, DE starred) |
| 5   | `assetMode=-1` by hand, game on Classic (`War3Preferences.txt` `hd=0`)     | -1          | 1                    | SD (HD and DE starred)           |
| 6   | Same, game on Reforged (`War3Preferences.txt` `hd=1`), editor opened after | -1          | 1                    | SD (HD and DE starred)           |
| 7   | Same, Test Map, Asset Mode: HD (`[Test Map] hd` 0 to 2), reopen            | -1          | 1                    | SD (HD and DE starred)           |

## The map's Supported Modes

Scenario, Map Options, Options shows the Supported Modes as three boxes, SD, HD and DE, each set on its own; a new map has SD and HD set (Observed). One map was saved per combination below, as a folder or as a `.w3x` archive, and the Supported Modes int32 of its `war3map.w3i` read back with `readSupportedModes` of `reforged-map`; for a `.w3x`, `war3map.w3i` was first taken out of the archive with the Probe runner's `openArchive` (`probe/src/pack.ts`) into a folder. Same day and Build as the runs above.

| Boxes set                | Saved as                                          | Supported Modes |
| ------------------------ | ------------------------------------------------- | --------------- |
| SD                       | `.w3x`                                            | 1               |
| DE                       | `.w3x`                                            | 4               |
| HD, DE                   | `.w3x`                                            | 6               |
| SD, HD, DE               | folder                                            | 7               |
| SD, HD (new map default) | `editor-objects.w3m`, a fixture of `reforged-map` | 3               |

An enumeration with 3 as All Modes would store 3 for all three boxes; 7 is the sum of 1, 2 and 4. HD alone, 2, and SD and DE, 5, were not saved (Inferred from the mask). The default's 3 is the fixture's, a map the 3.0 World Editor saved, not a save of this day.

## Not settled here

- Whether 1 and 2 run the editor in HD and DE after a reopen.
- The values of `[Test Map] hd` for SD and DE: 1 and 3 by the list's order (Inferred), not written back.
- Whether the World Editor lets a map clear all three boxes, and what 0 then means.
