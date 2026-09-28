---
"reforged-ts": major
---

`Group.addGroupFast` and `Group.removeGroupFast` change `this`, as their names say ([#260](https://github.com/phmilk/reforged-ts/issues/260)).

**Breaking change** (detailed in `migration/behaviour-changes.md`): the game's `BlzGroupAddGroupFast` and `BlzGroupRemoveGroupFast` change their second group (measured in 3.0.0), and the members passed `this` first, so `a.addGroupFast(b)` added the units of `a` to `b`. They now pass their argument first: `a.addGroupFast(b)` adds the units of `b` to `a`, and `a.removeGroupFast(b)` removes them from `a`. Code that called `a.addGroupFast(b)` to fill `b` calls `b.addGroupFast(a)`, and code that called `a.removeGroupFast(b)` to empty `b` of the units of `a` calls `b.removeGroupFast(a)`.
