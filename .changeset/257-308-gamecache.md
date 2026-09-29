---
"reforged-ts": major
"reforged-types": patch
---

`GameCache.restoreUnit` returns the restored unit as a `Unit`, and throws `reforged-ts: failed to create Unit (<key>)` when the game creates none, instead of returning the raw `unit` handle or `undefined`. `GameCache.store` takes a `Unit` instead of the raw `unit` handle. `GetStoredString` is typed `string`, not `string | undefined`: the game returns `""` for a missing key.
