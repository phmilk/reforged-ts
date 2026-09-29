---
"reforged-ts": patch
---

`Host`'s doc comment now states that the host election was verified in game on 3.0.0.24268 ([#131](https://github.com/phmilk/reforged-ts/issues/131)), where it called the heuristic unverified. A documentation change, with no behavior change in the game: `config` runs when the map loads in the lobby, `os.clock` tracks wall time there, and with two clients the lobby creator was elected on both, also from slot 1.
