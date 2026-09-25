/** @noSelfInFile */

// The events module: `on()` and the Event descriptors, by namespace. Every
// game event stays reachable through the Trigger Wrapper; an event also ships
// as a descriptor when it is among the events Map projects register most,
// when its payload needs more than one Native, or when its response Natives
// are easy to misuse (a killer that may be missing, a spell target of several
// kinds). The rest is Trigger-only in the first release: game state and
// variable limits, unit state limits, train and construct starts and
// cancels, decay, hidden, detected, rescued, stack, tournament and
// game-loaded events, the arrow keys and the generic player key event, among
// others (the library README lists them). Each becomes one table row when a
// Map project asks for it.

export type { EventDescriptor, Subscription } from "./descriptor";
export { on } from "./descriptor";
export { DialogEvents } from "./dialog";
export { FrameEvents } from "./frame";
export { PlayerEvents } from "./player";
export { RegionEvents } from "./region";
export { TimerEvents } from "./timer";
export { TrackableEvents } from "./trackable";
export { UnitEvents } from "./unit/index";
