---
"reforged-ts": major
---

`Item.invulnerable` sets the value it is given ([#256](https://github.com/phmilk/reforged-ts/issues/256)).

**Breaking change** (detailed in `migration/behaviour-changes.md`): the setter passed `true` to `SetItemInvulnerable` whatever the value, so `item.invulnerable = false` made the item invulnerable. It now passes its value: `item.invulnerable = false` makes the item vulnerable again. Code that set `false` and relied on the item becoming invulnerable sets `true`.
