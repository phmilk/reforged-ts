# Variable: FrameEvents

> `const` **FrameEvents**: [`EventDescriptors`](../type-aliases/EventDescriptors.md)\<\{ `of`: \{ `read`: (`event`) => [`FramePayload`](../interfaces/FramePayload.md); `register`: (`trigger`, `frame`, `frameEventType`) => `void`; \}; \}\>

Defined in: [events/frame.ts:30](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/events/frame.ts#L30)

The frame Event descriptors: `FrameEvents.of(frame, frameEventType)` for
one event of one Frame. The payload is a [FramePayload](../interfaces/FramePayload.md).
