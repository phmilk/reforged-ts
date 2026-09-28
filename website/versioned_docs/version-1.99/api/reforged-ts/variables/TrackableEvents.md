# Variable: TrackableEvents

> `const` **TrackableEvents**: [`EventDescriptors`](../type-aliases/EventDescriptors.md)\<\{ `hit`: \{ `read`: (`event`) => [`TrackablePayload`](../interfaces/TrackablePayload.md); `register`: (`trigger`, `trackable`) => `void`; \}; `track`: \{ `read`: (`event`) => [`TrackablePayload`](../interfaces/TrackablePayload.md); `register`: (`trigger`, `trackable`) => `void`; \}; \}\>

Defined in: [events/trackable.ts:29](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/events/trackable.ts#L29)

The trackable Event descriptors: `TrackableEvents.hit(trackable)` and
`TrackableEvents.track(trackable)` for one Trackable. The payload is a
[TrackablePayload](../interfaces/TrackablePayload.md).
