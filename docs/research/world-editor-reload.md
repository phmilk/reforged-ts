# The World Editor reload

How to make a World Editor that holds a map folder load what another tool wrote there, checked at the screen for [#871](https://github.com/phmilk/reforged-ts/issues/871). `reforged-map`'s `reloadWorldEditor` (`packages/reforged-map/src/world-editor-reload.ts`) followed `-launch -loadfile <map folder>` alone until #871, and the Studio's toast said "The World Editor reloads the map." after it; the walk of [#843](https://github.com/phmilk/reforged-ts/issues/843) found that the World Editor mostly refused it ([`studio-walk.md`](studio-walk.md)). Each claim is marked **Observed** (seen at the screen or read back from the map folder in the sends below) or **Inferred** (follows from them, not observed).

## TL;DR

- **`-launch -loadfile <folder>` does not reload a map the World Editor holds** (Observed): with the map loaded and no unsaved edits, it shows a modal titled `Warning`, "The file '<path>' is already open and active.", and keeps the map as it loaded it. The walk saw it reload only right after the World Editor had saved the map itself, and the warning showed then too ([`studio-walk.md`](studio-walk.md)).
- **The World Editor holds several maps at once** (Observed). Another path to the same folder, a directory junction, opens a second document, listed beside the first in the Window menu, with no warning. A send of the first path then switches back to that document, which keeps what it loaded before: alternating paths is not a reload.
- **File, Close Map, then `-launch -loadfile`, reloads every time** (Observed, four cycles in a row). Close Map is `WM_COMMAND` 64189 on the main window (Ctrl+W, read from the menu with `GetMenu` and `GetMenuItemID`). Posted while the map holds no unsaved edits, it closes the map with no prompt; the `-loadfile` of the same path then loads what is on disk. Loading this way wrote nothing to the map folder.
- **With unsaved edits, Close Map asks first** (Observed): a modal titled `Warning`, "Save changes to '<path>'?", with three buttons whose texts follow the Windows language (Sim, Não, Cancelar here). `BM_CLICK` on its control 2, `IDCANCEL`, cancels it: the map stays open with its edits and the ` *` of its title.
- **Close Map must be posted, not sent** (Observed): `SendMessage` blocks until the prompt is answered, `PostMessage` returns at once.
- **The main window's title tells each step** (Observed): `Warcraft III World Editor - [<path>]` while it holds the map, ` *]` once it holds unsaved edits, and `Warcraft III World Editor` with no path once Close Map closed it.
- **So the reload is** (Inferred, what `reloadWorldEditor` does since #871): only when a main window's title shows the map folder without ` *`, post Close Map to that window, wait for its title to drop the path, run `-launch -loadfile`, and wait for a title to show the path again. A `Warning` after either step means no reload: press its control 2 (control 1 on a box with one button) and say so.

## The sends

2026-11-10, Build 3.0.1.24371. A screen check, which stays for a human ([`probe/README.md`](../../probe/README.md#what-stays-for-a-human)): one person at the World Editor, the sends scripted from WSL through `powershell.exe` (`PostMessage`, `SendMessage`, `EnumWindows`, `GetMenu` and `GetMenuItemID` from `user32.dll`); no Probe runs. The test map was a copy of `probe/probe.w3m`, `reload.w3m`. Before each send, the type of its one preplaced unit was rewritten in `war3mapUnits.doo` (Footman, Knight, Rifleman, Peasant), so that a reload shows on the terrain without opening a dialog. Opening Scenario, Map Description marks the map modified (` *` in the title) even after Cancel, so it cannot serve as the marker.

| Send                                                    | The World Editor before it                 | Result                                                                                                  |
| ------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `-launch -loadfile …\reload.w3m`                        | just loaded it by `-loadfile`, no edits    | `Warning` "The file '…\reload.w3m' is already open and active.", no reload                              |
| `-launch -loadfile …\junction.w3m` (`mklink /J` to it)  | holding `reload.w3m`                       | no warning; a second document, the Window menu lists `reload.w3m` and `junction.w3m`                    |
| `-launch -loadfile …\reload.w3m`                        | holding both documents                     | switches back to `reload.w3m`, which keeps what it loaded before: no reload                             |
| Close Map posted, then `-launch -loadfile …\reload.w3m` | holding the map, no edits (Knight on disk) | closed with no prompt, title `Warcraft III World Editor`; then loaded: the Knight, one map in Window    |
| Same                                                    | Same (Rifleman on disk)                    | Same: the Rifleman                                                                                      |
| Same                                                    | Same (Footman on disk)                     | Same: the Footman                                                                                       |
| Same                                                    | Same (Peasant on disk)                     | Same: the Peasant                                                                                       |
| Close Map posted                                        | holding the map with unsaved edits (` *]`) | `Warning` "Save changes to '…\reload.w3m'?", three buttons; `BM_CLICK` on control 2: map and edits kept |
| Close Map sent with `SendMessage`                       | Same                                       | the send blocks until the prompt is answered                                                            |

None of the four Close Map cycles wrote a file to the map folder (Observed).

## Not settled here

- **A write nobody asked for.** Once, at 17:10:16, the World Editor rewrote the whole map folder with nobody saving: it recreated `conversation.json` and wrote `_Locales/` and `war3mapImported/` (Observed). The write came near the junction send, while two documents were open; what set it off is not known. No send of the Close Map cycles wrote anything.
- How long a large map takes to show again after `-loadfile`: the test map is small, and nothing was timed. `reloadWorldEditor` waits up to 10 seconds by default (`loadTimeout`) and says `"not-loaded"` past it.
- How late a `Warning` can follow the title showing the map again: `reloadWorldEditor` reads the windows once more a poll (250 milliseconds) after the title, and a later `Warning` is not caught, the result staying `"reloaded"`. None showed after a Close Map cycle.
- Whether a World Editor dialog other than `Warning` can follow `-loadfile` on a map closed first: none showed in the four cycles.
- Whether the title `Warning` and the control ids hold under every Windows language: here the title was `Warning` while the buttons followed the Windows language, Portuguese (Observed); other languages were not checked.
- Whether the World Editor's own dialogs ever show a title other than `Warning` for these two prompts, and whether the "already open" box's one button is control 1 or 2: `reloadWorldEditor` presses control 2, else control 1 (Inferred from the standard message box ids, not read).
