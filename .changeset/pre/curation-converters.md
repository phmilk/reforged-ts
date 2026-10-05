---
"reforged-types": minor
---

The 84 converters seeded nullable (`ConvertRace`, `ConvertPlayerState`, `ConvertUnitIntegerField`, ...) now return their handle type, no longer `| undefined`: the Nullability sweep saw every converter of `common.j` return a handle on 3.0.0.24268, for every constant of its type and for out-of-range integers alike. A `?.` or `!` on their result is no longer needed. All 88 converters, the 4 of 3.0.0.24268 already non-null among them, carry a `@remarks` with what was measured.
