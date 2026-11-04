# The World Editor's Asset Mode

What the World Editor's Asset Mode preference means, checked at the screen for [#842](https://github.com/phmilk/reforged-ts/issues/842), the first of its checks. The Studio's art layer (`packages/reforged-studio/src/art-layer.ts`, #845) reads `[Misc] assetMode` of `Documents\Warcraft III\WorldEditPreferences.txt` as 0 SD, 1 HD, 2 DE, and -1 (Default) as the same section's `hd`. Each claim is marked **Observed** (seen at the screen or read back from the file in the runs below) or **Inferred** (follows from them, not observed).

## TL;DR

- **`[Misc] assetMode` 0, 1 and 2 are SD, HD and DE** (Observed): choosing each in General, Asset Mode wrote that value. The art layer reads them right.
- **-1 is Default, and the editor runs in SD under it** (Observed), whatever the editor's `[Misc] hd`, the game's graphics mode and the Test Map's Asset Mode. The art layer reads -1 as `[Misc] hd`, 1 in every file seen, so it previews in HD where the editor shows SD: [#860](https://github.com/phmilk/reforged-ts/issues/860) corrects it.
- **The list cannot choose Default** (Observed): it holds SD, HD and DE only, and shows an empty box when the file holds -1. The editor writes -1 before the first choice: a copy of the file from 2026-10-29 holds `assetMode=-1`.
- **`[Misc] hd` of the editor's file does not move** (Observed): it stayed 1 through every choice of General and Test Map and both graphics modes of the game.
- **An asterisk marks the choices that need a restart** (Inferred): the list starred SD while the editor ran in HD, and HD and DE while it ran in SD.
- **The Test Map's Asset Mode is `[Test Map] hd`, a separate value** (Observed): Default wrote 0 and HD 2. It does not change the editor's mode.
- **The game's graphics mode is `[Misc] hd` of `War3Preferences.txt`** (Observed): 0 with Classic chosen, 1 with Reforged.

## The runs

2026-11-04, Game version 3.0.1.24371, one person at the screen; the editor reopened between the runs that read its mode. The editor's mode is read from the asterisk of General, Asset Mode, as the TL;DR infers it, and from its terrain.

| Run | Change                                                          | `assetMode` | `[Misc] hd` | Editor's mode |
| --- | --------------------------------------------------------------- | ----------- | ----------- | ------------- |
| 1   | General, Asset Mode: SD                                         | 0           | 1           |               |
| 2   | General, Asset Mode: HD                                         | 1           | 1           |               |
| 3   | General, Asset Mode: DE                                         | 2           | 1           | HD or DE      |
| 4   | General, Asset Mode: SD, then reopen                            | 0           | 1           | SD            |
| 5   | `assetMode=-1` written by hand, game on Classic (`hd=0`)        | -1          | 1           | SD            |
| 6   | Same, game on Reforged (`hd=1`), editor opened after it         | -1          | 1           | SD            |
| 7   | Same, Test Map, Asset Mode: HD (`[Test Map] hd` 0 to 2), reopen | -1          | 1           | SD            |

## Not settled here

- The values of `[Test Map] hd` for SD and DE: 1 and 3 by the list's order (Inferred), not written back.
- The map's Supported Modes in `war3map.w3i`, the other half of [#842](https://github.com/phmilk/reforged-ts/issues/842)'s comment: whether 3 is All Modes of an enumeration or SD and HD of a bit mask.
