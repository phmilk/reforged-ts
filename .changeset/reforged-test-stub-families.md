---
"reforged-test": minor
---

Stubs for every Native family the reforged-ts Wrappers create or look up through.

- **New stub families**: `cameras`, `destructables`, `dialogs`, `effects`, `fogmodifiers`, `forces`, `frames`, `gamecaches`, `groups`, `images`, `items`, `leaderboards`, `locations`, `multiboards`, `quests`, `rects`, `regions`, `sounds`, `texttags`, `timerdialogs`, `ubersplats`, `weathereffects` and `widgets`, loaded with the shipped set; `units.lua` gains `BlzCreateUnitWithSkin`, `GetUnitLoc`, the rally getters and the inventory Natives. The README's table lists each file's Natives.
- **`__stub_frame_not_found()`** returns the frame the game hands back when it finds none (handle id 0), for a test to return from a Native it overrides for one call.
- **The stub authoring rule** now reads: a stub keeps only the state its Natives were given and hands it back through the Natives that read it; it never simulates game rules.
