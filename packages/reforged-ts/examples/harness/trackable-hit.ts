// A clickable spot on the map: the trackable shows a model, and the hit
// event reads back the one clicked.
import { Init, on, Trackable, TrackableEvents } from "reforged-ts";

Init.onTriggers(() => {
  const button = Trackable.create(
    "Doodads\\Cinematic\\GlowingRunes\\GlowingRunes0.mdl",
    0,
    0,
    270,
  );
  on(TrackableEvents.hit(button), ({ trackable }) => {
    print(`Trackable ${String(trackable.id)} clicked`);
  });
});
