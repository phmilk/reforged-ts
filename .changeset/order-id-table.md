---
"reforged-ts": patch
---

`OrderId.Instant1` to `Instant4` say in their docs whether the game's order tables confirm their ids. Every other `OrderId` member is now checked against the game's table of order ids, so a wrong value cannot ship unnoticed.
