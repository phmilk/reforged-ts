# Variable: Reforged

> `const` **Reforged**: [`ReforgedEntry`](../interfaces/ReforgedEntry.md)

Defined in: [reforged/index.ts:223](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/reforged/index.ts#L223)

The library's entry point: `configure`, what it recorded, and `debug`.

## Example

```ts
// The entry point of a Map project: Dev mode is configured first, before
// anything registers a callback, and read later to show debug-only visuals.
import { Init, Reforged } from "reforged-ts";

Reforged.configure({ devMode: true, damageDepthLimit: 4 });

Init.onGameStart(() => {
  if (Reforged.devMode) {
    print("Dev build: callback failures are reported on screen");
  }
});
```
