---
"reforged-studio": minor
---

The World Editor executable defaults to `World Editor.exe` beside the game's (`<install>/_retail_/x86_64`), so the reload after a save works with no `--world-editor`; `findWorldEditor` finds it. When the install holds none and none is given, the page disables "Reload the World Editor after a save" with the reason beside it, and `GET /api/session` names the executable as `worldEditorExecutable`.
