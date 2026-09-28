// The TrackableEvents descriptors through on(): `hit(trackable)` when it is
// clicked, `track(trackable)` when the mouse moves over it. The payload's
// `trackable` is always set. The game fires these events only on the client
// whose player clicked or hovered, so a handler shows visuals and nothing
// else: it must not destroy its own Subscription, which frees a Trigger on
// one client. on() returns the Subscription, ended here on every client.
import { Init, on, Timer, Trackable, TrackableEvents } from "reforged-ts";

Init.onTriggers(() => {
  const chest = Trackable.create(
    "Objects\\InventoryItems\\TreasureChest\\treasurechest.mdl",
    0,
    0,
    270,
  );
  const hover = on(TrackableEvents.track(chest), () => {
    print("A chest. Click to look inside.");
  });
  const open = on(TrackableEvents.hit(chest), ({ trackable }) => {
    print(`Chest ${String(trackable.id)}: empty`);
  });

  // The chest stops answering after a minute, on every client at once.
  Timer.after(60, () => {
    hover.destroy();
    open.destroy();
  });
});
