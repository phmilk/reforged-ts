# Enumeration: SyncStatus

Defined in: [system/sync.ts:41](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/sync.ts#L41)

Where a sync request stands: its `status`.

## Enumeration Members

### Cancelled

> **Cancelled**: `4`

Defined in: [system/sync.ts:51](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/sync.ts#L51)

`cancel` ran first: the `Promise` rejected.

***

### NetworkError

> **NetworkError**: `5`

Defined in: [system/sync.ts:53](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/sync.ts#L53)

`BlzSendSyncData` refused a packet: the `Promise` rejected.

***

### None

> **None**: `0`

Defined in: [system/sync.ts:43](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/sync.ts#L43)

Created, not started.

***

### Success

> **Success**: `2`

Defined in: [system/sync.ts:47](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/sync.ts#L47)

Every packet arrived: the `Promise` resolved.

***

### Syncing

> **Syncing**: `1`

Defined in: [system/sync.ts:45](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/sync.ts#L45)

Started, waiting for its packets.

***

### Timeout

> **Timeout**: `3`

Defined in: [system/sync.ts:49](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/sync.ts#L49)

The timeout expired first: the `Promise` rejected.
