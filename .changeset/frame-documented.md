---
"reforged-ts": patch
---

Document every member of `Frame`: what each one does, its parameters in frame units, what the lookups return when the game finds no frame, what `create`, `createSimple` and `createType` throw, and which members read the local client's frame (`@async`). `Frame.fromName` gains an example that runs on the test harness. The comments ship in `dist/*.d.ts`.
