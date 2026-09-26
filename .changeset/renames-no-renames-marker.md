---
"reforged-ts": minor
"eslint-plugin-reforged": major
---

The rename map has a no-renames marker. A major that removes and renames no public symbol records `{ "kind": "noRenames", "versions": { "from", "to" }, "note" }` in `migration/renames.json` instead of entries, so its version pair is seen as considered; `migration/renames.schema.json` accepts it. `no-legacy-w3ts-names` skips the marker when it reads the map.

For `eslint-plugin-reforged` this is a major: the shape of a data file it reads from another package changed, and an earlier version of the plugin throws a `DataFileError` at load on a rename map that holds the marker. For `reforged-ts` it is a minor: the schema accepts one more kind of item and every existing entry keeps its shape.
