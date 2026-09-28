// The TrackableEvents descriptors through on(): `hit(trackable)` when it is
// clicked, `track(trackable)` when the mouse moves over it. The payload's
// `trackable` is always set. on() returns the Subscription whose destroy()
// ends the handler: here the first click ends both.
import { Init, on, Trackable, TrackableEvents } from "reforged-ts";

Init.onTriggers(() => {
  const chest = Trackable.create(
    "Objects\\InventoryItems\\TreasureChest\\treasurechest.mdl",
    0,
    0,
    270,
  );
  const hover = on(TrackableEvents.track(chest), () => {
    print("A chest. Click to open it.");
  });
  const open = on(TrackableEvents.hit(chest), ({ trackable }) => {
    print(`Chest ${String(trackable.id)} opened`);
    hover.destroy();
    open.destroy();
  });
});
