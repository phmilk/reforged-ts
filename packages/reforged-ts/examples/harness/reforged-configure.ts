// The entry point of a Map project: Dev mode is configured first, before
// anything registers a callback, and read later to show debug-only visuals.
import { Init, Reforged } from "reforged-ts";

Reforged.configure({ devMode: true, damageDepthLimit: 4 });

Init.onGameStart(() => {
  if (Reforged.devMode) {
    print("Dev build: callback failures are reported on screen");
  }
});
