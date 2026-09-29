---
"reforged-ts": patch
---

`Host`'s doc comment and the Systems guide no longer call the host election unverified: it was checked in game on 3.0.0.24268 ([#131](https://github.com/phmilk/reforged-ts/issues/131)). A documentation change, with no behavior change in the game. `config` runs when the map loads in the lobby, `os.clock` tracks wall time there, and the countdown and loading screen that every client shares cancel out. With two clients, both elected the lobby creator, also when the creator sat in slot 1 and the other player in slot 0.
