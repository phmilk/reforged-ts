# Preload file writing on 3.0.0: limits, rewrites during a game, and ending the game from script

Research note for ticket [#298](https://github.com/phmilk/reforged-ts/issues/298), part of the map [#296](https://github.com/phmilk/reforged-ts/issues/296) (Probe runner and the nullability sweep). Facts only, no decision. Feeds the runner contract and the checkpoint format of the Probe runner.

Written 2026-09-29. Every fact is marked:

- **Measured**: seen in bytes written by Warcraft III 3.0.0 on the maintainer's machine, or in results posted on this repo's tickets. The source names the file or ticket.
- **Reported**: stated by a community source (jassdoc, Hive Workshop, Blizzard forum) or inferred from the Patch files, not seen on 3.0.0. Each reported fact the runner relies on is listed as a candidate check for the first Probe run (section 8).

Vocabulary: **Probe** = a script that runs in the real game, measures facts and writes a result file. **Probe run** = one execution of a Probe through the runner. **Patch** = a released game version with its build number (3.0.0.24268). **Native** = a function the game exposes to map scripts, declared in `common.j`.

Measured sources used throughout:

- **#9 file**: `CustomMapData\reforged-probe.txt`, written by `docs/research/probe-map.lua` on 3.0.0 (2026-09-23), 82 `Preload` lines; its content is posted on [#9](https://github.com/phmilk/reforged-ts/issues/9).
- **#129 files**: `CustomMapData\rts-129-newline.txt` and `rts-129-icon.txt`, written by the library's `File` (`packages/reforged-ts/src/system/file.ts`) on 3.0.0.24268 (2026-09-25); results posted on [#53](https://github.com/phmilk/reforged-ts/issues/53#issuecomment-5835736649).
- **Third-party files**: files that published maps wrote into the same folder on this machine after 3.0.0 was released (2026-09-12): `WotLK RPG Saves - Live\` (2 save files and 50 backups, 2026-09-22 to 09-23), `TowerSurvivors1249TEST\SaveSlot_Manual.pld`, `Direct Strike Reforged\Erestor#1411\Save2.txt`, `FileTester.pld`. Their scripts were not read, only their output.
- **Patch files**: `packages/reforged-types/vendor/3.0.0.24268/{common.j,blizzard.j}` (from [jass-history](https://github.com/Luashine/jass-history) tag `Reforged-v3.0.0.24268-w3-3a9d8f2`), compared with the 2.0.3 files of the same repository at commit `3e36339` (`Reforged-v2.0.3.22904-w3t`).

---

## 1. Answers in one table

| Question                                 | Answer                                                                                                                     | Status                                                 |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Where the file lands                     | `<Documents known folder>\Warcraft III\CustomMapData\<name>`; subfolders in the name are created                           | Measured (2.1)                                         |
| Allowed extensions                       | `.txt` and `.pld`                                                                                                          | Both measured to work; "only these two" reported (2.1) |
| On-disk format                           | fixed JASS wrapper, one `\tcall Preload( "<string>" )\r\n` per call, string bytes raw except `\` doubled                   | Measured (2.2)                                         |
| Encoding                                 | bytes passed through, UTF-8 stays UTF-8, no BOM                                                                            | Measured (2.3)                                         |
| Longest string seen written intact       | 238 bytes                                                                                                                  | Measured (3.1)                                         |
| Limit per `Preload` string               | 259 characters; beyond it the string is dropped (one report) or truncated (another)                                        | Reported (3.1), candidate C1                           |
| Lines per file                           | no limit reported; 82 lines measured; a 999,999-character save reported to work                                            | 82 measured, rest reported (3.2), candidate C3         |
| Several `PreloadGen*` cycles in one game | work; the same name is overwritten each time                                                                               | Measured (4.1)                                         |
| Buffer after `PreloadGenEnd`             | not cleared: `PreloadGenClear` is needed before each rewrite                                                               | Reported (4.2), candidate C4                           |
| Written at once                          | the file is on disk right after the call, while the game still runs (read back in the same game; file times)               | Measured, indirectly (4.3); crash case is candidate C5 |
| `"` in a string                          | written raw, not escaped                                                                                                   | Measured (5)                                           |
| `\` in a string                          | written doubled, `\\`                                                                                                      | Measured (5)                                           |
| LF in a string                           | written as a raw LF inside the literal                                                                                     | Measured (5)                                           |
| `%` in a string                          | written raw, harmless at run time                                                                                          | Measured (5)                                           |
| NUL, CR                                  | NUL ends the string; CR written raw                                                                                        | Reported (5), candidate C6                             |
| Ending the game from script              | `EndGame(doScoreScreen)` ends every Blizzard victory/defeat path (or `ChangeLevel`); no Native quits the program           | Reported / read from `blizzard.j` (6), candidate C8    |
| 3.0.0 changes                            | none to the Preload Natives or the folder; `BlzPreloadModelCinematicGame` is new; `CustomDefeatDialogBJ` reordered buttons | Measured from the Patch files (7)                      |

---

## 2. The file on disk

### 2.1 Folder, name, extension

- **Measured**: all the files above are in `C:\Users\night\OneDrive\Documentos\Warcraft III\CustomMapData`. Windows reports this machine's Documents known folder as `C:\Users\night\OneDrive\Documentos` (`[Environment]::GetFolderPath('MyDocuments')` and the `Personal` value of `HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders` both return it). `C:\Users\night\Documents\Warcraft III` also exists but holds only a `Maps` folder (created 2026-09-23) and no `CustomMapData`. So the game follows the redirected known folder; a reader built on `%USERPROFILE%\Documents` would look in the wrong place.
- **Measured**: subfolders are created on write, including names with spaces and `#`, two levels deep (`Direct Strike Reforged\Erestor#1411\Save2.txt`, `WotLK RPG Saves - Live\Backups\...`).
- **Measured**: both `.txt` (#9, #129 files) and `.pld` (third-party files) are written.
- **Reported**: only `.txt` and `.pld` are accepted, other extensions write nothing (since 1.28.2: anufis, 2017-05-10, "PreloadGenEnd works, you just need to specify file with .pld extension", [Hive 293658](https://www.hiveworkshop.com/threads/warcraft-iii-patch-1-28-2.293658/); the rule is restated in the `File` doc comment, inherited from w3ts). Relative paths, UNC paths and drive letters write nothing on Reforged; the filename is limited to 259 characters (MAX_PATH) ([jassdoc `PreloadGenEnd`](https://github.com/lep/jassdoc/blob/master/common.j)). The old Hive statement that a path without a folder goes to `Warcraft III\Logs` (WaterKnight, 2014, [Hive 252220](https://www.hiveworkshop.com/threads/preload-natives.252220/)) is pre-Reforged and contradicted by the measured files, which have no folder and land in `CustomMapData`.

### 2.2 Exact bytes

**Measured** (`od -c` of the #9 file, and `cat -A` of every file listed above). Every file has this shape, where `\t` is a tab, `\r\n` CR LF and `\n` a bare LF:

```text
function PreloadFiles takes nothing returns nothing\n
\r\n
\tcall PreloadStart()\r\n
\tcall Preload( "<string 1>" )\r\n
\tcall Preload( "<string 2>" )\r\n
...
\tcall PreloadEnd( <seconds> )\r\n
\n
endfunction\n
\n
\r\n
```

- One line per `Preload` call, in call order, with `<string>` being the bytes passed to `Preload` except that each `\` is doubled (section 5). The wrapper lines use CR LF except the four bare-LF places shown.
- Inferred, not measured: a file written with no `Preload` call has the same wrapper with no `Preload` line (every measured file has it, from 2 to 82 `Preload` lines).
- `<seconds>` is one decimal (`0.0`, `2098.6`). **Measured**: it is `0.0` when `PreloadGenStart`, the `Preload` calls and `PreloadGenEnd` run in one go (#9 and #129 files). In the WotLK saves it grows by the wall time between writes: backups 17 to 20 were written at 01:42:59.77, 01:44:49.73, 01:44:58.52, 01:48:17.59 and hold `3015.5`, `3125.5`, `3134.2`, `3333.3` (differences 110.0/109.96, 8.7/8.78, 199.1/199.07 seconds). **Reported**: it is the wall time since `PreloadGenStart` ([jassdoc `PreloadGenStart`, `PreloadGenEnd`](https://github.com/lep/jassdoc/blob/master/common.j)); that map presumably calls `PreloadGenStart` once. The value is not readable from the API and carries no information the runner needs.

### 2.3 Encoding

- **Measured**: bytes are passed through. The #9 file holds `utf8.char(0x263A)` as the three bytes `E2 98 BA`, so UTF-8 text stays UTF-8. There is no BOM (the file starts with `function`).

---

## 3. Limits

### 3.1 Length of one `Preload` string

- **Measured**: the longest string found written intact on this machine is 238 bytes (a line of `WotLK RPG Saves - Live\Marksmanship Hunter.pld`, including its injected `")` prefix and `//` suffix); others: 226 (`SaveSlot_Manual.pld`), 178 (`Save2.txt`), 118 (#9 file). No string longer than 238 bytes has been seen on 3.0.0.
- **Reported**: "A preload line is limited to 259 chars" (WaterKnight, 2014-05-20, [Hive 252220](https://www.hiveworkshop.com/threads/preload-natives.252220/)); jassdoc `Preload`: "Max length: 259 characters (see Windows MAX_PATH)" ([jassdoc](https://github.com/lep/jassdoc/blob/master/common.j)). The limit comes from `Preload` treating its argument as a file path to read ahead.
- **Reported, conflicting** about what happens beyond it: Luashine, 2022-04-16: "such Preload calls are dismissed instantly" (the whole string dropped, [Hive 252220](https://www.hiveworkshop.com/threads/preload-natives.252220/)); the Stable Lua FileIO (Trokkin, updated by Antares 2025-11-15, [Hive 360424](https://www.hiveworkshop.com/threads/stable-lua-fileio.360424/)) says "Backslashes increase preload string size in file, causing the suffix to get swallowed", which reads as truncation after escaping, and sizes chunks as `255 - #RAW_PREFIX - #RAW_SUFFIX`. Other systems use smaller chunks: 256 minus prefix and suffix ([FileIO Lua-optimized, Hive 347049](https://www.hiveworkshop.com/threads/fileio-lua-optimized.347049/)), 200 (TriggerHappy's vJASS FileIO, `PreloadLimit = 200`, [Hive 307568](https://www.hiveworkshop.com/threads/fileio.307568/)). This repo's `File` uses 259 bytes before backslash doubling, untested at the boundary (#129 wrote 13 and 53 bytes).
- Whether the limit counts bytes or characters, before or after `\` doubling, and whether an over-long string is dropped or cut: unknown on 3.0.0, candidate **C1**/**C2**. Until then, a line of at most 200 bytes with no `\` is inside every report and below the 238 bytes measured.

### 3.2 Lines per file, file size

- **Measured**: 82 `Preload` lines, 4,841 bytes (#9 file); 14 lines (WotLK). No larger file written by the game has been seen.
- **Reported**: no source states a per-file line limit. The Lua-optimized FileIO reports stress tests that saved "hundred kilobytes of a string in one go", one reaching 999,999 characters ([Hive 347049](https://www.hiveworkshop.com/threads/fileio-lua-optimized.347049/)), which at its chunk size is about 4,000 `Preload` calls in one file. Candidate **C3**.
- **Reported**: each `Preload` call also asks the game to read the named file ahead, in a background thread, once per name ([jassdoc `Preload`](https://github.com/lep/jassdoc/blob/master/common.j); Luashine in [Hive 252220](https://www.hiveworkshop.com/threads/preload-natives.252220/)). A result line is not an existing file, so this should cost a failed lookup per line; the time of a large write is part of C3.

---

## 4. Rewriting during a game

### 4.1 Several write cycles, same name

- **Measured**: the WotLK map wrote `Account Wide Data.pld` and `Marksmanship Hunter.pld` 25 times each over two evenings, overwriting the same two names and writing numbered backups, sometimes 9 seconds apart (backups 18 and 19 at 01:44:49 and 01:44:58), and the two files of one save within 7 ms of each other. The `PreloadEnd` value advancing with wall time inside a sequence (2.2) shows several saves in one game. The final `Marksmanship Hunter.pld` is identical in size and `Save Index: 25` to backup 25, so the last write to a name replaces the earlier content, not appends to it.
- **Measured**: the #129 map wrote two different files in one game (`rts-129-newline.txt`, `rts-129-icon.txt`, same minute), each with its own `PreloadGenClear`/`PreloadGenStart`/`PreloadGenEnd` cycle (`File.writeRaw`), and both are complete on disk.
- **Reported**: "The same file can be written multiple times in one game session without issues" (TriggerHappy's FileIO test examples, [Hive 307568](https://www.hiveworkshop.com/threads/fileio.307568/)); jassdoc `PreloadGenEnd`: "The file is overwritten."

### 4.2 The buffer is not cleared by `PreloadGenEnd`

- **Reported**: `PreloadGenEnd` "Does not clear the buffer or timer after flushing"; `PreloadGenStart` "does not clear the previous buffer"; `PreloadGenClear` "Clears all added file paths from the current preload buffer. Does not reset the timer" ([jassdoc](https://github.com/lep/jassdoc/blob/master/common.j)). An older report says `PreloadGenStart` clears the buffer (WaterKnight, 2014, [Hive 252220](https://www.hiveworkshop.com/threads/preload-natives.252220/)); jassdoc is the more recent and specific source.
- Consequence either way: a rewrite that calls `PreloadGenClear` then `PreloadGenStart` first (as `File.writeRaw` and the #9 probe do) writes exactly its own lines. Whether skipping `PreloadGenClear` repeats the earlier lines is candidate **C4**; it only matters if the runner wants to append by not clearing.

### 4.3 Is the file on disk at once?

- **Measured, indirectly**: in #129 run 1 the newline file did not exist before the write (read `undefined`), and a `Preloader` read after the write, in the same game, returned its content: the file was on disk and readable while the game was still running. The WotLK file times (two files 7 ms apart, each time matching the in-file clock to 0.1 s) show the write happens at the call, not at game end.
- **Not measured**: a game crash right after `PreloadGenEnd`. Data handed to Windows by a completed write survives the crash of the process that wrote it (it is in the OS file cache, lost only on power loss or an OS crash); what is not known is whether `PreloadGenEnd` completes the write before it returns or hands it to a thread. Candidate **C5**.
- **Reported, affects reading back only**: `Preloader` caches a file it has read; since 1.35/1.36 the cache is cleared on map load or restart, and "Subsequent calls will execute old data (tested v2.0.3.22988)" ([jassdoc `Preloader`](https://github.com/lep/jassdoc/blob/master/common.j), [Blizzard forum](https://us.forums.blizzard.com/en/warcraft3/t/bug-preload-files-are-being-cache%E2%80%99d/29413/35)); the Lua-optimized FileIO says "the aggressive caching still applies" to save-then-load in one game ([Hive 347049](https://www.hiveworkshop.com/threads/fileio-lua-optimized.347049/)). A Probe must not use `Preloader` on its own result file to check a checkpoint; the agent reads the file from disk.

---

## 5. Characters

What happens to each byte of a `Preload` string, and what it does to a reader that parses `\tcall Preload( "<string>" )\r\n` lines:

| Byte                                             | Written as                                                                                                                        | Status                                                                                                                                                                                                                                       | Effect on a line parser                                                                                                                                            |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `\` (0x5C)                                       | `\\`                                                                                                                              | Measured: #129 icon file holds `ReplaceableTextures\\CommandButtons\\BTNMagicLariet.blp` for a path with single backslashes; #53 comment "`Preload` doubled the backslashes". Reported: jassdoc "Backslashes ... are always escaped as `\\`" | undo `\\` to `\`; doubles the byte count (section 3.1)                                                                                                             |
| `"` (0x22)                                       | raw `"`                                                                                                                           | Measured: every third-party file and `FileTester.pld` hold raw quotes from injected `")` prefixes. Reported: jassdoc "It does not escape double-quotes on purpose"                                                                           | a `" )` followed by CR LF inside a string ends the line early; a lone `"` is harmless to a parser that takes everything up to the final `" )\r\n`                  |
| LF (0x0A)                                        | raw LF                                                                                                                            | Measured: #129 newline file holds `linha1<LF>linha2` inside the literal                                                                                                                                                                      | the result spans two physical lines, ended by LF, not CR LF                                                                                                        |
| CR (0x0D)                                        | raw CR (reported: "All other characters are output as is. Be careful with ... line feed (0x0a), carriage return (0x0d)", jassdoc) | Reported, candidate C6                                                                                                                                                                                                                       | a CR LF inside a string is indistinguishable from the end of a line                                                                                                |
| NUL (0x00)                                       | ends the string, rest dropped                                                                                                     | Reported (jassdoc "NULL characters terminate the string and are stripped from output"), candidate C6                                                                                                                                         | silent truncation                                                                                                                                                  |
| `%` (0x25)                                       | raw `%`                                                                                                                           | Measured: `Marksmanship Hunter.pld` holds `...M%06Gmh8@...`                                                                                                                                                                                  | none. The `%` hazard is in the World Editor, which crashes on save when pasted custom script contains `%` (#9); it does not apply to `Preload` strings at run time |
| other bytes (tab, `'`, `` ` ``, `$`, `^`, UTF-8) | raw                                                                                                                               | Measured in the third-party files and the #9 file                                                                                                                                                                                            | none                                                                                                                                                               |

`Preloader` would run the file as JASS (converted to Lua in a Lua map), so raw `"` and LF can inject code, which is the trick every FileIO system uses, and a syntax error crashes the game ([jassdoc `Preloader`](https://github.com/lep/jassdoc/blob/master/common.j), [Hive 337281](https://www.hiveworkshop.com/threads/blizzards-hidden-jass2lua-transpiler.337281/)). The runner never runs its result file, so this matters only as one more reason not to call `Preloader` on it.

Safe alphabet for result lines, from the table: printable ASCII except `"` and `\`, no control characters, at most 200 bytes. Anything else (error messages, `tostring` of arbitrary values) needs an escape the agent undoes, or the line split.

---

## 6. Ending the game from script

### 6.1 The Natives (3.0.0 `common.j`, Game API section)

```jass
native EndGame takes boolean doScoreScreen returns nothing

// Async only!
native          ChangeLevel         takes string newLevel, boolean doScoreScreen returns nothing
native          RestartGame         takes boolean doScoreScreen returns nothing
native          ReloadGame          takes nothing returns nothing
```

Also relevant: `RemovePlayer(whichPlayer, gameResult)`, `PauseGame(flag)`, `DisplayLoadDialog()`, and `DialogAddQuitButton(whichDialog, doScoreScreen, buttonText, hotkey)` (a button that ends the game when a human clicks it). No Native in the 3.0.0 `common.j` exits the program or returns to the desktop. The `Automation*` Natives (`AutomationSetTestType`, `AutomationTestStart`, `AutomationTestEnd`, `AutomationTestingFinished`) exist in 3.0.0 but no source documents what they do ("probably for internal testing", Drake53, [Hive 330518](https://www.hiveworkshop.com/threads/questions-about-some-reforged-natives.330518/)); jassdoc has only their patch numbers. The `// Async only!` comment sits after `EndGame`, so it concerns `ChangeLevel`, `RestartGame` and `ReloadGame`.

### 6.2 What `blizzard.j` does with them (3.0.0)

- `EndGameBJ()` is `EndGame(true)`.
- `CustomVictoryBJ(whichPlayer, showDialog, showScores)`: if `AllowVictoryDefeat(PLAYER_GAME_RESULT_VICTORY)` (false only with the "no victory" cheat or for the neutral result), `RemovePlayer(whichPlayer, PLAYER_GAME_RESULT_VICTORY)`, then for a user-controlled player either the victory dialog (`CustomVictoryDialogBJ`: pauses the game in single player; its buttons call `CustomVictoryOkBJ`/`CustomVictoryQuitBJ`, which call `EndGame(bj_changeLevelShowScores)` or `ChangeLevel`) or, with `showDialog` false, `CustomVictorySkipBJ`, which for the local player calls `SetGameDifficulty(GetDefaultDifficulty())` in single player and then `EndGame(showScores)` (or `ChangeLevel` when a next level was set with `SetNextLevelBJ`).
- `CustomDefeatBJ(whichPlayer, message)`: `RemovePlayer(..., DEFEAT)` and always a dialog; its quit button (`CustomDefeatQuitBJ`) calls `EndGame(true)`. It never ends the game without a click.
- Melee dialogs (`MeleeVictoryDialogBJ`, `MeleeDefeatDialogBJ`, `GameOverDialogBJ`) end the game only through `DialogAddQuitButton`, a click.
- `bj_isSinglePlayer` is true when exactly one player slot is user-controlled and playing (`InitBlizzard`), which a map launched alone with `-loadfile` is expected to be.

So the one path with no human click is `EndGame` itself, called directly or through `CustomVictoryBJ(GetLocalPlayer(), false, false)`, which adds the victory result and the difficulty reset and ends in `EndGame(false)`.

### 6.3 In a single-player `-loadfile` session

- **Reported / not found**: no source read describes what `EndGame` does on 3.0.0, nor in a session started with `-loadfile <folder> -launch -editor -windowmode windowed` (the Template's launch line, #32). By the Native's name and parameter, `EndGame(true)` goes to the score screen and `EndGame(false)` leaves the game to the menu the client came from; whether that is the main menu, the Battle.net screen, or a closed client in a `-launch` session is unknown. Candidate **C8**.
- The standing preference of #296 (a human closes the game) holds whatever C8 shows: no Native closes the program, so at best `EndGame` saves the human one step (leaving the map) and makes the end visible.

---

## 7. What 3.0.0 changed

- **Measured, Patch files**: the lines of `common.j` matching `Preload|EndGame|RestartGame|ReloadGame|ChangeLevel|Automation|RemovePlayer` are identical in 2.0.3.22904 and 3.0.0.24268 except one addition, `native BlzPreloadModelCinematicGame takes string modelName returns boolean` (unrelated to file writing). In `blizzard.j`, the block from `EndGameBJ` to `SetNextLevelBJ` differs only in `CustomDefeatDialogBJ`, where the "Load" button moved from after "Reduce difficulty" to first. The Preload Natives' declarations are those of jassdoc, unchanged since 1.07.
- **Reported, patch notes**: the 3.0.0 notes (build 24268, 2026-09-12) list no change to Preload, `CustomMapData` or file writing; the only related line is "Fixed various Save/Load issues regarding LUA serialization", which is about saved games ([Blizzard forum 38400](https://us.forums.blizzard.com/en/warcraft3/t/warcraft-iii-reforged-forsaken-kingdom-patch-notes/38400), [Liquipedia](https://liquipedia.net/warcraft/Patch_3.0.0)).
- **Measured**: the folder and format on 3.0.0 are as in section 2, and match the jassdoc examples written for earlier Reforged builds.

---

## 8. Candidates for the first Probe run

Each check below turns a reported fact into a measured one. The snippet after the list runs all of them in one Lua map; C5 and C8 also need the human (C5 is optional per run, and a run that does C5 cannot do C8). It holds no percent character (the one it needs is built with `string.char(37)`), so it can be pasted into the World Editor's custom script area as the #9 probe was. It was not run; it is a candidate, not a result.

- **C1 Length limit**: strings of exactly 200, 238, 255, 259, 260 and 300 bytes. For each: present whole, cut (at which length), or missing.
- **C2 Backslashes and the limit**: strings of 132 and 133 bytes that become 258 and 260 bytes once their 126 and 127 backslashes are doubled, and a 199-byte string holding 40 backslashes (239 bytes doubled): whether the limit applies before or after doubling.
- **C3 Many lines**: one file of 5,000 lines of 100 bytes: all present, and the `os.clock()` time the write took.
- **C4 Rewrites and the buffer**: checkpoint 1 then checkpoint 2 with `PreloadGenClear`, then checkpoint 3 without it. The file holds only checkpoint 3 if `PreloadGenEnd` or `PreloadGenStart` clears the buffer, or checkpoints 2 and 3 if nothing does (jassdoc's claim).
- **C5 Crash after a checkpoint**: `preload-crash.txt` gets checkpoint 1 at once and `END` 30 seconds later; the on-screen message says when. For C5 the human kills `Warcraft III.exe` from Task Manager before the second message; the file must then hold checkpoint 1 and no `END`.
- **C6 Control characters**: a CR, a CR LF, a NUL in the middle, a tab, and a percent sign, each in its own line.
- **C7 PreloadEnd value**: `preload-crash.txt` is written 30 seconds after its first `PreloadGenStart` without a new one, so its `PreloadEnd` value tells whether the timer runs from `PreloadGenStart` (about 30) or restarts at `PreloadGenClear` (0.0).
- **C8 EndGame**: 3 seconds after `END`, `EndGame(false)`. The human reports where the client went (score screen, main menu, Battle.net screen, closed) and the agent checks that the files are intact.

```lua
do
  local DIR = "reforged-ts\\"
  local function write(name, lines, clear, start)
    if clear then PreloadGenClear() end
    if start then PreloadGenStart() end
    for i = 1, #lines do Preload(lines[i]) end
    PreloadGenEnd(DIR .. name)
  end
  local function sized(tag, n)
    local head = tag .. " len=" .. tostring(n) .. " "
    return head .. string.rep("x", n - #head - 1) .. "Z"
  end
  local function after(seconds, fn)
    TimerStart(CreateTimer(), seconds, false, fn)
  end

  after(1.0, function()
    -- C1, C2, C6: one write, read once by the agent.
    local chars = {}
    for _, n in ipairs({ 200, 238, 255, 259, 260, 300 }) do chars[#chars + 1] = sized("C1", n) end
    chars[#chars + 1] = "C2 a " .. string.rep("\\", 126) .. "Z"
    chars[#chars + 1] = "C2 b " .. string.rep("\\", 127) .. "Z"
    chars[#chars + 1] = "C2 bs40 " .. string.rep("\\", 40) .. string.rep("y", 150) .. "Z"
    chars[#chars + 1] = "C6 cr [" .. string.char(13) .. "] end"
    chars[#chars + 1] = "C6 crlf [" .. string.char(13, 10) .. "] end"
    chars[#chars + 1] = "C6 nul [" .. string.char(0) .. "] end"
    chars[#chars + 1] = "C6 tab [" .. string.char(9) .. "] end"
    chars[#chars + 1] = "C6 pct [" .. string.char(37) .. "] end"
    chars[#chars + 1] = "C1 C2 C6 done"
    write("preload-chars.txt", chars, true, true)

    -- C4: three writes of one name, the last without PreloadGenClear.
    write("preload-rewrite.txt", { "checkpoint 1" }, true, true)
    write("preload-rewrite.txt", { "checkpoint 2" }, true, true)
    write("preload-rewrite.txt", { "checkpoint 3, no clear" }, false, true)

    -- C3: 5,000 lines of 100 bytes.
    local big = {}
    for i = 1, 5000 do
      local s = tostring(i)
      big[i] = "C3 line " .. string.rep("0", 5 - #s) .. s .. " " .. string.rep("w", 85) .. "Z"
    end
    big[#big + 1] = "C3 done"
    local t0 = os.clock()
    write("preload-many.txt", big, true, true)
    print("C3: 5000 lines written in " .. tostring(os.clock() - t0) .. " s")

    -- C5, C7: checkpoint now, END in 30 s, same PreloadGenStart.
    write("preload-crash.txt", { "checkpoint 1" }, true, true)
    print("C5: checkpoint 1 written; END in 30 s (kill the game now to test a crash)")
    after(30.0, function()
      write("preload-crash.txt", { "checkpoint 1", "checkpoint 2", "END" }, true, false)
      print("END written; EndGame(false) in 3 s (C8)")
      after(3.0, function() EndGame(false) end)
    end)
  end)
end
```

What the agent reads afterwards, all in `CustomMapData\reforged-ts\`: `preload-chars.txt` (C1, C2, C6: which lines are whole, cut or missing, and their bytes), `preload-rewrite.txt` (C4), `preload-many.txt` (C3: 5,001 lines expected), `preload-crash.txt` (C5: checkpoint 1 only after a kill, all three lines otherwise; C7: its `PreloadEnd` value). A string longer than the limit may also cut or crash the write of that file (only reported as dropped or cut, never as a crash), which is why C1 and C2 are in a file of their own and written first.

---

## 9. What the runner can rely on today

Measured on 3.0.0, enough to design the checkpoint format:

1. The result file is `<Documents known folder>\Warcraft III\CustomMapData\<name>.txt`, resolved through the known folder, not `%USERPROFILE%\Documents`; a subfolder such as `reforged-ts\` is created on write.
2. Each checkpoint is a full rewrite (`PreloadGenClear`, `PreloadGenStart`, `Preload` per line, `PreloadGenEnd` with the same name); the latest rewrite replaces the file, and the file is on disk while the game still runs.
3. The agent parses lines between `\tcall Preload( "` and `" )\r\n`, undoes `\\`, and ignores the wrapper and the `PreloadEnd` value. With lines of printable ASCII without `"` or `\` and at most 200 bytes, no reported limit or escape is reached.
4. A final `END` line tells a finished run from a crashed one, given that a file with an older checkpoint stays on disk (C5 confirms the crash case).

Reported, to confirm in the first Probe run: the exact length limit and its failure mode (C1, C2), large files (C3), the buffer rule (C4), crash survival (C5), control characters (C6), and what `EndGame(false)` does in a `-loadfile` session (C8).

## Sources

- Repo tickets: [#9](https://github.com/phmilk/reforged-ts/issues/9) (probe results and the `%` editor crash), [#53 comment](https://github.com/phmilk/reforged-ts/issues/53#issuecomment-5835736649) and [#129](https://github.com/phmilk/reforged-ts/issues/129) (File cases in game), [#146](https://github.com/phmilk/reforged-ts/issues/146); `docs/research/probe-map.lua`; `packages/reforged-ts/src/system/file.ts`; `packages/reforged-test/stubs/preloads.lua`.
- Patch files: `packages/reforged-types/vendor/3.0.0.24268/{common.j,blizzard.j,provenance.json}`; [Luashine/jass-history](https://github.com/Luashine/jass-history) commits `a392fc3` (3.0.0.24268) and `3e36339` (2.0.3.22904).
- jassdoc: [lep/jassdoc `common.j`](https://github.com/lep/jassdoc/blob/master/common.j) (`Preload`, `PreloadEnd`, `PreloadStart`, `PreloadGenClear`, `PreloadGenStart`, `PreloadGenEnd`, `Preloader`, `EndGame`, `ChangeLevel`).
- Hive Workshop: [Preload natives 252220](https://www.hiveworkshop.com/threads/preload-natives.252220/), [Stable Lua FileIO 360424](https://www.hiveworkshop.com/threads/stable-lua-fileio.360424/), [FileIO (Lua-optimized) 347049](https://www.hiveworkshop.com/threads/fileio-lua-optimized.347049/), [FileIO (vJASS) 307568](https://www.hiveworkshop.com/threads/fileio.307568/), [Exploring File I/O 307710](https://www.hiveworkshop.com/threads/exploring-file-i-o-tricks-and-techniques.307710/), [Patch 1.28.2 293658](https://www.hiveworkshop.com/threads/warcraft-iii-patch-1-28-2.293658/), [Blizzard's hidden jass2lua transpiler 337281](https://www.hiveworkshop.com/threads/blizzards-hidden-jass2lua-transpiler.337281/), [Questions about some Reforged natives 330518](https://www.hiveworkshop.com/threads/questions-about-some-reforged-natives.330518/).
- Blizzard: [3.0.0 patch notes 38400](https://us.forums.blizzard.com/en/warcraft3/t/warcraft-iii-reforged-forsaken-kingdom-patch-notes/38400), [Preload files are being cached 29413](https://us.forums.blizzard.com/en/warcraft3/t/bug-preload-files-are-being-cache%E2%80%99d/29413/35); [Liquipedia Patch 3.0.0](https://liquipedia.net/warcraft/Patch_3.0.0).
- Measured files (read only): `C:\Users\night\OneDrive\Documentos\Warcraft III\CustomMapData\` (`reforged-probe.txt`, `rts-129-newline.txt`, `rts-129-icon.txt`, `FileTester.pld`, `WotLK RPG Saves - Live\`, `TowerSurvivors1249TEST\SaveSlot_Manual.pld`, `Direct Strike Reforged\Erestor#1411\Save2.txt`).
