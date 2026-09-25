---
"reforged-ts": minor
"eslint-plugin-reforged": minor
---

The rename map has a no-renames marker. A major that removes and renames no public symbol records `{ "kind": "noRenames", "versions": { "from", "to" }, "note" }` in `migration/renames.json` instead of entries, so its version pair is seen as considered; `migration/renames.schema.json` accepts it. `no-legacy-w3ts-names` skips the marker when it reads the map.
