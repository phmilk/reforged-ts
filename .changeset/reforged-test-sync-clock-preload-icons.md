---
"reforged-test": minor
---

Sync send and delivery, a settable clock and local player, the Preload family and ability icon stubs, so a test can watch what the sync, host and file Systems would do in the game: which packets a client sent, what the sync event delivers back, how long a client sat in the lobby, and what a file write was given.

- **`sync.lua`**, a new family: `BlzSendSyncData` is recorded, keeps the packet with its prefix, its data and the local player that sent it, and returns true (a test that needs a network failure overrides it). `__stub_sync_packets()` returns the packets sent so far.
- **`triggers.lua`**: `BlzTriggerRegisterPlayerSyncEvent` also remembers its trigger, player and prefix, a deliberate exception to the rule that a registration keeps nothing beyond its call-log line, because a delivery must find the triggers the game would fire. `__stub_deliver_sync(packet, options?)` fires every enabled trigger registered for the packet's prefix and sender, with `BlzGetTriggerSyncPrefix`, `BlzGetTriggerSyncData`, `GetTriggerPlayer` and `GetTriggeringTrigger` answering from the firing context; `{ cString = true }` cuts the data at its first zero byte, as the game cuts a C string. A packet the test builds simulates one from another library.
- **The baseline**: `os.clock` answers what `__stub_set_clock(seconds)` set, 0.0 until then, and keeps it until the next set.
- **`players.lua`**: `__stub_set_local_player(slot)` makes another slot the local player (slot 0 until then), and `__stub_local_player()` returns its handle without a call-log line.
- **`preloads.lua`**, a new family: `PreloadGenClear`, `PreloadGenStart`, `Preload`, `PreloadGenEnd` and `Preloader` are recorded with their arguments; `__stub_preload_file(filename)` returns the strings the last write of that file was given. `Preloader` only records; a test that emulates a read overrides it.
- **`abilities.lua`**, a new family: `BlzGetAbilityIcon` and `BlzSetAbilityIcon` keep an icon per ability id, with the game's placeholder icon for an id never set.
