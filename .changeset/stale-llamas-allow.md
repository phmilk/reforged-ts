---
"reforged-ts": patch
---

Every error the library catches from a Map project callback (an Init stage callback, a Dev-mode protected callback or `MapPlayer.runLocal` function) is also passed to the global `__reforged_caught_error(origin, message)` when one is defined, each repeat included: the seam `reforged-test` will use to fail a test on a Caught error. The game defines no such global, so nothing changes in a map, and what is printed stays the same.
