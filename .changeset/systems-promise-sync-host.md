---
"reforged-ts": major
---

The Systems with real `Promise`s: a sync API that `await` works with over a fixed-width wire format, host detection as `Host.detectHost()`, and binary, base64 and file fixes, each with one error mode.

**Sync.** `new SyncRequest(from, options?)` creates a request and never starts it; `start(data)` returns a real `Promise` of a `SyncResponse` (the joined `data`, the sender as `from`, the game time as `time`, and the `request`), and `SyncRequest.send(from, data, options?)` creates and starts in one call. A request starts once: a second `start` throws at the calling line. `cancel()` rejects a pending request. The `Promise` rejects with a string naming the request and the cause: a timeout (`SyncOptions.timeout`, in seconds), a cancellation or a network error. `SyncStatus` gains `Cancelled` and `NetworkError`. Every packet has the one prefix `"rts"` and an 8-character header (the request id, chunk index and chunk count as unsigned 16-bit fields, base64-encoded), then at most 244 bytes of raw data, so the sender's data may hold no zero byte (encode binary data, for example with `base64Encode`) and `start` throws on one; a packet the System did not send is ignored, never thrown on. Request ids are a 16-bit counter every client allocates in the same order.

**`Host`.** `Host.detectHost(options?)` returns a `Promise` of the elected `MapPlayer`, the same `Promise` for every call, and `Host.host` reads the result once it resolved. The election syncs each client's lobby time and elects the longest, ties to the lowest player index; it settles when every playing user answered or left, or at its timeout (10 seconds by default). It is opt-in: nothing runs until `detectHost` is called. The lobby time is measured at `config` through the library's own registration point, no longer through `addScriptHook`.

**Binary.** `BinaryReader` advances by what `string.unpack` consumed, so `readDouble` no longer misaligns what follows; it reads `position` and `remaining`, and a read past the end throws with the position. `BinaryWriter` range-checks every integer width at write, and `writeUInt32`/`readUInt32` round-trip 0 to 2^32 − 1 on the 32-bit game and the 64-bit test VM alike. Strings are length-prefixed, so any byte, zero included, round-trips.

**base64, file, time.** `base64Decode` throws on malformed input, naming the offset, and neither function prints. `File.read` reads the escape character followed by `q` correctly, and `File`'s doc states its escape contract and the two cases left unspecified until verified in game. `sleep` runs on `Timer.after` and resolves with no value. `Item.getField` and `Item.setField` now reach the item field Natives.

**Removed or renamed** (each listed with its replacement in `migration/renames.json`): `SyncRequest.then` and `SyncRequest.catch` (use the `Promise`), `SyncCallback`, `ISyncResponse` (now `SyncResponse`), `ISyncOptions` (now `SyncOptions`), `SyncRequest.destroy` (now `cancel`), `SyncRequest.fromIndex`, the `SyncRequest` constructor overloads that took the data (use `SyncRequest.send`), `onHostDetect` (now `Host.detectHost`), `BinaryReader.read` and `BinaryWriter.values`.

**Behaviour changes** (detailed in `migration/behaviour-changes.md`):

- `SyncRequest.start` returns a `Promise`, a second `start` throws, and rejections are strings; a network failure rejects instead of printing;
- the sync prefix is `"rts"` instead of `"T"` and `"S"`, and the wire format is fixed-width with a raw payload;
- host detection is opt-in, has a timeout and handles leavers;
- binary strings are length-prefixed, a read past the end throws, and every integer write outside its range throws;
- `base64Decode` throws on malformed input instead of printing and returning an empty string;
- `File.write` and `File.writeRaw` return nothing, and `sleep` resolves with no value;
- `Item.getField` and `Item.setField` read and write item fields, where they returned 0 and `false`.
