---
"reforged-map": minor
---

The Rawcode lookup reads the map folder again when one of its files changes: once `minInterval` (one second by default) has passed since its last check, a lookup compares the modification times of the Object data files, their Skin files, `war3map.wts`, `war3map.w3i` and the `reforged-builtins` index, and rebuilds its model when one changed, appeared or disappeared. An object saved in the World Editor is known at the next lookup, without a build. A read that fails makes the lookup unavailable, and each later check reads the files again until one succeeds.
