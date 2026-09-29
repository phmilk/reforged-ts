---
"reforged-ts": patch
---

`item.invulnerable = false` makes the item vulnerable again. The setter passed `true` to `SetItemInvulnerable` whatever the value, so setting it to `false` made the item invulnerable; it now passes the value it is given.
