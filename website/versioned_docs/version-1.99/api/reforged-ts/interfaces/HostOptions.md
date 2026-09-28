# Interface: HostOptions

Defined in: [system/host.ts:19](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/host.ts#L19)

The options of the host election.

## Properties

### timeout?

> `readonly` `optional` **timeout?**: `number`

Defined in: [system/host.ts:24](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/host.ts#L24)

Seconds from the start of the election before it settles with the lobby
times received; ten by default, zero never.
