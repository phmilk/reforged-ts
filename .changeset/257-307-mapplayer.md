---
"reforged-ts": major
---

`Item.player` returns the owner as a `MapPlayer`, or `undefined`, instead of the raw `player` handle. `MapPlayer.getTaxRate` takes the other player as a `MapPlayer`, as `MapPlayer.setTaxRate` does, instead of the raw `player` handle.
