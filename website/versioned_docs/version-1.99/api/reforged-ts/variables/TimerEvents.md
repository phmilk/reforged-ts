# Variable: TimerEvents

> `const` **TimerEvents**: [`EventDescriptors`](../type-aliases/EventDescriptors.md)\<\{ `expired`: \{ `read`: (`event`) => `object`; `register`: (`trigger`, `timer`) => `void`; \}; \}\>

Defined in: [events/timer.ts:12](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/events/timer.ts#L12)

The timer Event descriptors: `TimerEvents.expired(timer)` for one Timer.
The payload's `timer` is always set.
