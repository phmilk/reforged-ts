---
"reforged-ts": major
---

`OrderId.Battleroar` and `OrderId.Forkedlightning` hold the game's ids ([#255](https://github.com/phmilk/reforged-ts/issues/255)).

**Breaking change** (detailed in `migration/behaviour-changes.md`): In w3ts 3.x `OrderId.Battleroar` held the id of `battlestations` (852099) and `OrderId.Forkedlightning` held the id of `elementalfury` (852586); the mix-up went one way only: `OrderId.Battlestations` and `OrderId.Elementalfury` always held the right ids. They are now 852599 and 852587, so both uses change. Code that issued `OrderId.Battleroar` or `OrderId.Forkedlightning` to issue `battlestations` or `elementalfury` issues `OrderId.Battlestations` or `OrderId.Elementalfury`. Code that compared an incoming order id (the order id of an order event, `GetIssuedOrderId`) with `OrderId.Battleroar` or `OrderId.Forkedlightning` to catch `battlestations` or `elementalfury` no longer matches them: it compares with `OrderId.Battlestations` or `OrderId.Elementalfury`.
