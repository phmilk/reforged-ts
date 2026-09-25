---
"eslint-plugin-reforged": minor
---

**`no-percent-in-display-strings`** (warning). Reports a string literal or template with a lone `%` that reaches a text-display Native: the display Natives (`DisplayTextToPlayer`, `DisplayTimedTextToPlayer`, `DisplayTimedTextFromPlayer`, `DisplayTextToForce`, `DisplayTimedTextToForce`, `BJDebugMsg`), `print`, `BlzFrameSetText`, `BlzFrameAddText` and the `Frame` members `setText`, `addText` and `text`. The rule follows the string through a template literal, a concatenation, `String()` or `tostring`, and one `const`. A suggestion doubles the `%`, which the game displays as `%`.

**The allowlist.** `data/local-safe.json` lists the Natives and library members that only change what the local player sees or hears (`visual`: frame setters, vertex colours, the camera, sounds and music) or that display a string (`text`), each with its reason. A file with an unexpected shape throws at plugin load, naming the field.
