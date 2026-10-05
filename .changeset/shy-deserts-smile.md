---
"reforged-ts": minor
---

In Dev mode, `Image.create` throws at the calling line when the image type is not an integer from 1 to 4, before it calls `CreateImage`: image type 2147483647 crashed the game on 3.0.0.24268, and 0 returned the invalid image (id -1). `FogModifier.create` and `FogModifier.createAtPoint` note that a radius of 2147483647 crashed the game.
