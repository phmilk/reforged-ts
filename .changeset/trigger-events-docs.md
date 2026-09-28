---
"reforged-ts": patch
---

`Trigger`, `on()`, `Subscription` and every Event descriptor carry complete doc comments: each member's parameters, return value and Natives, what each payload guarantees and which of its fields can be `undefined`, and who owns the Subscription `on()` returns. Two compiled examples show them, `examples/harness/trigger-create.ts` and `examples/harness/events-on.ts`. The payload types are now exported as types, so a handler written apart from its `on()` call can name its payload: `ChatPayload`, `DialogClick`, `FramePayload`, `KeyPayload`, `MousePayload`, `PlayerPayload`, `RegionCrossing`, `SyncPayload` and `TrackablePayload`. So are the types the events namespaces are declared with: `EventDescriptors`, `EventRow`, `FixedRow`, `UnitEventDescriptors` and `PayloadOf`. Nothing else changes.
