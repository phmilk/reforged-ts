---
"reforged-map": minor
---

Reload the World Editor after Object sync: the new `reloadWorldEditor(mapFolder, executable)` starts the World Editor with `-launch -loadfile <map folder>` (its Windows path, through `wslpath -w` under WSL) without waiting for it, and `syncObjectDefinitions` takes the executable as `worldEditorExecutable`: when the World Editor holds the map without unsaved edits, the sync writes, then reloads it, and its report says so in `worldEditorReloaded`. Without the executable, or when the reload fails, it warns to reload the map by hand as before. Pass `World Editor.exe`, beside the game, from your game discovery.
