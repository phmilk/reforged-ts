---
"reforged-ts": major
"eslint-plugin-reforged": patch
---

`Item.player` is renamed `Item.getOwner()`, named like `Item.setOwner` and `Unit.getOwner`; it returns the owner as a `MapPlayer`, or `undefined`, as `Item.player` did. `Camera.setCameraOrientController` is renamed `Camera.setOrientController`, like its twin `Camera.setTargetController`; it takes the same arguments. The lint plugin's `local-safe.json` lists `Camera.setOrientController` in place of the old name, so `no-game-state-in-local-branch` still lets it through inside a local branch.
