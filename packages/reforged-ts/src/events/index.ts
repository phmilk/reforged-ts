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
//
// The payload types and the table types are exported as types only: the
// namespaces' declared types name them, and a Map project may name a
// payload to type a handler written apart from its `on()` call.

export type { EventDescriptor, Subscription } from "./descriptor";
export { on } from "./descriptor";
export type { DialogClick } from "./dialog";
export { DialogEvents } from "./dialog";
export type { FramePayload } from "./frame";
export { FrameEvents } from "./frame";
export type {
  ChatPayload,
  KeyPayload,
  MousePayload,
  PlayerPayload,
  SyncPayload,
} from "./player";
export { PlayerEvents } from "./player";
export type { RegionCrossing } from "./region";
export { RegionEvents } from "./region";
export type { EventDescriptors, EventRow, FixedRow } from "./rows";
export { TimerEvents } from "./timer";
export type { TrackablePayload } from "./trackable";
export { TrackableEvents } from "./trackable";
export { UnitEvents } from "./unit/index";
export type { UnitEventDescriptors } from "./unit/rows";
