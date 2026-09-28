# Interface: FramePayload

Defined in: [events/frame.ts:12](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/events/frame.ts#L12)

The payload of `FrameEvents.of`: the Frame and the event are always set,
the text only for the events that carry one.

## Properties

### event

> **event**: `frameeventtype`

Defined in: [events/frame.ts:16](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/events/frame.ts#L16)

The frame event type that happened.

***

### frame

> **frame**: [`Frame`](../classes/Frame.md)

Defined in: [events/frame.ts:14](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/events/frame.ts#L14)

The Frame the event happened on.

***

### text

> **text**: `string` \| `undefined`

Defined in: [events/frame.ts:23](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/events/frame.ts#L23)

The Frame's text, or undefined when the event carries none.

***

### value

> **value**: `number`

Defined in: [events/frame.ts:21](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/events/frame.ts#L21)

The Frame's value, for the events that carry one (a slider's);
meaningless for the others.
