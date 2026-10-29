---
"reforged-types": minor
"reforged-test": patch
"reforged-map": patch
"reforged-builtins": none
"reforged-ts": none
---

`reforged-types` no longer ships the Typings of Game version 3.0.0: `reforged-types/3.0.0` and `reforged-types/3.0.0/common.ai` are gone, since the package's minimum Patch is 3.0.1.24370. The package now ships only the Game versions from its minimum Patch up, and no longer vendors Patch 3.0.0.24268. A Map project that lists `reforged-types/3.0.0` in `types` moves it to `reforged-types/3.0.1` (and `reforged-types/3.0.0/common.ai` to `reforged-types/3.0.1/common.ai`); the breaking changes of that move are in the changelog entry that added `3.0.1`. The supported Patch of `reforged-test` and `reforged-map` (`reforged.patch`) moves from 3.0.0.24268 to 3.0.1.24370, the Typings' minimum, and the `reforged-test` README names `reforged-types/3.0.1`.
