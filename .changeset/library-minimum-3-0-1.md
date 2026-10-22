---
"reforged-ts": patch
---

Patch 3.0.1.24370 is the library's minimum: a map built with it needs a 3.0.1 client, since the equipment members and `Unit#isAlive` call Natives a 3.0.0 client does not have. List `reforged-types/3.0.1` in `types`. `Unit#resetTalents` says where its refund of talent points comes from, the World Editor's own hint, which awaits a check on screen (#672).
