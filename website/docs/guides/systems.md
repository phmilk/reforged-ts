---
title: Systems
sidebar_position: 5
description: The library utilities that wrap no Handle, sync, host, file, binary and base64, and game time, and the rule they share, a value local to one client becomes shared only through sync.
---

# Systems

A System is a library utility that wraps no Handle, even when it uses some for its own work. Most of them exist for one problem of multiplayer maps: every client runs the same script, and the game stays in sync only while every client computes the same thing. A value that only one client has, a file on its disk, its clock, the text in its UI, must reach the others through the network before it changes game state. The sync System does that; the others build on it or feed it.

| System                  | Exports                                                                                                                                                                                                                                                    | What for                                            |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| [Sync](#sync)           | [`SyncRequest`](../api/reforged-ts/classes/SyncRequest.md), [`SyncStatus`](../api/reforged-ts/enumerations/SyncStatus.md)                                                                                                                                  | One client's data, made known to every client       |
| [Host](#host)           | [`Host`](../api/reforged-ts/variables/Host.md)                                                                                                                                                                                                             | One player elected the same on every client         |
| [File](#file)           | [`File`](../api/reforged-ts/classes/File.md)                                                                                                                                                                                                               | Text files in the player's `CustomMapData` folder   |
| [Binary](#binary)       | [`BinaryWriter`](../api/reforged-ts/classes/BinaryWriter.md), [`BinaryReader`](../api/reforged-ts/classes/BinaryReader.md), [`base64Encode`](../api/reforged-ts/functions/base64Encode.md), [`base64Decode`](../api/reforged-ts/functions/base64Decode.md) | Values packed into a string, and back               |
| [Game time](#game-time) | [`getElapsedTime`](../api/reforged-ts/functions/getElapsedTime.md)                                                                                                                                                                                         | Seconds since the game started, the same everywhere |

The collections a multiplayer map iterates, `SyncedMap`, `SyncedSet`, `HandleMap` and `HandleSet`, are Systems too; they are covered with the Guards ([The four collections](desync-safety-and-guards.md#the-four-collections)).

## Sync

A `SyncRequest` sends one player's data to every client. Every client runs the same code and starts the same request; only the sender's client sends its data, and every client receives it and resolves the request's `Promise` with it, at the same moment of the game:

```ts
import { File, Init, MapPlayer, SyncRequest } from "reforged-ts";

async function loadSaveCode(sender: MapPlayer): Promise<void> {
  try {
    // Each client reads its own disk; only the sender's contents are sent.
    const response = await SyncRequest.send(
      sender,
      File.read("savecode.txt") ?? "",
      { timeout: 10 },
    );
    print(`${response.from.name} loaded: ${response.data}`);
  } catch (reason) {
    print(String(reason));
  }
}

Init.onGameStart(() => {
  const sender = MapPlayer.fromIndex(0);
  if (sender !== undefined) {
    void loadSaveCode(sender);
  }
});
```

- **Every client, same order.** A request's id is its rank among the requests created, so create and start requests on every client, in the same order. A request created on one client only (inside `MapPlayer.runLocal`, in a local-player branch) shifts that client's ids, and its later requests stop matching the others'.
- **The response.** `data` is the sender's data, `from` the sender, `time` the game time when the last packet arrived. The data given on the other clients is ignored.
- **Failure.** The `Promise` rejects with a message naming the request on a timeout (`options.timeout`, in seconds; none by default), on `cancel()`, and when the game refused to send a packet. `status` tells where a request stands.
- **Size.** The data is split into packets of 244 bytes, up to 65,535 of them, and joined back. The game cuts a packet at a zero byte, so the data must hold none: encode binary data with `base64Encode` first. `start` throws on the sender's client for data with a zero byte or too long.
- **The prefix.** The System's packets carry the sync prefix `rts`. A Map project using the raw `BlzSendSyncData` or [`PlayerEvents.syncData`](../api/reforged-ts/variables/PlayerEvents.md) picks another prefix.

`SyncRequest.send(from, data, options)` creates and starts a request at once; `new SyncRequest(from, options)` then `start(data)` keeps the request for `cancel()` or `status`.

## Host

[`Host.detectHost()`](../api/reforged-ts/interfaces/HostDetection.md) elects one player, the same on every client, so a Map project can give one player a role (the host's settings dialog, a game mode vote) without desyncing:

```ts
import { Host, Init, MapPlayer } from "reforged-ts";

async function greetHost(): Promise<void> {
  try {
    const host = await Host.detectHost({ timeout: 15 });
    MapPlayer.runLocal(host, () => {
      print("You are the host.");
    });
  } catch (reason) {
    print(String(reason));
  }
}

Init.onGameStart(() => {
  void greetHost();
});
```

The heuristic: the host created the lobby, so the host's client sat in the lobby the longest. Each client measures its own lobby time with `os.clock`, from the editor's `config` to the `gameStart` stage, and sends it through `SyncRequest`; the longest time wins, and a tie goes to the lowest slot. A player who leaves before answering is dropped, and the timeout (ten seconds by default) settles the election with the times received. Every call returns the same `Promise`, which rejects only when no time arrived; `Host.host` is the elected player once it resolved.

The heuristic's assumptions (`config` runs once per client in the lobby, `os.clock` grows while the client waits there) have not been measured in the game yet: treat the result as the likely host, not a guarantee.

## File

[`File`](../api/reforged-ts/classes/File.md) reads and writes text files through the game's preload files, the only file access a map has (the game's Lua has no `io`):

```ts
import { File, Init } from "reforged-ts";

Init.onGameStart(() => {
  File.write("settings.txt", "volume=80");
  const contents = File.read("settings.txt");
  if (contents !== undefined) {
    print(contents);
  }
});
```

- Files live under `Documents\Warcraft III\CustomMapData` on each player's machine, with the extension `.txt` or `.pld`.
- A file cannot be deleted; write it empty instead.
- `File.write` adds the code `File.read` needs to read the file back. `File.writeRaw(name, contents)` leaves it out, for a file meant to be read outside the map; the game's preload code still surrounds the contents.
- `File.read` returns `undefined` when the file cannot be read.

**Every client has its own disk.** `File.read` returns this client's file, which differs between players: a value read from a file is local, like a value from an `@async` Native. Send it through [`SyncRequest`](#sync) before it changes game state, as the save-code example above does.

## Binary

[`BinaryWriter`](../api/reforged-ts/classes/BinaryWriter.md) packs numbers and strings into one binary string, and [`BinaryReader`](../api/reforged-ts/classes/BinaryReader.md) reads them back in the same order. Each value has a fixed width, big-endian: `Int8` to `Int32` and `UInt8` to `UInt32`, `Float` (four bytes) and `Double` (eight, lossless), and strings with a two-byte length. A value outside its width's range throws at the write:

```ts
import {
  base64Encode,
  BinaryReader,
  BinaryWriter,
  base64Decode,
} from "reforged-ts";

const writer = new BinaryWriter();
writer.writeUInt8(3); // level
writer.writeUInt32(125000); // gold
writer.writeString("Arthas");

// Binary data can hold zero bytes: encode it before a sync or a file.
const encoded = base64Encode(writer.toString());

const reader = new BinaryReader(base64Decode(encoded));
print(reader.readUInt8()); // 3
print(reader.readUInt32()); // 125000
print(reader.readString()); // Arthas
```

[`base64Encode`](../api/reforged-ts/functions/base64Encode.md) and [`base64Decode`](../api/reforged-ts/functions/base64Decode.md) turn any byte string into text and back (RFC 4648, with padding): the form a sync packet and a file need.

Integers in the game's Lua are 32-bit ([Runtime facts](runtime-facts.md#integers-are-32-bit)). `readUInt32` still returns the full range, 0 to 2^32 - 1: a value above 2^31 - 1 comes back as a float, equal to what was written.

## Game time

[`getElapsedTime()`](../api/reforged-ts/functions/getElapsedTime.md) returns the seconds of game time since the `gameStart` stage, `0` before it. A periodic Timer keeps it, so it pauses with the game and is the same on every client: use it for timestamps in game state, never `os.clock` or `os.time` ([Timers](timers.md#game-time)).

## Lint rules

- [`no-async-value-as-state`](lint-rules/no-async-value-as-state.md): a value that differs between clients (an `@async` Native, `MapPlayer.fromLocal()`, `os.clock`) flowing into game state; share it through `SyncRequest` first.
- [`no-unordered-iteration`](lint-rules/no-unordered-iteration.md): iteration that compiles to `pairs`; use the synced collections.
- [`no-game-state-in-local-branch`](lint-rules/no-game-state-in-local-branch.md): game state changed for one client only.
