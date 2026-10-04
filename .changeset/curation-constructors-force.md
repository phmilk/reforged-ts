---
"reforged-ts": patch
---

`Force.fromPlayer` adds the player through the creation helper's `init` callback, as `CreateForce` is now typed non-null; it behaves as before, throwing `reforged-ts: failed to create Force` and adding no player when the game returns no force.
