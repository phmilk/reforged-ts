---
"eslint-plugin-reforged": minor
---

`no-legacy-w3ts-names` reports the w3ts use of a member that kept its name but not its signature (the rename map's entries whose new name is the old one), with the entry's note: an argument the new parameter does not take (`cache.store(missionKey, key, hero.handle)`), a result used where the new type does not fit (`Unit.fromHandle(cache.restoreUnit(...))`), and a result checked for a missing value when the new type cannot be missing (`restoreUnit` now throws where it returned `undefined`). A call written for the new signature is not reported.
