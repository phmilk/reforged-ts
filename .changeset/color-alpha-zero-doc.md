---
"reforged-ts": patch
---

`Color`'s documentation no longer claims that an alpha of 0 comes out opaque ([#264](https://github.com/phmilk/reforged-ts/issues/264)). A documentation fix, with no behavior change in the game: on Lua, `new Color(r, g, b, 0)` always kept its alpha of 0, and the constructor now gives 255 only to an alpha left out, as a default parameter value.
