---
"reforged-ts": major
---

`OrderId.Battleroar` and `OrderId.Forkedlightning` hold the game's ids ([#255](https://github.com/phmilk/reforged-ts/issues/255)).

**Breaking change** (detailed in `migration/behaviour-changes.md`): `OrderId.Battleroar` was 852099, the id of `battlestations`, and `OrderId.Forkedlightning` was 852586, the id of `elementalfury`, so code that issued `OrderId.Battleroar` issued `battlestations` and code that issued `OrderId.Forkedlightning` issued `elementalfury`. They are now 852599 and 852587. Code that meant `battlestations` or `elementalfury` uses `OrderId.Battlestations` or `OrderId.Elementalfury`.
